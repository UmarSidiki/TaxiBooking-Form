/**
 * Utility hooks and functions for form builder
 */

import { useRef, useCallback, useEffect, useState } from 'react';

/**
 * Custom hook for debouncing values
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for atomic save operations with race condition protection
 */
export function useAtomicSave<T>(
  saveFn: (data: T) => Promise<void>,
  options: {
    debounceMs?: number;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const { debounceMs = 1000, onSuccess, onError } = options;
  const saveInProgressRef = useRef(false);
  const pendingDataRef = useRef<T | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const executeSave = useCallback(async (data: T) => {
    // Cancel any previous ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    saveInProgressRef.current = true;
    pendingDataRef.current = null;

    try {
      await saveFn(data);
      
      // Check if aborted
      if (abortControllerRef.current.signal.aborted) {
        return;
      }

      onSuccess?.();
    } catch (error) {
      // Check if aborted
      if (abortControllerRef.current.signal.aborted) {
        return;
      }

      onError?.(error as Error);
    } finally {
      saveInProgressRef.current = false;

      // If there's pending data, save it
      if (pendingDataRef.current) {
        const pending = pendingDataRef.current;
        pendingDataRef.current = null;
        executeSave(pending);
      }
    }
  }, [saveFn, onSuccess, onError]);

  const debouncedSave = useCallback((data: T) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If a save is in progress, queue this data
    if (saveInProgressRef.current) {
      pendingDataRef.current = data;
      return;
    }

    // Debounce the save
    timeoutRef.current = setTimeout(() => {
      executeSave(data);
    }, debounceMs);
  }, [executeSave, debounceMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    save: debouncedSave,
    saveImmediately: executeSave,
    isSaving: saveInProgressRef.current,
  };
}

/**
 * Sanitize CSS values to prevent injection
 */
export function sanitizeCSSValue(value: string, type: 'color' | 'size' | 'text'): string {
  if (!value || typeof value !== 'string') {
    return type === 'color' ? '#000000' : type === 'size' ? '0px' : '';
  }

  const trimmed = value.trim();

  if (type === 'color') {
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
      const aVal = a ? Math.min(1, Math.max(0, parseFloat(a))) : undefined;

      return aVal !== undefined
        ? `rgba(${rVal}, ${gVal}, ${bVal}, ${aVal})`
        : `rgb(${rVal}, ${gVal}, ${bVal})`;
    }

    return '#000000';
  }

  if (type === 'size') {
    const sizeRegex = /^(\d+(?:\.\d+)?)(px|rem|em|%|vh|vw)$/;
    const match = trimmed.match(sizeRegex);

    if (match) {
      const [, value, unit] = match;
      const numValue = parseFloat(value);

      // Prevent excessively large values
      if (numValue < 0 || numValue > 10000) {
        return '0px';
      }

      return `${numValue}${unit}`;
    }

    return '0px';
  }

  if (type === 'text') {
    // Remove potentially dangerous characters
    return trimmed
      .replace(/[<>'"]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .substring(0, 500); // Limit length
  }

  return '';
}

/**
 * Custom hook for managing form errors with retry capability
 */
export function useFormErrors() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [retryCount, setRetryCount] = useState(0);

  const addError = useCallback((field: string, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }));
  }, []);

  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
    setRetryCount(0);
  }, []);

  const incrementRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);

  return {
    errors,
    addError,
    clearError,
    clearAllErrors,
    retryCount,
    incrementRetry,
    hasErrors: Object.keys(errors).length > 0,
  };
}

/**
 * Rate limiter for client-side actions
 */
export class RateLimiter {
  private attempts: Map<string, { count: number; timestamp: number }> = new Map();

  check(key: string, maxAttempts: number = 5, windowMs: number = 60000): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(key);

    // Reset if window has passed
    if (!attempt || now - attempt.timestamp > windowMs) {
      this.attempts.set(key, { count: 1, timestamp: now });
      return true;
    }

    // Check if limit exceeded
    if (attempt.count >= maxAttempts) {
      return false;
    }

    // Increment counter
    attempt.count++;
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }

  clear(): void {
    this.attempts.clear();
  }
}
