/**
 * Generate enrollment codes in the format CONT-XXXX
 * Uses uppercase alphanumeric characters, excluding ambiguous ones (0/O, 1/I/L)
 */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateEnrollmentCode(prefix = 'CONT'): string {
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `${prefix}-${suffix}`;
}

export function isValidCodeFormat(code: string): boolean {
  return /^[A-Z]{2,6}-[A-Z0-9]{4,8}$/i.test(code);
}
