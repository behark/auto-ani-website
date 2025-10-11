import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// Validation schemas
export const contactFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Name contains invalid characters'),
  email: z
    .string()
    .email('Invalid email address')
    .max(254, 'Email address too long')
    .refine(
      (email) => !isDisposableEmail(email),
      'Disposable email addresses are not allowed'
    ),
  phone: z
    .string()
    .optional()
    .refine(
      (phone) => !phone || isValidPhoneNumber(phone),
      'Invalid phone number format'
    ),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be less than 1000 characters'),
  subject: z.string().optional(),
  honeypot: z.string().max(0, 'Spam detected'),
  captcha: z.string().optional(),
  consent: z.boolean()
});

export const vehicleInquirySchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Name contains invalid characters'),
  email: z
    .string()
    .email('Invalid email address')
    .max(254, 'Email address too long'),
  phone: z
    .string()
    .min(8, 'Phone number must be at least 8 digits')
    .max(15, 'Phone number must be less than 15 digits')
    .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number format'),
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  financingInterested: z.boolean(),
  preferredContact: z.enum(['email', 'phone', 'whatsapp']),
  inquiryType: z.string(),
  message: z
    .string()
    .max(500, 'Message must be less than 500 characters')
    .optional(),
  honeypot: z.string().max(0, 'Spam detected'),
  captcha: z.string().optional(),
  consent: z.boolean()
});

export const newsletterSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .max(254, 'Email address too long')
    .refine(
      (email) => !isDisposableEmail(email),
      'Disposable email addresses are not allowed'
    ),
  preferences: z.object({
    newVehicles: z.boolean(),
    promotions: z.boolean(),
    news: z.boolean()
  }),
  honeypot: z.string().max(0, 'Spam detected'),
  consent: z.boolean().refine(val => val === true, 'You must agree to receive newsletters')
});

// Input sanitization functions
export function sanitizeInput(input: string): string {
  if (!input) return '';

  // Remove HTML tags and dangerous characters
  const sanitized = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });

  // Remove potential script injections
  return sanitized
    .replace(/javascript:/gi, '')
    .replace(/data:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

export function sanitizeEmail(email: string): string {
  if (!email) return '';

  // Basic email sanitization
  return email
    .toLowerCase()
    .trim()
    .replace(/[<>]/g, '');
}

export function sanitizePhone(phone: string): string {
  if (!phone) return '';

  // Remove all non-digit characters except + - ( ) and spaces
  return phone.replace(/[^\d\s\-\+\(\)]/g, '').trim();
}

// Phone number validation
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return false;

  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // Check length (should be between 7 and 15 digits)
  if (digits.length < 7 || digits.length > 15) return false;

  // Basic format validation
  const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,20}$/;
  return phoneRegex.test(phone);
}

// Disposable email detection
const disposableEmailDomains = [
  '10minutemail.com',
  'guerrillamail.com',
  'mailinator.com',
  'tempmail.org',
  'yopmail.com',
  'throwaway.email',
  'temp-mail.org',
  'getairmail.com',
  'fakeinbox.com',
  'dispostable.com'
];

export function isDisposableEmail(email: string): boolean {
  if (!email) return false;

  const domain = email.split('@')[1]?.toLowerCase();
  return disposableEmailDomains.includes(domain);
}

// Rate limiting utilities
export class RateLimiter {
  private attempts: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000 // 15 minutes
  ) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(identifier);

    if (!attempt || now > attempt.resetTime) {
      // First attempt or window expired
      this.attempts.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    if (attempt.count >= this.maxAttempts) {
      return false;
    }

    attempt.count++;
    return true;
  }

  getRemainingAttempts(identifier: string): number {
    const attempt = this.attempts.get(identifier);
    if (!attempt || Date.now() > attempt.resetTime) {
      return this.maxAttempts;
    }
    return Math.max(0, this.maxAttempts - attempt.count);
  }

  getResetTime(identifier: string): number {
    const attempt = this.attempts.get(identifier);
    if (!attempt || Date.now() > attempt.resetTime) {
      return 0;
    }
    return attempt.resetTime;
  }
}

// CSRF token generation and validation
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Constant-time comparison to prevent timing attacks
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

export function validateCSRFToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) return false;
  // Use constant-time comparison to prevent timing attacks
  return constantTimeCompare(token, sessionToken);
}

// XSS protection
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// SQL injection prevention patterns
const sqlInjectionPatterns = [
  /(\b(ALTER|CREATE|DELETE|DROP|EXEC(UTE)?|INSERT|SELECT|UNION|UPDATE)\b)/gi,
  /(\b(OR|AND)\s+[\"\']?\d+[\"\']?\s*=\s*[\"\']?\d+[\"\']?)/gi,
  /([\"\'])\s*(OR|AND)\s*\1\s*=\s*\1/gi,
  /\b(OR|AND)\s+1\s*=\s*1/gi,
  /--/,
  /\/\*/,
  /\*\//,
  /xp_/gi,
  /sp_/gi
];

export function containsSQLInjection(input: string): boolean {
  if (!input) return false;

  return sqlInjectionPatterns.some(pattern => pattern.test(input));
}

// Password strength validation
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long');
  } else {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    feedback.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  if (!/\d/.test(password)) {
    feedback.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    feedback.push('Password must contain at least one special character');
  } else {
    score += 1;
  }

  // Check for common patterns
  const commonPatterns = [
    /123456/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /admin/i
  ];

  if (commonPatterns.some(pattern => pattern.test(password))) {
    feedback.push('Password contains common patterns');
    score = Math.max(0, score - 1);
  }

  return {
    isValid: score >= 4 && feedback.length === 0,
    score,
    feedback
  };
}

// File upload validation
export interface FileValidationOptions {
  maxSize: number; // in bytes
  allowedTypes: string[];
  maxFiles: number;
}

export function validateFileUpload(
  files: FileList | File[],
  options: FileValidationOptions
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const fileArray = Array.from(files);

  if (fileArray.length > options.maxFiles) {
    errors.push(`Maximum ${options.maxFiles} files allowed`);
  }

  fileArray.forEach((file, index) => {
    // Check file size
    if (file.size > options.maxSize) {
      errors.push(`File ${index + 1}: Size exceeds ${formatFileSize(options.maxSize)} limit`);
    }

    // Check file type
    if (!options.allowedTypes.includes(file.type)) {
      errors.push(`File ${index + 1}: Type ${file.type} not allowed`);
    }

    // Check for suspicious file names
    if (hasSuspiciousFileName(file.name)) {
      errors.push(`File ${index + 1}: Suspicious file name detected`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

function hasSuspiciousFileName(fileName: string): boolean {
  const suspiciousPatterns = [
    /\.exe$/i,
    /\.bat$/i,
    /\.cmd$/i,
    /\.scr$/i,
    /\.vbs$/i,
    /\.js$/i,
    /\.jar$/i,
    /\.php$/i,
    /\.asp$/i,
    /\.jsp$/i,
    /\.\./,
    /\//,
    /\\/
  ];

  return suspiciousPatterns.some(pattern => pattern.test(fileName));
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Form security headers
export const securityHeaders = {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
};

// Input field security enhancement
export function enhanceInputSecurity(input: HTMLInputElement): void {
  // Disable autocomplete for sensitive fields
  if (input.type === 'password' || input.name === 'creditCard') {
    input.autocomplete = 'off';
  }

  // Add input validation attributes
  input.setAttribute('spellcheck', 'false');
  input.setAttribute('data-lpignore', 'true'); // LastPass ignore

  // Prevent paste in password fields (optional)
  if (input.type === 'password') {
    input.addEventListener('paste', (e) => {
      e.preventDefault();
    });
  }
}

// Form submission security
export interface SecureFormSubmission<T = Record<string, unknown>> {
  data: T;
  csrfToken: string;
  timestamp: number;
  fingerprint: string;
}

export function createSecureFormSubmission<T extends Record<string, unknown>>(
  formData: T,
  csrfToken: string
): SecureFormSubmission<T> {
  // Create browser fingerprint for additional security
  const fingerprint = createBrowserFingerprint();

  return {
    data: sanitizeFormData(formData) as T,
    csrfToken,
    timestamp: Date.now(),
    fingerprint
  };
}

function sanitizeFormData<T extends Record<string, unknown>>(data: T): T {
  const sanitized = {} as T;

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      (sanitized as Record<string, unknown>)[key] = sanitizeInput(value);
    } else {
      (sanitized as Record<string, unknown>)[key] = value;
    }
  }

  return sanitized;
}

function createBrowserFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Browser fingerprint', 2, 2);
  }

  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|');

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return hash.toString(36);
}