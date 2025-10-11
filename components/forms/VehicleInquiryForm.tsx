'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AccessibleForm,
  AccessibleInput,
  AccessibleTextarea,
  AccessibleSelect,
  AccessibleCheckbox,
  FormSuccess
} from '@/components/ui/AccessibleForm';
import {
  vehicleInquirySchema,
  sanitizeInput,
  sanitizeEmail,
  sanitizePhone,
  generateCSRFToken,
  RateLimiter,
  createSecureFormSubmission
} from '@/lib/formValidation';
import { useGDPRAnalytics } from '@/components/privacy/GDPRProvider';
import { useAccessibilityContext } from '@/components/accessibility/AccessibilityProvider';
import {
  Shield,
  Send,
  AlertTriangle,
  CheckCircle,
  Clock,
  Car,
  MessageSquare,
  Lock
} from 'lucide-react';
import { z } from 'zod';

type VehicleInquiryData = z.infer<typeof vehicleInquirySchema>;

interface VehicleInquiryFormProps {
  className?: string;
  onSuccess?: (data: VehicleInquiryData) => void;
  vehicleId: string;
  vehicleTitle: string;
  vehiclePrice: number;
}

// Rate limiter instance for vehicle inquiries
const inquiryRateLimiter = new RateLimiter(2, 5 * 60 * 1000); // 2 inquiries per 5 minutes

export default function VehicleInquiryForm({
  className = '',
  onSuccess,
  vehicleId,
  vehicleTitle,
  vehiclePrice
}: VehicleInquiryFormProps) {
  const { trackEvent } = useGDPRAnalytics();
  const { announce } = useAccessibilityContext();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [csrfToken, setCSRFToken] = useState('');
  const [rateLimitExceeded, setRateLimitExceeded] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(2);
  const [resetTime, setResetTime] = useState(0);
  const [securityWarnings, setSecurityWarnings] = useState<string[]>([]);

  const honeypotRef = useRef<HTMLInputElement>(null);
  const formStartTime = useRef<number>(Date.now());
  const userIdentifier = useRef<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<VehicleInquiryData>({
    resolver: zodResolver(vehicleInquirySchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      vehicleId,
      financingInterested: false,
      preferredContact: 'email' as const,
      inquiryType: 'GENERAL',
      message: `I&apos;m interested in the ${vehicleTitle} priced at $${vehiclePrice.toLocaleString()}. Please contact me with more information.`,
      honeypot: '',
      captcha: '',
      consent: false
    }
  });

  // Initialize security measures
  useEffect(() => {
    // Generate CSRF token
    setCSRFToken(generateCSRFToken());

    // Create user identifier
    userIdentifier.current = `inquiry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Check rate limiting
    const identifier = userIdentifier.current;
    const allowed = inquiryRateLimiter.isAllowed(identifier);
    setRateLimitExceeded(!allowed);
    setRemainingAttempts(inquiryRateLimiter.getRemainingAttempts(identifier));
    setResetTime(inquiryRateLimiter.getResetTime(identifier));

    // Security warning if form loads too quickly
    const loadTime = Date.now() - formStartTime.current;
    if (loadTime < 100) {
      setSecurityWarnings(prev => [...prev, 'Rapid form loading detected']);
    }
  }, []);

  // Real-time input validation and sanitization
  const handleInputChange = (field: keyof VehicleInquiryData, value: string) => {
    let sanitizedValue = value;

    switch (field) {
      case 'name':
        sanitizedValue = sanitizeInput(value);
        break;
      case 'email':
        sanitizedValue = sanitizeEmail(value);
        break;
      case 'phone':
        sanitizedValue = sanitizePhone(value);
        break;
      case 'message':
        sanitizedValue = sanitizeInput(value);
        break;
    }

    setValue(field, sanitizedValue);
  };

  // Honeypot monitoring
  useEffect(() => {
    const honeypot = honeypotRef.current;
    if (honeypot) {
      const observer = new MutationObserver(() => {
        if (honeypot.value) {
          setSecurityWarnings(prev => [...prev, 'Honeypot field filled - potential bot']);
        }
      });
      observer.observe(honeypot, { attributes: true, childList: true, subtree: true });
      return () => observer.disconnect();
    }
  }, []);

  // Simple CAPTCHA implementation
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  useEffect(() => {
    generateCaptcha();
  }, []);

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operation = Math.random() > 0.5 ? '+' : '-';

    if (operation === '+') {
      setCaptchaQuestion(`${num1} + ${num2} = ?`);
      setCaptchaAnswer((num1 + num2).toString());
    } else {
      const larger = Math.max(num1, num2);
      const smaller = Math.min(num1, num2);
      setCaptchaQuestion(`${larger} - ${smaller} = ?`);
      setCaptchaAnswer((larger - smaller).toString());
    }
  };

  const onSubmit = async (data: VehicleInquiryData) => {
    // Security checks
    const submissionTime = Date.now() - formStartTime.current;
    const identifier = userIdentifier.current;

    // Check if form was submitted too quickly
    if (submissionTime < 2000) {
      setSecurityWarnings(prev => [...prev, 'Form submitted too quickly']);
      announce('Security warning: Form submitted too quickly', 'assertive');
      return;
    }

    // Check rate limiting
    if (!inquiryRateLimiter.isAllowed(identifier)) {
      setRateLimitExceeded(true);
      setRemainingAttempts(0);
      setResetTime(inquiryRateLimiter.getResetTime(identifier));
      announce('Rate limit exceeded. Please try again later.', 'assertive');
      return;
    }

    // Validate CAPTCHA
    if (data.captcha !== captchaAnswer) {
      announce('CAPTCHA verification failed', 'assertive');
      generateCaptcha(); // Generate new CAPTCHA
      setValue('captcha', '');
      return;
    }

    // Check honeypot
    if (data.honeypot) {
      logger.debug('Bot detected via honeypot');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create secure form submission
      const secureSubmission = createSecureFormSubmission(data, csrfToken);

      // Simulate API call with security headers
      const response = await fetch('/api/vehicle-inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(secureSubmission)
      });

      if (response.ok) {
        setIsSuccess(true);
        announce('Vehicle inquiry sent successfully!', 'polite');
        trackEvent('vehicle_inquiry_submitted', {
          vehicle_id: vehicleId,
          financing_interested: data.financingInterested,
          preferred_contact: data.preferredContact
        });

        if (onSuccess) {
          onSuccess(data);
        }

        // Reset form after success
        reset();
      } else {
        throw new Error('Failed to send inquiry');
      }
    } catch (error) {
      logger.error('Inquiry submission error:', { error: error instanceof Error ? error.message : String(error) });
      announce('Failed to send inquiry. Please try again.', 'assertive');
      trackEvent('vehicle_inquiry_error', {
        error: 'submission_failed',
        vehicle_id: vehicleId
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rate limit countdown
  useEffect(() => {
    if (rateLimitExceeded && resetTime > Date.now()) {
      const interval = setInterval(() => {
        const remaining = Math.ceil((resetTime - Date.now()) / 1000);
        if (remaining <= 0) {
          setRateLimitExceeded(false);
          setRemainingAttempts(2);
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [rateLimitExceeded, resetTime]);

  if (isSuccess) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <FormSuccess
            title="Inquiry Sent Successfully!"
            message={`Thank you for your interest in the ${vehicleTitle}. We&apos;ll contact you within 24 hours using your preferred method.`}
            action={
              <Button
                onClick={() => {
                  setIsSuccess(false);
                  reset();
                  generateCaptcha();
                }}
                variant="outline"
              >
                Send Another Inquiry
              </Button>
            }
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Car className="h-6 w-6" />
          Vehicle Inquiry
          <Shield className="h-5 w-5 text-green-500" />
        </CardTitle>
        <p className="text-gray-600">
          Interested in: <strong>{vehicleTitle}</strong>
        </p>
      </CardHeader>

      <CardContent className="p-6">
        {/* Security warnings */}
        {securityWarnings.length > 0 && (
          <Alert className="mb-4 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-700">
              <strong>Security Notice:</strong> Unusual activity detected. Please contact us directly if you're having trouble.
            </AlertDescription>
          </Alert>
        )}

        {/* Rate limiting warning */}
        {rateLimitExceeded && (
          <Alert className="mb-4 border-orange-200 bg-orange-50">
            <Clock className="h-4 w-4" />
            <AlertDescription className="text-orange-700">
              <strong>Rate limit exceeded.</strong> You can try again in {Math.ceil((resetTime - Date.now()) / 1000)} seconds.
              This helps protect against spam.
            </AlertDescription>
          </Alert>
        )}

        <AccessibleForm
          title="Send vehicle inquiry"
          description="Fill out this form to inquire about this vehicle. We'll respond using your preferred contact method."
          onSubmit={handleSubmit(onSubmit)}
          isSubmitting={isSubmitting}
          errors={Object.fromEntries(
            Object.entries(errors).map(([key, error]) => [key, error?.message || ''])
          )}
        >
          <div className="grid md:grid-cols-2 gap-4">
            <AccessibleInput
              {...register('name')}
              label="Full Name"
              required
              error={errors.name?.message}
              help="Enter your first and last name"
              onChange={(e) => handleInputChange('name', e.target.value)}
              autoComplete="name"
              maxLength={50}
            />

            <AccessibleInput
              {...register('email')}
              type="email"
              label="Email Address"
              required
              error={errors.email?.message}
              help="We&apos;ll use this to respond to your inquiry"
              onChange={(e) => handleInputChange('email', e.target.value)}
              autoComplete="email"
              maxLength={254}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <AccessibleInput
              {...register('phone')}
              type="tel"
              label="Phone Number"
              required
              error={errors.phone?.message}
              help="Required for vehicle inquiries"
              onChange={(e) => handleInputChange('phone', e.target.value)}
              autoComplete="tel"
              maxLength={20}
            />

            <AccessibleSelect
              {...register('preferredContact')}
              label="Preferred Contact Method"
              required
              error={errors.preferredContact?.message}
              help="How would you like us to contact you?"
              options={[
                { value: 'email', label: 'Email' },
                { value: 'phone', label: 'Phone Call' },
                { value: 'whatsapp', label: 'WhatsApp' }
              ]}
            />
          </div>

          <AccessibleCheckbox
            {...register('financingInterested')}
            label="I&apos;m interested in financing options"
            description="Check this if you'd like information about financing this vehicle"
            error={errors.financingInterested?.message}
          />

          <AccessibleTextarea
            {...register('message')}
            label="Additional Message"
            error={errors.message?.message}
            help="Tell us more about your interest in this vehicle"
            onChange={(e) => handleInputChange('message', e.target.value)}
            maxLength={500}
            showCharCount
            rows={4}
          />

          {/* Honeypot field (hidden) */}
          <input
            {...register('honeypot')}
            ref={honeypotRef}
            type="text"
            style={{
              position: 'absolute',
              left: '-9999px',
              width: '1px',
              height: '1px',
              opacity: 0
            }}
            tabIndex={-1}
            autoComplete="off"
          />

          {/* CAPTCHA */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Security Verification *
            </label>
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 p-3 rounded border">
                <span className="font-mono text-lg">{captchaQuestion}</span>
              </div>
              <AccessibleInput
                {...register('captcha')}
                label=""
                placeholder="Answer"
                required
                error={errors.captcha?.message}
                className="w-20"
                maxLength={3}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateCaptcha}
              >
                New Question
              </Button>
            </div>
          </div>

          {/* Consent */}
          <AccessibleCheckbox
            {...register('consent')}
            label="I agree to the privacy policy and terms of service"
            description="By checking this box, you consent to us storing and processing your personal data for the purpose of responding to your vehicle inquiry."
            error={errors.consent?.message}
            required
          />

          {/* Security notice */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <h4 className="font-medium text-blue-900">Secure Inquiry</h4>
                <p className="text-blue-700 mt-1">
                  This form is protected by security measures including CSRF protection,
                  rate limiting, and spam detection. Your information is encrypted and secure.
                </p>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || rateLimitExceeded}
            className="w-full bg-[var(--primary-orange)] hover:bg-[var(--primary-dark)]"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Sending Inquiry...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Vehicle Inquiry
              </>
            )}
          </Button>

          {/* Remaining attempts indicator */}
          {remainingAttempts < 2 && !rateLimitExceeded && (
            <div className="text-sm text-amber-600 text-center">
              {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
            </div>
          )}
        </AccessibleForm>
      </CardContent>
    </Card>
  );
}