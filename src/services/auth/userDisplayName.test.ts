import type { User } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';

import type { ProfileRow } from './types';
import { resolveUserFullNameForDisplay } from './userDisplayName';

describe('resolveUserFullNameForDisplay', () => {
  it('prefers profiles.full_name', () => {
    const profile = { full_name: 'Josh Spears' } as ProfileRow;
    const user = { user_metadata: { full_name: 'Other' }, email: 'a@b.com' } as unknown as User;
    expect(resolveUserFullNameForDisplay(profile, user)).toBe('Josh Spears');
  });

  it('uses user_metadata full_name, name, or display_name when profile missing', () => {
    expect(
      resolveUserFullNameForDisplay(null, {
        user_metadata: { full_name: '  A B  ' },
      } as unknown as User),
    ).toBe('A B');
    expect(
      resolveUserFullNameForDisplay(null, { user_metadata: { name: 'OAuth Name' } } as unknown as User),
    ).toBe('OAuth Name');
    expect(
      resolveUserFullNameForDisplay(null, { user_metadata: { display_name: 'Display' } } as unknown as User),
    ).toBe('Display');
  });

  it('does not fall back to email local part', () => {
    expect(
      resolveUserFullNameForDisplay(null, {
        email: 'josh.spears@outlook.com',
        user_metadata: {},
      } as unknown as User),
    ).toBe('Account');
  });
});
