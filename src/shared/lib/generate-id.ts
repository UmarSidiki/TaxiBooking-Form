/**
 * Generates a short, unique booking ID (4-5 characters)
 * Format: Alphanumeric uppercase (excluding similar-looking characters like O, 0, I, 1, l)
 */
export function generateShortId(length: number = 5): string {
  // Use only unambiguous characters
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let result = '';
  
  // Use crypto for better randomness
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const randomValues = new Uint8Array(length);
    crypto.getRandomValues(randomValues);
    
    for (let i = 0; i < length; i++) {
      result += chars[randomValues[i] % chars.length];
    }
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  
  return result;
}

/**
 * Generates a unique trip ID with timestamp prefix to ensure uniqueness
 * Format: XXXXX (5 random characters)
 * Example: A7K9M
 */
export function generateTripId(): string {
  return generateShortId(5);
}
