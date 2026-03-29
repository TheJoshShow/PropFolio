/**
 * Profile upsert: optional phone must not block account creation; when present, persist E.164.
 */
import { ensureProfile } from '../profile';
import type { SupabaseClient } from '@supabase/supabase-js';

function createMockSupabase(capture: { lastUpsert: Record<string, unknown> | null }) {
  const upsert = jest.fn(async (row: Record<string, unknown>) => {
    capture.lastUpsert = row;
    return { error: null };
  });
  const from = jest.fn(() => ({ upsert }));
  return { client: { from } as unknown as SupabaseClient, upsert };
}

describe('ensureProfile', () => {
  const userId = '00000000-0000-4000-8000-000000000001';

  it('omits phone_number when metadata has no phone (blank signup)', async () => {
    const cap = { lastUpsert: null as Record<string, unknown> | null };
    const { client } = createMockSupabase(cap);
    await ensureProfile(client, userId, {
      first_name: 'A',
      last_name: 'B',
      phone_number: '',
    });
    expect(cap.lastUpsert).not.toHaveProperty('phone_number');
    expect(cap.lastUpsert).toMatchObject({ id: userId, display_name: 'A B' });
  });

  it('includes normalized phone when provided', async () => {
    const cap = { lastUpsert: null as Record<string, unknown> | null };
    const { client } = createMockSupabase(cap);
    await ensureProfile(client, userId, {
      first_name: 'A',
      last_name: 'B',
      phone_number: '(312) 555-1212',
    });
    expect(cap.lastUpsert).toMatchObject({
      id: userId,
      phone_number: '+13125551212',
      display_name: 'A B',
    });
  });

  it('second call with empty phone does not send phone_number (preserve existing DB value)', async () => {
    const cap = { lastUpsert: null as Record<string, unknown> | null };
    const { client } = createMockSupabase(cap);
    await ensureProfile(client, userId, {
      first_name: 'A',
      last_name: 'B',
    });
    expect(cap.lastUpsert).not.toHaveProperty('phone_number');
  });

  it('treats unique violation (23505) as success for idempotent upsert', async () => {
    const upsert = jest.fn(async () => ({
      error: { code: '23505', message: 'duplicate key value violates unique constraint' },
    }));
    const from = jest.fn(() => ({ upsert }));
    const client = { from } as unknown as SupabaseClient;
    const { error } = await ensureProfile(client, userId, { first_name: 'A', last_name: 'B' });
    expect(error).toBeNull();
  });

  it('idempotent upsert uses same conflict key', async () => {
    const upsert = jest.fn(async () => ({ error: null }));
    const from = jest.fn(() => ({ upsert }));
    const client = { from } as unknown as SupabaseClient;
    await ensureProfile(client, userId, { first_name: 'X', last_name: 'Y' });
    expect(upsert).toHaveBeenCalledWith(expect.any(Object), { onConflict: 'id' });
  });
});
