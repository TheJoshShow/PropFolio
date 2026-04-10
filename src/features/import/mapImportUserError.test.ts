import { describe, expect, it } from 'vitest';

import { AuthPrepError } from '@/services/supabase/authPrepErrors';

import { mapImportUserFacingError } from './mapImportUserError';

describe('mapImportUserFacingError', () => {
  it('preserves sign-in refresh timeout copy (does not collapse to generic connection only)', () => {
    const raw =
      'Could not refresh your sign-in in time. Check your connection and try again.';
    expect(mapImportUserFacingError(new Error(raw))).toBe(raw);
  });

  it('preserves getSession budget timeout copy for import prep', () => {
    const raw = 'Could not read your saved sign-in. Check your connection or try signing in again.';
    expect(mapImportUserFacingError(new Error(raw))).toBe(raw);
  });

  it('passes through AuthPrepError message (structured import auth failures)', () => {
    expect(
      mapImportUserFacingError(
        new AuthPrepError('refresh_timeout', 'Sign-in refresh is taking too long. Try again.'),
      ),
    ).toBe('Sign-in refresh is taking too long. Try again.');
  });

  it('maps RN network failure to actionable copy', () => {
    expect(mapImportUserFacingError(new Error('Network request failed'))).toContain('Wi‑Fi');
  });
});
