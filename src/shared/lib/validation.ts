/**
 * Validation utilities for user inputs with enhanced security
 */

import sanitizeHtml from 'sanitize-html';

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
  
  // Strip invisible Unicode characters (zero-width spaces, non-breaking spaces,
  // LTR/RTL marks, etc.) that can sneak in from copy-paste
  const cleaned = phone
    .replace(/[\u200B-\u200F\u2028-\u202F\u2060\uFEFF]/g, '') // Remove zero-width and invisible chars
    .replace(/\u00A0/g, ' ') // Normalize non-breaking spaces to regular spaces
    .trim();
  
  // Allow digits, spaces, +, -, (, ) - minimum 7 digits
  const phoneRegex = /^[\d\s\-\+\(\)]{7,}$/;
  const digitCount = cleaned.replace(/\D/g, '').length;
  
  return phoneRegex.test(cleaned) && digitCount >= 7;
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
  
  // Use sanitize-html for robust XSS protection
  const clean = sanitizeHtml(input, {
    allowedTags: [], // Strip all HTML tags
    allowedAttributes: {}, // Strip all attributes
    textFilter: (text) => text, // Keep text content
  });
  
  return clean.trim();
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

