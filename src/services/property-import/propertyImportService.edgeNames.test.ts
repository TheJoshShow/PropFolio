import { beforeEach, describe, expect, it, vi } from 'vitest';

import { invokeEdgeFunction } from '@/services/import/edgeInvoke';

import { propertyImportService } from './propertyImportService';

vi.mock('@/services/import/edgeInvoke', () => ({
  invokeEdgeFunction: vi.fn(),
  IMPORT_PROPERTY_TIMEOUT_MS: 95_000,
}));

describe('propertyImportService edge function names', () => {
  beforeEach(() => {
    vi.mocked(invokeEdgeFunction).mockReset();
    vi.mocked(invokeEdgeFunction).mockResolvedValue({ predictions: [] });
  });

  it('autocompleteAddress invokes places-autocomplete', async () => {
    await propertyImportService.autocompleteAddress('123 main', 'tok', 'cid');
    expect(invokeEdgeFunction).toHaveBeenCalledWith(
      'places-autocomplete',
      expect.objectContaining({ query: '123 main', sessionToken: 'tok', correlationId: 'cid' }),
      { retries: 2, timeoutMs: 55_000 },
    );
  });

  it('resolvePlaceDetails invokes places-resolve with session token', async () => {
    vi.mocked(invokeEdgeFunction).mockResolvedValueOnce({
      placeId: 'x',
      formattedAddress: '1 St',
      latitude: 1,
      longitude: 2,
      normalizedOneLine: '1 St',
      streetNumber: '1',
      route: 'St',
      city: 'C',
      state: 'IL',
      postalCode: '60601',
      country: 'US',
    });
    await propertyImportService.resolvePlaceDetails('place/abc', 'cid', 'sess');
    expect(invokeEdgeFunction).toHaveBeenCalledWith(
      'places-resolve',
      { placeId: 'place/abc', correlationId: 'cid', sessionToken: 'sess' },
      { retries: 2, timeoutMs: 55_000 },
    );
  });

  it('importFromListingUrl uses extended timeout for RentCast + DB work', async () => {
    vi.mocked(invokeEdgeFunction).mockResolvedValueOnce({ ok: false, code: 'NEEDS_ADDRESS', listing: {} } as never);
    await propertyImportService.importFromListingUrl('https://x', null, 'buy_hold', 'cid');
    expect(invokeEdgeFunction).toHaveBeenCalledWith(
      'import-property',
      expect.any(Object),
      { retries: 2, timeoutMs: 95_000 },
    );
  });
});
