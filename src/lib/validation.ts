/**
 * Validation utilities for user inputs with enhanced security
 */

import DOMPurify from 'isomorphic-dompurify';

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
 * Sanitizes string input to prevent XSS using DOMPurify
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Use DOMPurify for robust XSS protection
  const clean = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Strip all HTML tags
    ALLOWED_ATTR: [], // Strip all attributes
    KEEP_CONTENT: true, // Keep text content
  });
  
  return clean.trim();
}

/**
 * Validates and sanitizes CSS color values (hex, rgb, rgba)
 * @param color - Color value to validate
 * @returns Sanitized color or default
 */
export function sanitizeColor(color: string): string {
  if (!color || typeof color !== 'string') {
    return '#000000';
  }
  
  const trimmed = color.trim();
  
  // Validate hex color
  const hexRegex = /^#([0-9A-Fa-f]{3}){1,2}$/;
  if (hexRegex.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  
  // Validate rgb/rgba
  const rgbaRegex = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([0-9.]+)\s*)?\)$/;
  const match = trimmed.match(rgbaRegex);
  if (match) {
    const [, r, g, b, a] = match;
    const rVal = Math.min(255, parseInt(r));
    const gVal = Math.min(255, parseInt(g));
    const bVal = Math.min(255, parseInt(b));
    const aVal = a ? Math.min(1, parseFloat(a)) : undefined;
    
    return aVal !== undefined 
      ? `rgba(${rVal}, ${gVal}, ${bVal}, ${aVal})`
      : `rgb(${rVal}, ${gVal}, ${bVal})`;
  }
  
  // Default fallback
  return '#000000';
}

/**
 * Validates CSS size values (rem, px, em, %)
 * @param size - Size value to validate
 * @returns Sanitized size or default
 */
export function sanitizeCSSSize(size: string): string {
  if (!size || typeof size !== 'string') {
    return '0px';
  }
  
  const trimmed = size.trim();
  const sizeRegex = /^(\d+(?:\.\d+)?)(px|rem|em|%|vh|vw)$/;
  const match = trimmed.match(sizeRegex);
  
  if (match) {
    const [, value, unit] = match;
    const numValue = parseFloat(value);
    
    // Prevent excessively large values
    if (numValue > 10000) {
      return '0px';
    }
    
    return `${numValue}${unit}`;
  }
  
  return '0px';
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

/**
 * Validates and sanitizes URL values
 * @param url - URL to validate
 * @returns Sanitized URL or empty string
 */
export function sanitizeURL(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  const trimmed = url.trim();
  
  // Only allow http and https protocols
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
  } catch {
    // Invalid URL
  }
  
  return '';
}

/**
 * Validates string length
 * @param input - String to validate
 * @param min - Minimum length
 * @param max - Maximum length
 * @returns true if valid, false otherwise
 */
export function isValidLength(input: string, min: number, max: number): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }
  
  const {length} = input.trim();
  return length >= min && length <= max;
}

/**
 * Rate limiting helper - checks if action should be throttled
 * @param key - Unique key for the action
 * @param maxAttempts - Maximum attempts allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if action is allowed, false if throttled
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 60000
): boolean {
  if (typeof window === 'undefined') {
    return true; // Server-side, skip client-side rate limiting
  }
  
  const now = Date.now();
  const storageKey = `rate_limit_${key}`;
  
  try {
    const stored = localStorage.getItem(storageKey);
    const attempts = stored ? JSON.parse(stored) : { count: 0, timestamp: now };
    
    // Reset if window has passed
    if (now - attempts.timestamp > windowMs) {
      localStorage.setItem(storageKey, JSON.stringify({ count: 1, timestamp: now }));
      return true;
    }
    
    // Check if limit exceeded
    if (attempts.count >= maxAttempts) {
      return false;
    }
    
    // Increment counter
    attempts.count++;
    localStorage.setItem(storageKey, JSON.stringify(attempts));
    return true;
  } catch {
    return true; // Fail open if storage unavailable
  }
}
