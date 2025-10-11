/**
 * Server-Safe Input Validation and Sanitization Library
 *
 * This file contains validation functions that are safe to use in server-side
 * environments like Next.js middleware. It excludes DOM-dependent functions.
 *
 * Security features:
 * - SQL injection prevention
 * - Command injection prevention
 * - Path traversal prevention
 * - LDAP injection prevention
 * - NoSQL injection prevention
 */

import { z } from 'zod';
import validator from 'validator';

/**
 * SQL Injection Prevention
 */
export function sanitizeSQLInput(input: string): string {
  // Remove or escape potentially dangerous SQL characters
  const sqlDangerousChars = /['";\\%_\x00-\x1f\x7f-\x9f]/g;
  let sanitized = input.replace(sqlDangerousChars, '');

  // Remove SQL keywords in suspicious contexts
  const sqlKeywords = /\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER|EXEC|EXECUTE|SCRIPT|JAVASCRIPT|EVAL)\b/gi;
  sanitized = sanitized.replace(sqlKeywords, '');

  return sanitized.trim();
}

/**
 * Command Injection Prevention
 */
export function sanitizeShellInput(input: string): string {
  // Remove shell metacharacters
  const shellMetaChars = /[`$&;|*?~<>^()[\]{}\\]/g;
  return input.replace(shellMetaChars, '');
}

/**
 * Path Traversal Prevention
 */
export function sanitizePath(input: string): string {
  // Remove path traversal patterns
  let sanitized = input.replace(/\.\./g, '');
  sanitized = sanitized.replace(/[\\\/]+/g, '/');
  sanitized = sanitized.replace(/^[\\\/]+/, '');

  // Remove null bytes
  sanitized = sanitized.replace(/\x00/g, '');

  // Allow only alphanumeric, dash, underscore, dot, and forward slash
  sanitized = sanitized.replace(/[^a-zA-Z0-9\-_.\/]/g, '');

  return sanitized;
}

/**
 * LDAP Injection Prevention
 */
export function sanitizeLDAPInput(input: string): string {
  // Escape LDAP special characters
  const ldapChars: { [key: string]: string } = {
    '\\': '\\5c',
    '*': '\\2a',
    '(': '\\28',
    ')': '\\29',
    '\x00': '\\00',
    '/': '\\2f',
  };

  return input.replace(/[\\*()\/\x00]/g, char => ldapChars[char] || char);
}

/**
 * NoSQL Injection Prevention
 */
export function sanitizeNoSQLInput(input: any): any {
  if (typeof input === 'string') {
    // Remove MongoDB operators
    const mongoOperators = /^\$|\.|\[|\]/g;
    return input.replace(mongoOperators, '');
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized: any = Array.isArray(input) ? [] : {};

    for (const key in input) {
      // Skip keys starting with $
      if (key.startsWith('$')) continue;

      // Recursively sanitize nested objects
      sanitized[key] = sanitizeNoSQLInput(input[key]);
    }

    return sanitized;
  }

  return input;
}

/**
 * Email Validation and Sanitization
 */
export function sanitizeEmail(email: string): string {
  const trimmed = email.trim().toLowerCase();

  if (!validator.isEmail(trimmed)) {
    throw new Error('Invalid email address');
  }

  return validator.normalizeEmail(trimmed, {
    gmail_remove_dots: true,
    gmail_remove_subaddress: false,
    gmail_convert_googlemaildotcom: true,
    outlookdotcom_remove_subaddress: false,
    yahoo_remove_subaddress: false,
    icloud_remove_subaddress: false,
  }) || trimmed;
}

/**
 * Phone Number Validation and Sanitization
 */
export function sanitizePhoneNumber(phone: string): string {
  // Remove all non-numeric characters except + at the beginning
  let sanitized = phone.replace(/[^\d+]/g, '');

  // Ensure + is only at the beginning
  if (sanitized.includes('+')) {
    const hasLeadingPlus = sanitized.startsWith('+');
    sanitized = sanitized.replace(/\+/g, '');
    if (hasLeadingPlus) {
      sanitized = '+' + sanitized;
    }
  }

  // Validate phone number format
  if (!validator.isMobilePhone(sanitized, 'any', { strictMode: false })) {
    throw new Error('Invalid phone number');
  }

  return sanitized;
}

/**
 * URL Validation and Sanitization
 */
export function sanitizeURL(url: string): string {
  const trimmed = url.trim();

  // Check for javascript: or data: protocols
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    throw new Error('Invalid URL protocol');
  }

  if (!validator.isURL(trimmed, {
    protocols: ['http', 'https'],
    require_protocol: true,
    require_valid_protocol: true,
    require_host: true,
    require_tld: true,
    allow_query_components: true,
    allow_fragments: true,
    allow_protocol_relative_urls: false,
  })) {
    throw new Error('Invalid URL');
  }

  return trimmed;
}

/**
 * Username Validation and Sanitization
 */
export function sanitizeUsername(username: string): string {
  // Allow only alphanumeric, underscore, and dash
  const sanitized = username.replace(/[^a-zA-Z0-9_-]/g, '');

  if (sanitized.length < 3 || sanitized.length > 30) {
    throw new Error('Username must be between 3 and 30 characters');
  }

  return sanitized.toLowerCase();
}

/**
 * Generic Text Input Sanitization (Server-Safe)
 * Note: This version doesn't use DOMPurify for HTML sanitization
 */
export function sanitizeTextInput(input: string, options?: {
  maxLength?: number;
  allowNewlines?: boolean;
  allowSpecialChars?: boolean;
}): string {
  const {
    maxLength = 1000,
    allowNewlines = true,
    allowSpecialChars = false,
  } = options || {};

  let sanitized = input;

  // Remove null bytes
  sanitized = sanitized.replace(/\x00/g, '');

  // Remove control characters except newlines/tabs if allowed
  if (allowNewlines) {
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  } else {
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  }

  // Remove or escape special characters if not allowed
  if (!allowSpecialChars) {
    sanitized = sanitized.replace(/[<>\"'&]/g, (char) => {
      const escapes: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;',
      };
      return escapes[char] || char;
    });
  }

  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized.trim();
}

/**
 * JSON Input Validation
 */
export function sanitizeJSON(input: string): object {
  try {
    const parsed = JSON.parse(input);

    // Prevent prototype pollution
    if ('__proto__' in parsed || 'constructor' in parsed || 'prototype' in parsed) {
      throw new Error('Potential prototype pollution detected');
    }

    return sanitizeNoSQLInput(parsed);
  } catch (error) {
    throw new Error('Invalid JSON input');
  }
}

/**
 * File Name Sanitization
 */
export function sanitizeFileName(filename: string): string {
  // Remove path separators
  let sanitized = filename.replace(/[\/\\]/g, '');

  // Remove special characters that could cause issues
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '');

  // Prevent directory traversal
  sanitized = sanitized.replace(/\.\./g, '');

  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop() || '';
    const name = sanitized.substring(0, 255 - ext.length - 1);
    sanitized = `${name}.${ext}`;
  }

  return sanitized;
}

/**
 * Credit Card Number Validation (PCI DSS Compliance)
 */
export function sanitizeCreditCard(cardNumber: string): string {
  const sanitized = cardNumber.replace(/\D/g, '');

  if (!validator.isCreditCard(sanitized)) {
    throw new Error('Invalid credit card number');
  }

  // Return masked version for logging (PCI compliance)
  const masked = sanitized.substring(0, 6) + '*'.repeat(sanitized.length - 10) + sanitized.substring(sanitized.length - 4);

  return masked;
}

/**
 * IP Address Validation
 */
export function validateIPAddress(ip: string): boolean {
  return validator.isIP(ip, 4) || validator.isIP(ip, 6);
}

/**
 * Create a sanitized object from request body
 */
export function sanitizeRequestBody<T extends Record<string, any>>(
  body: any,
  schema: z.ZodSchema<T>
): T {
  // First, sanitize all string inputs
  const sanitized = sanitizeObjectStrings(body);

  // Then validate against schema
  const result = schema.safeParse(sanitized);

  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.message}`);
  }

  return result.data;
}

/**
 * Recursively sanitize all strings in an object
 */
function sanitizeObjectStrings(obj: any): any {
  if (typeof obj === 'string') {
    return sanitizeTextInput(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObjectStrings(item));
  }

  if (obj !== null && typeof obj === 'object') {
    const sanitized: any = {};

    for (const key in obj) {
      // Sanitize the key itself
      const sanitizedKey = sanitizeTextInput(key, { maxLength: 100 });
      sanitized[sanitizedKey] = sanitizeObjectStrings(obj[key]);
    }

    return sanitized;
  }

  return obj;
}

/**
 * Rate limiting key sanitization
 */
export function sanitizeRateLimitKey(key: string): string {
  // Remove characters that could break Redis keys
  return key.replace(/[^a-zA-Z0-9:_-]/g, '');
}

/**
 * CORS Origin Validation
 */
export function validateOrigin(origin: string, allowedOrigins: string[]): boolean {
  // Check exact match
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // Check wildcard patterns
  for (const allowed of allowedOrigins) {
    if (allowed.includes('*')) {
      const pattern = allowed.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(origin)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * HTTP Header Validation
 */
export function sanitizeHeader(value: string): string {
  // Remove line breaks and null bytes
  return value.replace(/[\r\n\x00]/g, '');
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('base64url');
}

/**
 * Password strength validation
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length < 8) {
    feedback.push('Password must be at least 8 characters long');
  } else if (password.length >= 12) {
    score += 2;
  } else {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    feedback.push('Password must contain lowercase letters');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    feedback.push('Password must contain uppercase letters');
  } else {
    score += 1;
  }

  if (!/\d/.test(password)) {
    feedback.push('Password must contain numbers');
  } else {
    score += 1;
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    feedback.push('Password must contain special characters');
  } else {
    score += 2;
  }

  // Check for common patterns
  const commonPatterns = [
    /password/i,
    /12345/,
    /qwerty/i,
    /admin/i,
    /letmein/i,
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      feedback.push('Password contains common patterns');
      score = Math.max(0, score - 2);
      break;
    }
  }

  return {
    valid: feedback.length === 0,
    score: Math.min(10, score),
    feedback,
  };
}

export default {
  sanitizeSQLInput,
  sanitizeShellInput,
  sanitizePath,
  sanitizeLDAPInput,
  sanitizeNoSQLInput,
  sanitizeEmail,
  sanitizePhoneNumber,
  sanitizeURL,
  sanitizeUsername,
  sanitizeTextInput,
  sanitizeJSON,
  sanitizeFileName,
  sanitizeCreditCard,
  validateIPAddress,
  sanitizeRequestBody,
  sanitizeRateLimitKey,
  validateOrigin,
  sanitizeHeader,
  generateSecureToken,
  validatePasswordStrength,
};