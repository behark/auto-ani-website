'use client';

import { logger } from '@/lib/logger';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
// Import LoadingSpinner component
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Define appointmentTypes before using it in the schema
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
] as const;
import { Calendar, Clock, Car, Wrench, Eye, MessageSquare, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
// Import Vehicle type from our lib/types
interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  fuelType: string;
  transmission: string;
  bodyType: string;
  color: string;
  engineSize: string;
  drivetrain: string;
  features: string[];
  images: string[];
  description: string;
  featured: boolean;
  status: string;
  slug?: string;
  vin?: string;
  doors?: number;
  seats?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

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

// Already defined above after imports

// Rate limiting tracking
interface RateLimitState {
  attempts: number;
  lastAttempt: number;
  blockedUntil: number | null;
}

const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_BLOCK_DURATION = 300000; // 5 minutes

// Memoized Time Slot Button for better performance
const TimeSlotButton = React.memo(({
  slot,
  isSelected,
  onSelect,
  onKeyDown,
  index,
}: {
  slot: TimeSlot;
  isSelected: boolean;
  onSelect: (time: string) => void;
  onKeyDown: (event: React.KeyboardEvent, index: number) => void;
  index: number;
}) => (
  <Button
    type="button"
    variant={isSelected ? 'default' : 'outline'}
    size="sm"
    onClick={() => onSelect(slot.time)}
    disabled={!slot.available}
    onKeyDown={(e) => onKeyDown(e, index)}
    tabIndex={0}
    role="option"
    aria-selected={isSelected}
    aria-label={`Time slot ${slot.time}${!slot.available ? ' (unavailable)' : ''}`}
  >
    {slot.time}
  </Button>
));
TimeSlotButton.displayName = 'TimeSlotButton';

// Memoized Appointment Type Radio Item
const AppointmentTypeItem = React.memo(({
  type,
  isDisabled,
  isSelected,
}: {
  type: {
    readonly id: string;
    readonly name: string;
    readonly icon: React.ComponentType<any>;
    readonly description: string;
    readonly duration: number;
    readonly requiresVehicle: boolean;
  };
  isDisabled: boolean;
  isSelected: boolean;
}) => {
  const Icon = type.icon;

  return (
    <div
      className={`flex items-center space-x-2 ${isDisabled ? 'opacity-50' : ''}`}
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
            <div className="font-medium">{type.name}</div>
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
  );
});
AppointmentTypeItem.displayName = 'AppointmentTypeItem';

function AppointmentScheduler({
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

  // Only watch the specific fields we need for performance
  const watchedType = watch('type');
  const watchedReminderMethod = watch('reminderMethod');
  const watchedScheduledTime = watch('scheduledTime');

  // Update duration when appointment type changes
  useEffect(() => {
    const selectedType = appointmentTypes.find(type => type.id === watchedType);
    if (selectedType) {
      setValue('duration', selectedType.duration);
    }
  }, [watchedType, setValue]);

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
    if (watchedScheduledTime && selectedDate) {
      const formattedDate = format(parseISO(selectedDate), 'EEEE, MMMM do');
      setAnnouncements(`Selected appointment: ${formattedDate} at ${watchedScheduledTime}`);
    }
  }, [watchedScheduledTime, selectedDate]);

  // Load existing appointments when component opens
  useEffect(() => {
    if (isOpen) {
      loadExistingAppointments();
    }
  }, [isOpen]);

  // Load available slots when date is selected
  useEffect(() => {
    if (selectedDate && vehicle?.id !== undefined) {
      loadAvailableSlots(selectedDate);
    }
  }, [selectedDate, vehicle?.id]);

  const loadExistingAppointments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (vehicle?.id) {
        params.append('vehicleId', vehicle.id);
      }

      const response = await fetch(`/api/appointments?${params}`);
      const result = await response.json();

      if (result.success) {
        setExistingAppointments(result.appointments);
      }
    } catch (error) {
      logger.error('Error loading appointments:', { error: error instanceof Error ? error.message : String(error) });
    }
  }, [vehicle?.id]);

  const loadAvailableSlots = useCallback(async (date: string) => {
    setLoadingSlots(true);
    try {
      const params = new URLSearchParams({
        action: 'availability',
        date,
      });

      if (vehicle?.id) {
        params.append('vehicleId', vehicle.id);
      }

      const response = await fetch(`/api/appointments?${params}`);
      const result = await response.json();

      if (result.success) {
        setAvailableSlots(result.availability || []);
      } else {
        setAvailableSlots([]);
      }
    } catch (error) {
      logger.error('Error loading slots:', { error: error instanceof Error ? error.message : String(error) });
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [vehicle?.id]);

  const handleDateSelect = useCallback((selectInfo: { startStr: string; endStr?: string }) => {
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

    // Batch state updates
    setSelectedDate(selectedDateStr);
    setValue('scheduledDate', selectedDateStr);
  }, [setValue]);

  const handleTimeSelect = useCallback((time: string) => {
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
  }, [selectedDate, setValue]);

  // Check rate limiting
  const checkRateLimit = useCallback((): boolean => {
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
  }, [rateLimit]);

  const onSubmit = useCallback(async (data: AppointmentForm) => {
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
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleId: vehicle?.id,
          type: data.type,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerPhone: data.customerPhone,
          scheduledDate: data.scheduledDate,
          scheduledTime: data.scheduledTime,
          duration: data.duration,
          notes: data.notes,
          reminderMethod: data.reminderMethod,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Appointment scheduled successfully!');
        onSuccess?.(result.appointment.id);
        handleClose();
      } else {
        toast.error(result.error || 'Failed to schedule appointment');
      }
    } catch (error) {
      logger.error('Appointment error:', { error: error instanceof Error ? error.message : String(error) });
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, vehicle?.id, onSuccess, checkRateLimit]);

  const handleClose = useCallback(() => {
    // Batch state updates
    setSelectedDate(null);
    setAvailableSlots([]);
    setFocusedTimeSlotIndex(-1);
    setAnnouncements('');
    reset();
    onClose();
  }, [reset, onClose]);

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

  // Memoize calendar events to prevent recreation on every render
  const calendarEvents = useMemo(() =>
    existingAppointments.map(appointment => ({
      id: appointment.id,
      title: `${appointment.type.replace('_', ' ')} - ${appointment.customerName}`,
      start: `${appointment.scheduledDate.split('T')[0]}T${appointment.scheduledTime}`,
      end: `${appointment.scheduledDate.split('T')[0]}T${appointment.scheduledTime}`,
      backgroundColor: appointment.status === 'CONFIRMED' ? '#10b981' : '#f59e0b',
      borderColor: appointment.status === 'CONFIRMED' ? '#10b981' : '#f59e0b',
    })),
    [existingAppointments]
  );

  // Memoized handlers for child components
  const handleTypeChange = useCallback((value: string) => {
    const validTypes = ['TEST_DRIVE', 'INSPECTION', 'SERVICE', 'CONSULTATION', 'DELIVERY'] as const;
    if (validTypes.includes(value as typeof validTypes[number])) {
      setValue('type', value as typeof validTypes[number]);
    }
  }, [setValue]);

  const handleReminderChange = useCallback((value: string) => {
    const validMethods = ['EMAIL', 'SMS', 'PUSH'] as const;
    if (validMethods.includes(value as typeof validMethods[number])) {
      setValue('reminderMethod', value as typeof validMethods[number]);
    }
  }, [setValue]);

  // Virtualized rendering for time slots (simple implementation)
  const renderTimeSlots = useMemo(() => {
    if (loadingSlots) {
      return (
        <div className="flex justify-center py-4">
          <LoadingSpinner />
        </div>
      );
    }

    if (availableSlots.length === 0) {
      return (
        <p className="text-gray-600 text-center py-4">
          No available time slots for this date
        </p>
      );
    }

    // For better performance with many slots, implement windowing
    const MAX_VISIBLE_SLOTS = 24; // Adjust based on UI requirements
    const visibleSlots = availableSlots.slice(0, MAX_VISIBLE_SLOTS);
    const hasMoreSlots = availableSlots.length > MAX_VISIBLE_SLOTS;

    return (
      <>
        <div
          ref={timeSlotGridRef}
          className="grid grid-cols-3 gap-2"
          role="listbox"
          aria-label="Available time slots"
        >
          {visibleSlots.map((slot, index) => (
            <TimeSlotButton
              key={slot.time}
              slot={slot}
              isSelected={watchedScheduledTime === slot.time}
              onSelect={handleTimeSelect}
              onKeyDown={handleTimeSlotKeyDown}
              index={index}
            />
          ))}
        </div>
        {hasMoreSlots && (
          <div className="mt-2 text-sm text-gray-600 text-center">
            Showing {MAX_VISIBLE_SLOTS} of {availableSlots.length} time slots
          </div>
        )}
      </>
    );
  }, [loadingSlots, availableSlots, watchedScheduledTime, handleTimeSelect, handleTimeSlotKeyDown]);

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
                      value={watchedType}
                      onValueChange={handleTypeChange}
                      aria-labelledby="appointment-type-heading"
                      aria-describedby="appointment-type-description"
                    >
                      <div id="appointment-type-description" className="sr-only">
                        Choose the type of appointment you would like to schedule. Each type has a different duration.
                      </div>
                      {appointmentTypes.map((type) => (
                        <AppointmentTypeItem
                          key={type.id}
                          type={type}
                          isDisabled={type.requiresVehicle && !vehicle}
                          isSelected={watchedType === type.id}
                        />
                      ))}
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
                        value={watchedReminderMethod}
                        onValueChange={handleReminderChange}
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
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Time Slots */}
                {selectedDate && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center">
                        <Clock className="w-5 h-5 mr-2" aria-hidden="true" />
                        Available Times
                        <Badge variant="outline" className="ml-2">
                          {format(parseISO(selectedDate), 'MMM dd, yyyy')}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {renderTimeSlots}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Card>
              <CardContent className="pt-6">
                <Button
                  ref={(el) => {
                    if (el) {
                      lastFocusableElementRef.current = el;
                    }
                  }}
                  type="submit"
                  className="w-full bg-[var(--primary-orange)] hover:bg-[var(--primary-dark)]"
                  disabled={loading || !selectedDate || !watchedScheduledTime}
                  size="lg"
                  aria-label={loading ? 'Scheduling appointment...' : 'Schedule appointment'}
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
        </DialogContent>
      </Dialog>
    </>
  );
}

// Wrap the component with React.memo for performance
export default React.memo(AppointmentScheduler);