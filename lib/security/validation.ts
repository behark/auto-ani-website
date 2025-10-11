/**
 * Comprehensive Input Validation and Sanitization Library
 *
 * This file provides browser-safe validation functions and re-exports
 * server-safe functions for backward compatibility.
 *
 * Security features:
 * - SQL injection prevention
 * - XSS attack prevention (browser-only)
 * - Command injection prevention
 * - Path traversal prevention
 * - LDAP injection prevention
 * - NoSQL injection prevention
 */

import DOMPurify from 'isomorphic-dompurify';

// Re-export all server-safe functions for backward compatibility
export {
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
} from './validation-server';

/**
 * XSS Attack Prevention (Browser-only)
 * This function requires DOM/window and should only be used in browser environments
 */
export function sanitizeHTML(input: string): string {
  // Configure DOMPurify for strict sanitization
  const clean = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    SAFE_FOR_TEMPLATES: true,
    WHOLE_DOCUMENT: false,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    FORCE_BODY: false,
    SANITIZE_DOM: true,
    KEEP_CONTENT: true,
    IN_PLACE: false,
  });

  return clean;
}

// Import server-safe functions for default export
import serverValidation from './validation-server';

export default {
  // Browser-only functions
  sanitizeHTML,

  // Re-export all server-safe functions
  ...serverValidation,
};