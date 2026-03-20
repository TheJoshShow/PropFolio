import { getOptionalPhoneFieldError, getPhoneValidationError, normalizePhoneNumber } from '../phone';

describe('phone utils', () => {
  test('normalizes US dashed number', () => {
    expect(normalizePhoneNumber('555-555-5555')).toBe('+15555555555');
  });

  test('normalizes US with parentheses/spaces', () => {
    expect(normalizePhoneNumber('(555) 555 5555')).toBe('+15555555555');
  });

  test('keeps E.164 +1', () => {
    expect(normalizePhoneNumber('+15555555555')).toBe('+15555555555');
  });

  test('accepts US without plus when 1-prefixed', () => {
    expect(normalizePhoneNumber('1 555 555 5555')).toBe('+15555555555');
  });

  test('accepts simple international +44', () => {
    expect(normalizePhoneNumber('+44 20 7946 0958')).toBe('+442079460958');
  });

  test('rejects too short', () => {
    expect(normalizePhoneNumber('123')).toBeNull();
    expect(getPhoneValidationError('123')).toBe('Enter a valid phone number');
  });

  test('rejects empty', () => {
    expect(getPhoneValidationError('')).toBe('Required');
    expect(normalizePhoneNumber('   ')).toBeNull();
  });

  test('rejects non-1 leading 11 digits (US assumption)', () => {
    expect(normalizePhoneNumber('55555555555')).toBeNull();
  });

  describe('getOptionalPhoneFieldError', () => {
    test('blank and whitespace are valid', () => {
      expect(getOptionalPhoneFieldError('')).toBeNull();
      expect(getOptionalPhoneFieldError('   ')).toBeNull();
    });

    test('accepts formatted US number', () => {
      expect(getOptionalPhoneFieldError('(312) 555-1212')).toBeNull();
    });

    test('rejects invalid partial input', () => {
      expect(getOptionalPhoneFieldError('123')).toBe(
        'Enter a valid phone number or leave this field blank.'
      );
    });
  });
});

