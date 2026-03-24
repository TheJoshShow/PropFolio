import { enrichAddressForImport } from '../propertyImportOrchestrator';

jest.mock('../edgeFunctions', () => ({
  geocodeAddress: jest.fn(),
  rentEstimate: jest.fn(),
}));

import { geocodeAddress, rentEstimate } from '../edgeFunctions';

const geocodeAddressMock = geocodeAddress as jest.MockedFunction<typeof geocodeAddress>;
const rentEstimateMock = rentEstimate as jest.MockedFunction<typeof rentEstimate>;

describe('enrichAddressForImport', () => {
  beforeEach(() => {
    geocodeAddressMock.mockReset();
    rentEstimateMock.mockReset();
    rentEstimateMock.mockResolvedValue({ data: null, error: null });
  });

  it('allows link source when geocode returns hard error (best-effort)', async () => {
    geocodeAddressMock.mockResolvedValue({
      data: null,
      error: 'GOOGLE_MAPS_API_KEY not configured',
    });
    const r = await enrichAddressForImport({
      trimmedAddressLine: '123 Main St, Austin, TX 78701',
      hasSupabase: true,
      source: 'zillow',
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.enriched.addressLine).toContain('123');
  });

  it('blocks manual when geocode fails and address is incomplete', async () => {
    geocodeAddressMock.mockResolvedValue({
      data: null,
      error: 'GOOGLE_MAPS_API_KEY not configured',
    });
    const r = await enrichAddressForImport({
      trimmedAddressLine: 'Chicago',
      hasSupabase: true,
      source: 'manual',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('GEOCODE_FAILED');
  });

  it('allows manual when geocode fails but typed line is complete', async () => {
    geocodeAddressMock.mockResolvedValue({
      data: null,
      error: '503',
    });
    const r = await enrichAddressForImport({
      trimmedAddressLine: '8216 S Maryland Ave, Chicago, IL 60619',
      hasSupabase: true,
      source: 'manual',
    });
    expect(r.ok).toBe(true);
  });

  it('blocks manual on zero geocode match with incomplete line', async () => {
    geocodeAddressMock.mockResolvedValue({
      data: { lat: null, lng: null, formatted_address: null, place_id: null },
      error: null,
    });
    const r = await enrichAddressForImport({
      trimmedAddressLine: 'asdfgh',
      hasSupabase: true,
      source: 'manual',
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('ADDRESS_NOT_FOUND');
  });
});
