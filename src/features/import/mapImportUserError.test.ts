import { describe, expect, it } from 'vitest';

import { mapImportUserFacingError } from './mapImportUserError';

describe('mapImportUserFacingError', () => {
  it('preserves sign-in refresh timeout copy (does not collapse to generic connection only)', () => {
    const raw =
      'Could not refresh your sign-in in time. Check your connection and try again.';
    expect(mapImportUserFacingError(new Error(raw))).toBe(raw);
  });

  it('maps RN network failure to actionable copy', () => {
    expect(mapImportUserFacingError(new Error('Network request failed'))).toContain('Wi‑Fi');
  });
});
