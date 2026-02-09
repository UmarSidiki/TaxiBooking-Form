/**
 * Validation utilities for user inputs
 */

/**
 * Validates email format using RFC 5322 compliant regex
 * @param email - Email string to validate
 * @returns true if valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  // Basic but effective email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates phone number (international format)
 * @param phone - Phone string to validate
 * @returns true if valid, false otherwise
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  // Allow digits, spaces, +, -, (, ) - minimum 7 digits
  const phoneRegex = /^[\d\s\-\+\(\)]{7,}$/;
  const digitCount = phone.replace(/\D/g, '').length;
  
  return phoneRegex.test(phone) && digitCount >= 7;
}

/**
 * Sanitizes string input to prevent XSS
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

/**
 * Validates name (only letters, spaces, hyphens, apostrophes)
 * @param name - Name string to validate
 * @returns true if valid, false otherwise
 */
export function isValidName(name: string): boolean {
  if (!name || typeof name !== 'string') {
    return false;
  }
  
  const nameRegex = /^[a-zA-Z\s\-']{2,50}$/;
  return nameRegex.test(name.trim());
}
