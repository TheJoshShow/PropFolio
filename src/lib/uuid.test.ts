import { describe, expect, it } from 'vitest';

import { generatePlacesSessionToken, generateUuid, isValidUuid } from './uuid';

describe('isValidUuid', () => {
  it('accepts lowercase v4', () => {
    expect(isValidUuid('f47ac10b-58cc-4372-a567-0e02b2c3d479')).toBe(true);
  });

  it('rejects junk', () => {
    expect(isValidUuid('not-a-uuid')).toBe(false);
    expect(isValidUuid('')).toBe(false);
    expect(isValidUuid(undefined)).toBe(false);
  });

  it('generated ids validate', () => {
    expect(isValidUuid(generateUuid())).toBe(true);
  });
});

describe('generatePlacesSessionToken', () => {
  it('is 32 hex chars (Google Places sessionToken max 36, URL-safe)', () => {
    const t = generatePlacesSessionToken();
    expect(t).toHaveLength(32);
    expect(/^[0-9a-f]{32}$/.test(t)).toBe(true);
  });
});
