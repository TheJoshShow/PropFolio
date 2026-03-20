/**
 * Phone normalization/validation utilities.
 *
 * Canonical storage format:
 * - E.164 with leading `+` (e.g. `+15555555555`)
 *
 * Notes:
 * - No external libraries to keep the build deterministic and lightweight.
 * - For inputs without a leading `+`, we assume US and require 10 digits
 *   (or 11 digits starting with `1`).
 */

export function normalizePhoneNumber(raw: string, defaultCountry: 'US' = 'US'): string | null {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return null;

  if (defaultCountry !== 'US') {
    // Current MVP assumes US for non-E.164 inputs.
    // If you add multi-country support later, expand this function deterministically.
  }

  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/[^\d]/g, '');
  if (digits.length === 0) return null;

  if (hasPlus) {
    // E.164 max length is 15 digits (without +).
    if (digits.length < 8 || digits.length > 15) return null;
    return `+${digits}`;
  }

  // Non-E.164: assume US.
  if (defaultCountry === 'US') {
    if (digits.length === 10) return `+1${digits}`;
    if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
    return null;
  }

  return null;
}

export function formatPhoneForDisplay(phoneE164: string): string {
  const normalized = normalizePhoneNumber(phoneE164);
  if (!normalized) return phoneE164;

  // Basic US formatting for readability.
  if (normalized.startsWith('+1') && normalized.length === 12) {
    const d = normalized.slice(2); // 10 digits
    const a = d.slice(0, 3);
    const b = d.slice(3, 6);
    const c = d.slice(6, 10);
    return `(${a}) ${b}-${c}`;
  }

  return phoneE164;
}

export function getPhoneValidationError(phoneRaw: string): string | null {
  const trimmed = (phoneRaw ?? '').trim();
  if (!trimmed) return 'Required';

  const normalized = normalizePhoneNumber(trimmed);
  if (!normalized) return 'Enter a valid phone number';

  return null;
}

/**
 * Validation for optional phone fields (e.g. sign-up). Blank / whitespace-only is valid.
 * If the user types something, it must normalize to E.164 or we show a field-level error.
 */
export function getOptionalPhoneFieldError(phoneRaw: string): string | null {
  const trimmed = (phoneRaw ?? '').trim();
  if (!trimmed) return null;

  const normalized = normalizePhoneNumber(trimmed);
  if (!normalized) {
    return 'Enter a valid phone number or leave this field blank.';
  }
  return null;
}

