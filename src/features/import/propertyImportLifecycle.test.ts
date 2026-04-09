import { describe, expect, it } from 'vitest';

import type { PropertyImportResult } from '@/services/property-import';

import { interpretPropertyImportResult } from './propertyImportLifecycle';

describe('interpretPropertyImportResult', () => {
  it('routes NEEDS_ADDRESS without wallet refresh semantics', () => {
    const r = {
      ok: false as const,
      code: 'NEEDS_ADDRESS' as const,
      listing: {
        provider: 'zillow' as const,
        canonicalUrl: 'https://zillow.com/x',
        addressHint: null,
        externalIds: {},
      },
    } satisfies PropertyImportResult;
    expect(interpretPropertyImportResult(r)).toEqual({ kind: 'needs_address', result: r });
  });

  it('routes saved property to import_saved', () => {
    const r = {
      ok: true,
      propertyId: 'p1',
      status: 'ready',
      missingFields: [],
      snapshot: {},
    } as unknown as PropertyImportResult;
    expect(interpretPropertyImportResult(r).kind).toBe('import_saved');
  });

  it('treats insufficient credits as wallet refresh failure', () => {
    const r = { ok: false as const, code: 'INSUFFICIENT_CREDITS' as const, message: 'No credits' };
    expect(interpretPropertyImportResult(r)).toEqual({
      kind: 'failure_refresh_wallet',
      message: 'No credits',
    });
  });
});
