import { describe, expect, it } from 'vitest';

import { validateNewPassword, validateOptionalPhone, visibleAuthFieldError } from './validation';

describe('validateNewPassword', () => {
  it('accepts passwords that meet all rules', () => {
    expect(validateNewPassword('Abcd1234!')).toBeNull();
  });

  it('rejects short passwords', () => {
    expect(validateNewPassword('Ab1!')).toBe('Use at least 8 characters.');
  });

  it('requires uppercase', () => {
    expect(validateNewPassword('abcd1234!')).toBe('Include at least one uppercase letter.');
  });

  it('requires a digit', () => {
    expect(validateNewPassword('Abcdefgh!')).toBe('Include at least one number.');
  });

  it('requires a symbol', () => {
    expect(validateNewPassword('Abcdefgh1')).toBe('Include at least one symbol (e.g. ! @ # $).');
  });
});

describe('validateOptionalPhone', () => {
  it('allows empty input', () => {
    expect(validateOptionalPhone('')).toBeNull();
    expect(validateOptionalPhone('   ')).toBeNull();
  });

  it('allows 10–15 digits', () => {
    expect(validateOptionalPhone('(555) 123-4567')).toBeNull();
    expect(validateOptionalPhone('+1 555 123 4567')).toBeNull();
  });

  it('rejects too few digits', () => {
    expect(validateOptionalPhone('555-1234')).toBe('Enter a valid phone number.');
  });

  it('rejects too many digits', () => {
    expect(validateOptionalPhone('1'.repeat(20))).toBe('Enter a valid phone number.');
  });
});

describe('visibleAuthFieldError', () => {
  it('hides errors until blur or submit', () => {
    expect(visibleAuthFieldError('Bad', false, false)).toBeUndefined();
    expect(visibleAuthFieldError('Bad', true, false)).toBe('Bad');
    expect(visibleAuthFieldError('Bad', false, true)).toBe('Bad');
  });

  it('returns undefined when there is no error', () => {
    expect(visibleAuthFieldError(null, true, true)).toBeUndefined();
  });
});
