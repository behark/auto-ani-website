'use client';

import { logger } from '@/lib/logger';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { format, addDays, parseISO, isFuture, isToday, parse, setHours, setMinutes } from 'date-fns';
// import DOMPurify from 'isomorphic-dompurify'; // Removed to fix SSR issue
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Calendar, Clock, Car, Wrench, Eye, MessageSquare, Truck, AlertTriangle, RefreshCw, X, CheckCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { Vehicle } from '@/lib/types';

// Phone validation regex: digits, spaces, hyphens, plus, parentheses
const phoneRegex = /^[\d\s\-\+\(\)]+$/;

// XSS protection: sanitize text inputs (simple version to avoid SSR issues)
const sanitizeInput = (input: string): string => {
  // Remove any HTML tags and script content
  return input.replace(/<[^>]*>/g, '').trim();
};

// Validate that the date/time is in the future
const isFutureDateTime = (date: string, time: string): boolean => {
  if (!date || !time) return false;

  const [hours, minutes] = time.split(':').map(Number);
  const dateTime = setMinutes(setHours(parseISO(date), hours), minutes);

  return isFuture(dateTime) || (isToday(parseISO(date)) && isFuture(dateTime));
};

const AppointmentSchema = z.object({
  type: z.enum(['TEST_DRIVE', 'INSPECTION', 'SERVICE', 'CONSULTATION', 'DELIVERY']),
  customerName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .transform(sanitizeInput)
    .refine((val) => /^[a-zA-Z\s\-']+$/.test(val), {
      message: 'Name can only contain letters, spaces, hyphens, and apostrophes',
    }),
  customerEmail: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .transform((val) => val.toLowerCase().trim()),
  customerPhone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number must be less than 20 characters')
    .refine((val) => phoneRegex.test(val), {
      message: 'Phone number can only contain digits, spaces, hyphens, parentheses, and plus sign',
    })
    .transform((val) => val.replace(/[^\d\+]/g, '')), // Store only digits and +
  scheduledDate: z
    .string()
    .refine((val) => {
      const date = parseISO(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }, {
      message: 'Appointment date must be today or in the future',
    }),
  scheduledTime: z.string(),
  duration: z.number().min(15).max(480, 'Duration cannot exceed 8 hours'),
  notes: z
    .string()
    .optional()
    .transform((val) => val ? sanitizeInput(val) : val)
    .refine((val) => !val || val.length <= 500, {
      message: 'Notes must be less than 500 characters',
    }),
  reminderMethod: z.enum(['EMAIL', 'SMS', 'PUSH']).optional(),
})
.refine((data) => {
  // Additional validation: ensure date/time combination is in the future
  return isFutureDateTime(data.scheduledDate, data.scheduledTime);
}, {
  message: 'Appointment time must be in the future',
  path: ['scheduledTime'],
})
.refine((data) => {
  // Validate duration matches appointment type
  const appointmentType = appointmentTypes.find(t => t.id === data.type);
  return appointmentType && data.duration === appointmentType.duration;
}, {
  message: 'Duration must match the selected appointment type',
  path: ['duration'],
});

type AppointmentForm = z.infer<typeof AppointmentSchema>;

interface AppointmentSchedulerProps {
  vehicle?: Vehicle;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (appointmentId: string) => void;
}

interface TimeSlot {
  time: string;
  available: boolean;
  duration: number;
}

interface ExistingAppointment {
  id: string;
  type: string;
  customerName: string;
  scheduledDate: string;
  scheduledTime: string;
  status: string;
}

interface ApiRetryState {
  retryCount: number;
  maxRetries: number;
  isRetrying: boolean;
}

interface CalendarErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

// Error Boundary Component for FullCalendar
class CalendarErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  CalendarErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; onError?: (error: Error) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): CalendarErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Calendar Error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>Unable to load the calendar. You can still schedule your appointment by:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Selecting a date manually using the date picker below</li>
                <li>Or calling us directly at our customer service line</li>
              </ul>
              <Button
                variant="outline"
                size="sm"
                onClick={() => this.setState({ hasError: false })}
                className="mt-2"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Try Again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}

const appointmentTypes = [
  {
    id: 'TEST_DRIVE',
    name: 'Test Drive',
    icon: Car,
    description: 'Take the vehicle for a test drive',
    duration: 30,
    requiresVehicle: true,
  },
  {
    id: 'INSPECTION',
    name: 'Vehicle Inspection',
    icon: Eye,
    description: 'Professional vehicle inspection',
    duration: 60,
    requiresVehicle: true,
  },
  {
    id: 'SERVICE',
    name: 'Service Appointment',
    icon: Wrench,
    description: 'Vehicle service and maintenance',
    duration: 120,
    requiresVehicle: false,
  },
  {
    id: 'CONSULTATION',
    name: 'Sales Consultation',
    icon: MessageSquare,
    description: 'Discuss vehicle options and financing',
    duration: 45,
    requiresVehicle: false,
  },
  {
    id: 'DELIVERY',
    name: 'Vehicle Delivery',
    icon: Truck,
    description: 'Schedule vehicle pickup/delivery',
    duration: 30,
    requiresVehicle: true,
  },
];

// Rate limiting tracking
interface RateLimitState {
  attempts: number;
  lastAttempt: number;
  blockedUntil: number | null;
}

const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_BLOCK_DURATION = 300000; // 5 minutes

export default function AppointmentScheduler({
  vehicle,
  isOpen,
  onClose,
  onSuccess,
}: AppointmentSchedulerProps) {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<ExistingAppointment[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [appointmentsError, setAppointmentsError] = useState<string | null>(null);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [apiRetryState, setApiRetryState] = useState<ApiRetryState>({
    retryCount: 0,
    maxRetries: 3,
    isRetrying: false,
  });
  const [rateLimit, setRateLimit] = useState<RateLimitState>({
    attempts: 0,
    lastAttempt: 0,
    blockedUntil: null,
  });
  const [focusedTimeSlotIndex, setFocusedTimeSlotIndex] = useState(-1);
  const [announcements, setAnnouncements] = useState('');

  // Refs for focus management
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);
  const timeSlotGridRef = useRef<HTMLDivElement>(null);
  const firstFocusableElementRef = useRef<HTMLElement | null>(null);
  const lastFocusableElementRef = useRef<HTMLElement | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const initialFormValues = useRef<AppointmentForm | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AppointmentForm>({
    resolver: zodResolver(AppointmentSchema) as any,
    defaultValues: {
      type: 'TEST_DRIVE',
      duration: 30,
      reminderMethod: 'EMAIL',
    },
  });

  const watchedValues = watch();

  // Track form changes for unsaved changes detection
  useEffect(() => {
    if (initialFormValues.current) {
      const hasChanges = JSON.stringify(watchedValues) !== JSON.stringify(initialFormValues.current);
      setHasUnsavedChanges(hasChanges);
    }
  }, [watchedValues]);

  // Store initial form values when component opens
  useEffect(() => {
    if (isOpen && !initialFormValues.current) {
      initialFormValues.current = {
        type: 'TEST_DRIVE',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        scheduledDate: '',
        scheduledTime: '',
        duration: 30,
        notes: '',
        reminderMethod: 'EMAIL',
      };
    }
  }, [isOpen]);

  // Update duration when appointment type changes
  useEffect(() => {
    const selectedType = appointmentTypes.find(type => type.id === watchedValues.type);
    if (selectedType) {
      setValue('duration', selectedType.duration);
    }
  }, [watchedValues.type, setValue]);

  // Focus management for dialog
  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      triggerElementRef.current = document.activeElement as HTMLElement;

      // Focus the first interactive element in the dialog
      setTimeout(() => {
        if (firstFocusableElementRef.current) {
          firstFocusableElementRef.current.focus();
        }
      }, 100);
    } else {
      // Return focus to the trigger element when dialog closes
      if (triggerElementRef.current) {
        triggerElementRef.current.focus();
      }
    }
  }, [isOpen]);

  // Announce date/time changes to screen readers
  useEffect(() => {
    if (selectedDate) {
      const formattedDate = format(parseISO(selectedDate), 'EEEE, MMMM do, yyyy');
      setAnnouncements(`Selected date: ${formattedDate}`);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (watchedValues.scheduledTime && selectedDate) {
      const formattedDate = format(parseISO(selectedDate), 'EEEE, MMMM do');
      setAnnouncements(`Selected appointment: ${formattedDate} at ${watchedValues.scheduledTime}`);
    }
  }, [watchedValues.scheduledTime, selectedDate]);

  // Load existing appointments when component opens
  useEffect(() => {
    if (isOpen) {
      loadExistingAppointments();
    }
  }, [isOpen]);

  // Load available slots when date is selected
  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots(selectedDate);
    }
  }, [selectedDate, vehicle?.id]);

  const retryApiCall = useCallback(async (apiCall: () => Promise<any>, errorMessage: string) => {
    if (apiRetryState.retryCount >= apiRetryState.maxRetries) {
      toast.error(`${errorMessage}. Please try again later or contact support.`);
      setApiRetryState(prev => ({ ...prev, isRetrying: false }));
      return null;
    }

    setApiRetryState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1,
      isRetrying: true
    }));

    try {
      const result = await apiCall();
      setApiRetryState({ retryCount: 0, maxRetries: 3, isRetrying: false });
      return result;
    } catch (error) {
      logger.error('Retry failed:', { error: error instanceof Error ? error.message : String(error) });
      setTimeout(() => {
        retryApiCall(apiCall, errorMessage);
      }, 1000 * apiRetryState.retryCount); // Exponential backoff
      return null;
    }
  }, [apiRetryState]);

  const loadExistingAppointments = async () => {
    setLoadingAppointments(true);
    setAppointmentsError(null);

    try {
      const params = new URLSearchParams();
      if (vehicle?.id) {
        params.append('vehicleId', vehicle.id);
      }

      const response = await fetch(`/api/appointments?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch appointments: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setExistingAppointments(result.appointments);
        toast.success('Appointments loaded successfully');
      } else {
        throw new Error(result.error || 'Failed to load appointments');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setAppointmentsError(errorMessage);
      toast.error(`Unable to load existing appointments: ${errorMessage}`);

      // Retry logic
      if (apiRetryState.retryCount < apiRetryState.maxRetries) {
        toast.loading('Retrying...', { duration: 1000 });
        setTimeout(() => {
          retryApiCall(() => loadExistingAppointments(), 'Failed to load appointments');
        }, 2000);
      }
    } finally {
      setLoadingAppointments(false);
    }
  };

  const loadAvailableSlots = async (date: string) => {
    setLoadingSlots(true);
    setSlotsError(null);

    try {
      const params = new URLSearchParams({
        action: 'availability',
        date,
      });

      if (vehicle?.id) {
        params.append('vehicleId', vehicle.id);
      }

      const response = await fetch(`/api/appointments?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch time slots: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        setAvailableSlots(result.availability || []);
        if ((result.availability || []).length === 0) {
          toast.error('No available time slots for this date. Please try another date.');
        }
      } else {
        throw new Error(result.error || 'Failed to load available time slots');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setSlotsError(errorMessage);
      setAvailableSlots([]);
      toast.error(`Unable to load time slots: ${errorMessage}`);

      // Retry logic for slots
      if (apiRetryState.retryCount < apiRetryState.maxRetries) {
        toast.loading('Retrying...', { duration: 1000 });
        setTimeout(() => {
          retryApiCall(() => loadAvailableSlots(date), 'Failed to load time slots');
        }, 2000);
      }
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateSelect = (selectInfo: { startStr: string; endStr?: string }) => {
    const selectedDateStr = selectInfo.startStr.split('T')[0];
    const selectedDate = parseISO(selectedDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Don't allow past dates
    if (selectedDate < today) {
      toast.error('Cannot schedule appointments in the past');
      return;
    }

    // Don't allow dates more than 90 days in the future
    const maxDate = addDays(today, 90);
    if (selectedDate > maxDate) {
      toast.error('Cannot schedule appointments more than 90 days in advance');
      return;
    }

    setSelectedDate(selectedDateStr);
    setValue('scheduledDate', selectedDateStr);
  };

  const handleTimeSelect = (time: string) => {
    if (!selectedDate) {
      toast.error('Please select a date first');
      return;
    }

    // Validate that the selected time is in the future
    const [hours, minutes] = time.split(':').map(Number);
    const dateTime = setMinutes(setHours(parseISO(selectedDate), hours), minutes);

    if (!isFuture(dateTime) && !isToday(parseISO(selectedDate))) {
      toast.error('Cannot select a time in the past');
      return;
    }

    if (isToday(parseISO(selectedDate)) && dateTime <= new Date()) {
      toast.error('Cannot select a time in the past');
      return;
    }

    setValue('scheduledTime', time);
  };

  // Check rate limiting
  const checkRateLimit = (): boolean => {
    const now = Date.now();

    // Check if currently blocked
    if (rateLimit.blockedUntil && now < rateLimit.blockedUntil) {
      const remainingTime = Math.ceil((rateLimit.blockedUntil - now) / 1000);
      toast.error(`Too many attempts. Please wait ${remainingTime} seconds.`);
      return false;
    }

    // Reset counter if window expired
    if (now - rateLimit.lastAttempt > RATE_LIMIT_WINDOW) {
      setRateLimit({ attempts: 0, lastAttempt: now, blockedUntil: null });
      return true;
    }

    // Check if limit exceeded
    if (rateLimit.attempts >= RATE_LIMIT_MAX_ATTEMPTS) {
      const blockedUntil = now + RATE_LIMIT_BLOCK_DURATION;
      setRateLimit(prev => ({ ...prev, blockedUntil }));
      toast.error(`Too many attempts. Please wait ${RATE_LIMIT_BLOCK_DURATION / 1000} seconds.`);
      return false;
    }

    return true;
  };

  const onSubmit = async (data: AppointmentForm) => {
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }

    if (!data.scheduledTime) {
      toast.error('Please select a time slot');
      return;
    }

    // Check rate limiting
    if (!checkRateLimit()) {
      return;
    }

    // Update rate limit counter
    setRateLimit(prev => ({
      ...prev,
      attempts: prev.attempts + 1,
      lastAttempt: Date.now(),
    }));

    // Final validation: ensure appointment is still in the future
    if (!isFutureDateTime(data.scheduledDate, data.scheduledTime)) {
      toast.error('Appointment time must be in the future');
      return;
    }

    // Validate duration matches appointment type
    const appointmentType = appointmentTypes.find(t => t.id === data.type);
    if (!appointmentType || data.duration !== appointmentType.duration) {
      toast.error('Invalid appointment duration for selected type');
      return;
    }

    setLoading(true);

    try {
      // Enhanced validation with actionable error messages
      if (!data.customerName.trim()) {
        toast.error('Please enter your full name');
        return;
      }

      if (!data.customerEmail.trim()) {
        toast.error('Please enter a valid email address');
        return;
      }

      if (!data.customerPhone.trim()) {
        toast.error('Please enter your phone number');
        return;
      }

      const appointmentData = {
        vehicleId: vehicle?.id,
        type: data.type,
        customerName: data.customerName.trim(),
        customerEmail: data.customerEmail.trim(),
        customerPhone: data.customerPhone.trim(),
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        duration: data.duration,
        notes: data.notes?.trim() || '',
        reminderMethod: data.reminderMethod,
      };

      // Get CSRF token from cookie
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrf_token='))
        ?.split('=')[1];

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        body: JSON.stringify(appointmentData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error (${response.status}): ${errorText || response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        const appointmentType = appointmentTypes.find(t => t.id === data.type);
        const formattedDate = format(parseISO(data.scheduledDate), 'MMMM dd, yyyy');

        // Enhanced success message with appointment details
        toast.success(
          <div className="space-y-1">
            <div className="font-semibold">Appointment Scheduled Successfully!</div>
            <div className="text-sm text-gray-600">
              {appointmentType?.name} on {formattedDate} at {data.scheduledTime}
            </div>
            <div className="text-sm text-gray-600">
              Confirmation email sent to {data.customerEmail}
            </div>
          </div>,
          {
            duration: 6000,
            icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          }
        );

        onSuccess?.(result.appointment.id);
        setHasUnsavedChanges(false);
        handleClose();
      } else {
        const errorMessage = result.error || 'Failed to schedule appointment';
        toast.error(
          <div className="space-y-1">
            <div className="font-semibold">Booking Failed</div>
            <div className="text-sm">{errorMessage}</div>
            <div className="text-sm text-gray-600">
              Please try again or contact our customer service
            </div>
          </div>,
          { duration: 5000 }
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Appointment booking error:', { error: error instanceof Error ? error.message : String(error) });

      toast.error(
        <div className="space-y-1">
          <div className="font-semibold">Connection Error</div>
          <div className="text-sm">{errorMessage}</div>
          <div className="text-sm text-gray-600">
            Please check your internet connection and try again
          </div>
        </div>,
        {
          duration: 6000,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true);
      return;
    }

    performClose();
  };

  const performClose = () => {
    setSelectedDate(null);
    setAvailableSlots([]);
    setAppointmentsError(null);
    setSlotsError(null);
    setCalendarError(null);
    setHasUnsavedChanges(false);
    setShowUnsavedDialog(false);
    setApiRetryState({ retryCount: 0, maxRetries: 3, isRetrying: false });
    initialFormValues.current = null;
    setFocusedTimeSlotIndex(-1);
    setAnnouncements('');
    reset();
    onClose();
  };

  const handleCalendarError = (error: Error) => {
    setCalendarError(error.message);
    toast.error('Calendar failed to load. You can still book by selecting a date manually.');
  };

  // Tooltip component for disabled appointment types
  const TooltipWrapper = ({ children, content, disabled }: {
    children: React.ReactNode;
    content: string;
    disabled: boolean;
  }) => {
    if (!disabled) return <>{children}</>;

    return (
      <div className="relative group">
        {children}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    );
  };

  // Unsaved Changes Confirmation Dialog
  const UnsavedChangesDialog = () => (
    <Dialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Unsaved Changes
          </DialogTitle>
          <DialogDescription>
            You have unsaved changes to your appointment. Are you sure you want to close without saving?
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => setShowUnsavedDialog(false)}
          >
            Continue Editing
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setShowUnsavedDialog(false);
              performClose();
            }}
          >
            Discard Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // Keyboard navigation for time slots
  const handleTimeSlotKeyDown = useCallback((event: React.KeyboardEvent, index: number) => {
    const slotsPerRow = 3;
    const totalSlots = availableSlots.length;
    let newIndex = index;

    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        newIndex = index < totalSlots - 1 ? index + 1 : 0;
        break;
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = index > 0 ? index - 1 : totalSlots - 1;
        break;
      case 'ArrowDown':
        event.preventDefault();
        newIndex = index + slotsPerRow < totalSlots ? index + slotsPerRow : index % slotsPerRow;
        break;
      case 'ArrowUp':
        event.preventDefault();
        newIndex = index - slotsPerRow >= 0 ? index - slotsPerRow : Math.floor((totalSlots - 1) / slotsPerRow) * slotsPerRow + (index % slotsPerRow);
        if (newIndex >= totalSlots) {
          newIndex = Math.max(0, totalSlots - slotsPerRow + (index % slotsPerRow));
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        const slot = availableSlots[index];
        if (slot && slot.available) {
          handleTimeSelect(slot.time);
        }
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = totalSlots - 1;
        break;
    }

    if (newIndex !== index) {
      setFocusedTimeSlotIndex(newIndex);
      // Focus the new time slot button
      const timeSlotButton = timeSlotGridRef.current?.children[newIndex] as HTMLButtonElement;
      if (timeSlotButton) {
        timeSlotButton.focus();
      }
    }
  }, [availableSlots, handleTimeSelect]);

  // Handle dialog keyboard shortcuts
  const handleDialogKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        handleClose();
        break;
    }
  }, [handleClose]);

  // Focus trap for dialog
  const handleTabKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    const focusableElements = dialogRef.current?.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])'
    ) as NodeListOf<HTMLElement>;

    if (!focusableElements || focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab: move focus backward
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab: move focus forward
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }, []);

  // Prepare events for FullCalendar
  const calendarEvents = existingAppointments.map(appointment => ({
    id: appointment.id,
    title: `${appointment.type.replace('_', ' ')} - ${appointment.customerName}`,
    start: `${appointment.scheduledDate.split('T')[0]}T${appointment.scheduledTime}`,
    end: `${appointment.scheduledDate.split('T')[0]}T${appointment.scheduledTime}`,
    backgroundColor: appointment.status === 'CONFIRMED' ? '#10b981' : '#f59e0b',
    borderColor: appointment.status === 'CONFIRMED' ? '#10b981' : '#f59e0b',
  }));

  return (
    <>
      {/* Screen reader announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {announcements}
      </div>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent
          ref={dialogRef}
          className="max-w-4xl max-h-[90vh] overflow-y-auto focus:outline-none"
          role="dialog"
          aria-modal="true"
          aria-labelledby="appointment-dialog-title"
          aria-describedby="appointment-dialog-description"
          onKeyDown={(e) => {
            handleDialogKeyDown(e);
            handleTabKeyPress(e);
          }}
        >
          {/* Skip link for keyboard users */}
          <a
            href="#calendar-section"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-3 py-2 rounded z-50"
          >
            Skip to calendar
          </a>

          <DialogHeader>
            <DialogTitle
              id="appointment-dialog-title"
              className="text-xl font-semibold"
            >
              Schedule Appointment
            </DialogTitle>
            <DialogDescription
              id="appointment-dialog-description"
              className="text-gray-600"
            >
              {vehicle
                ? `Book an appointment for ${vehicle.make} ${vehicle.model} ${vehicle.year}`
                : 'Book an appointment with AUTO ANI'}
            </DialogDescription>
          </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
          noValidate
          aria-label="Appointment booking form"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Form */}
            <div className="space-y-6">
              {/* Error Display */}
              {appointmentsError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p>Unable to load existing appointments: {appointmentsError}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadExistingAppointments()}
                        disabled={loadingAppointments}
                      >
                        {loadingAppointments ? (
                          <LoadingSpinner className="w-4 h-4 mr-1" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-1" />
                        )}
                        Retry
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Appointment Type */}
              <Card>
                <CardHeader>
                  <CardTitle
                    className="text-lg"
                    id="appointment-type-heading"
                    role="heading"
                    aria-level={2}
                  >
                    Appointment Type
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={watchedValues.type}
                    onValueChange={(value) => {
                      // Type-safe appointment type selection
                      const validTypes = ['TEST_DRIVE', 'INSPECTION', 'SERVICE', 'CONSULTATION', 'DELIVERY'] as const;
                      if (validTypes.includes(value as typeof validTypes[number])) {
                        setValue('type', value as typeof validTypes[number]);
                      }
                    }}
                    aria-labelledby="appointment-type-heading"
                    aria-describedby="appointment-type-description"
                  >
                    <div id="appointment-type-description" className="sr-only">
                      Choose the type of appointment you would like to schedule. Each type has a different duration.
                    </div>
                    {appointmentTypes.map((type) => {
                      const Icon = type.icon;
                      const isDisabled = type.requiresVehicle && !vehicle;
                      const tooltipContent = isDisabled
                        ? 'This appointment type requires selecting a specific vehicle first'
                        : '';

                      return (
                        <TooltipWrapper
                          key={type.id}
                          content={tooltipContent}
                          disabled={isDisabled}
                        >
                          <div
                            className={`flex items-center space-x-2 ${
                              isDisabled ? 'opacity-50' : ''
                            }`}
                          >
                            <RadioGroupItem
                              value={type.id}
                              id={type.id}
                              disabled={isDisabled}
                              aria-describedby={`${type.id}-description`}
                            />
                            <Label
                              htmlFor={type.id}
                              className="flex-1 cursor-pointer"
                              aria-label={`${type.name}: ${type.description}, ${type.duration} minutes${isDisabled ? ', requires vehicle selection' : ''}`}
                            >
                              <div className="flex items-center space-x-3">
                                <Icon className="w-5 h-5" aria-hidden="true" />
                                <div>
                                  <div className="font-medium flex items-center gap-2">
                                    {type.name}
                                    {isDisabled && (
                                      <Info className="w-4 h-4 text-gray-400" />
                                    )}
                                  </div>
                                  <div
                                    className="text-sm text-gray-600"
                                    id={`${type.id}-description`}
                                  >
                                    {type.description} ({type.duration} min)
                                    {isDisabled && (
                                      <span className="text-red-500 ml-1">
                                        (Requires vehicle selection)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </Label>
                          </div>
                        </TooltipWrapper>
                      );
                    })}
                  </RadioGroup>
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle
                    className="text-lg"
                    id="customer-info-heading"
                    role="heading"
                    aria-level={2}
                  >
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent
                  className="space-y-4"
                  role="group"
                  aria-labelledby="customer-info-heading"
                >
                  <div>
                    <Label htmlFor="customerName">Full Name *</Label>
                    <Input
                      id="customerName"
                      {...register('customerName')}
                      placeholder="Enter your full name"
                      maxLength={100}
                      pattern="[a-zA-Z\s\-']+"
                      title="Name can only contain letters, spaces, hyphens, and apostrophes"
                      aria-required="true"
                      aria-invalid={errors.customerName ? 'true' : 'false'}
                      aria-describedby={errors.customerName ? 'customerName-error' : undefined}
                    />
                    {errors.customerName && (
                      <p
                        id="customerName-error"
                        className="text-sm text-red-500 mt-1"
                        role="alert"
                        aria-live="polite"
                      >
                        {errors.customerName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="customerEmail">Email Address *</Label>
                    <Input
                      id="customerEmail"
                      type="email"
                      {...register('customerEmail')}
                      placeholder="Enter your email"
                      maxLength={255}
                      autoComplete="email"
                      aria-required="true"
                      aria-invalid={errors.customerEmail ? 'true' : 'false'}
                      aria-describedby={errors.customerEmail ? 'customerEmail-error' : undefined}
                    />
                    {errors.customerEmail && (
                      <p
                        id="customerEmail-error"
                        className="text-sm text-red-500 mt-1"
                        role="alert"
                        aria-live="polite"
                      >
                        {errors.customerEmail.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="customerPhone">Phone Number *</Label>
                    <Input
                      id="customerPhone"
                      {...register('customerPhone')}
                      placeholder="Enter your phone number (10+ digits)"
                      maxLength={20}
                      pattern="[\d\s\-\+\(\)]+"
                      title="Phone number can only contain digits, spaces, hyphens, parentheses, and plus sign"
                      autoComplete="tel"
                      aria-required="true"
                      aria-invalid={errors.customerPhone ? 'true' : 'false'}
                      aria-describedby={errors.customerPhone ? 'customerPhone-error' : undefined}
                    />
                    {errors.customerPhone && (
                      <p
                        id="customerPhone-error"
                        className="text-sm text-red-500 mt-1"
                        role="alert"
                        aria-live="polite"
                      >
                        {errors.customerPhone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="reminderMethod">Reminder Method</Label>
                    <Select
                      value={watchedValues.reminderMethod}
                      onValueChange={(value) => {
                        // Type-safe reminder method selection
                        const validMethods = ['EMAIL', 'SMS', 'PUSH'] as const;
                        if (validMethods.includes(value as typeof validMethods[number])) {
                          setValue('reminderMethod', value as typeof validMethods[number]);
                        }
                      }}
                    >
                      <SelectTrigger
                        aria-label="Select reminder method"
                        aria-describedby="reminder-method-description"
                      >
                        <SelectValue placeholder="Select reminder method" />
                      </SelectTrigger>
                      <SelectContent role="listbox">
                        <SelectItem value="EMAIL" aria-label="Email reminder">Email</SelectItem>
                        <SelectItem value="SMS" aria-label="SMS text message reminder">SMS</SelectItem>
                        <SelectItem value="PUSH" aria-label="Push notification reminder">Push Notification</SelectItem>
                      </SelectContent>
                    </Select>
                    <div id="reminder-method-description" className="sr-only">
                      Choose how you would like to be reminded about your appointment
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      {...register('notes')}
                      placeholder="Any special requests or notes... (max 500 characters)"
                      rows={3}
                      maxLength={500}
                      aria-describedby="notes-description"
                      aria-label="Additional notes or special requests for your appointment"
                    />
                    <div id="notes-description" className="sr-only">
                      Optional field for any special requests or additional information about your appointment
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Calendar and Time Slots */}
            <div className="space-y-6">
              {/* Calendar */}
              <Card id="calendar-section">
                <CardHeader>
                  <CardTitle
                    className="text-lg flex items-center"
                    id="calendar-heading"
                    role="heading"
                    aria-level={2}
                  >
                    <Calendar className="w-5 h-5 mr-2" aria-hidden="true" />
                    Select Date
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingAppointments ? (
                    <div className="h-64 flex items-center justify-center">
                      <div className="text-center space-y-2">
                        <LoadingSpinner className="w-8 h-8 mx-auto" />
                        <p className="text-sm text-gray-600">Loading calendar...</p>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="h-64"
                      role="application"
                      aria-label="Calendar for selecting appointment date"
                      aria-describedby="calendar-instructions"
                    >
                      <div id="calendar-instructions" className="sr-only">
                        Use the calendar to select your preferred appointment date.
                        You can navigate between months using the previous and next buttons.
                        Click on a date to select it for your appointment.
                      </div>
                      <CalendarErrorBoundary onError={handleCalendarError}>
                        <FullCalendar
                          plugins={[dayGridPlugin, interactionPlugin]}
                          initialView="dayGridMonth"
                          selectable={true}
                          selectMirror={true}
                          dayMaxEvents={true}
                          weekends={true}
                          events={calendarEvents}
                          select={handleDateSelect}
                          validRange={{
                            start: format(new Date(), 'yyyy-MM-dd'),
                            end: format(addDays(new Date(), 90), 'yyyy-MM-dd'),
                          }}
                          height="auto"
                          headerToolbar={{
                            left: 'prev,next',
                            center: 'title',
                            right: '',
                          }}
                          loading={(isLoading) => setLoadingCalendar(isLoading)}
                        />
                      </CalendarErrorBoundary>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Time Slots */}
              {selectedDate && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
                      Available Times
                      <Badge variant="outline" className="ml-2">
                        {format(parseISO(selectedDate), 'MMM dd, yyyy')}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {slotsError ? (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-2">
                            <p>Unable to load time slots: {slotsError}</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => selectedDate && loadAvailableSlots(selectedDate)}
                              disabled={loadingSlots}
                            >
                              {loadingSlots ? (
                                <LoadingSpinner className="w-4 h-4 mr-1" />
                              ) : (
                                <RefreshCw className="w-4 h-4 mr-1" />
                              )}
                              Retry
                            </Button>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ) : loadingSlots ? (
                      <div className="flex justify-center py-4">
                        <div className="text-center space-y-2">
                          <LoadingSpinner />
                          <p className="text-sm text-gray-600">Loading available times...</p>
                        </div>
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {availableSlots.map((slot) => (
                          <Button
                            key={slot.time}
                            type="button"
                            variant={
                              watchedValues.scheduledTime === slot.time
                                ? 'default'
                                : 'outline'
                            }
                            size="sm"
                            onClick={() => handleTimeSelect(slot.time)}
                            disabled={!slot.available}
                            title={!slot.available ? 'This time slot is not available' : ''}
                          >
                            {slot.time}
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 space-y-2">
                        <Clock className="w-8 h-8 text-gray-400 mx-auto" />
                        <p className="text-gray-600">
                          No available time slots for this date
                        </p>
                        <p className="text-sm text-gray-500">
                          Please try selecting a different date
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Card>
            <CardContent className="pt-6">
              <Button
                type="submit"
                className="w-full bg-[var(--primary-orange)] hover:bg-[var(--primary-dark)]"
                disabled={loading || !selectedDate || !watchedValues.scheduledTime}
                size="lg"
              >
                {loading ? (
                  <>
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                    Scheduling Appointment...
                  </>
                ) : (
                  'Schedule Appointment'
                )}
              </Button>
            </CardContent>
          </Card>
        </form>

        <UnsavedChangesDialog />
      </DialogContent>
    </Dialog>
    </>
  );
}