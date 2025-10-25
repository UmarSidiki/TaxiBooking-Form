import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    'EUR': '€',
    'USD': '$',
    'GBP': '£',
    'CHF': '₣',
    'JPY': '¥',
    'CAD': '$',
    'AUD': '$',
  };
  return symbols[currency.toUpperCase()] || currency;
}
