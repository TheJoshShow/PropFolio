import { describe, expect, it } from 'vitest';

import type { PropertyRow } from '@/types/property';

import { buildPropertyAnalysisSummary } from './buildPropertyAnalysisSummary';

const baseRow = (overrides: Partial<PropertyRow> = {}): PropertyRow =>
  ({
    id: '1',
    user_id: 'u',
    source_type: 'manual_address',
    source_url: null,
    raw_input: null,
    status: 'ready',
    missing_fields: [],
    snapshot: {
      version: '1',
      address: { formatted: '123 Main St' },
      geo: { lat: 1, lng: 2 },
      structure: { sqft: 1200, propertyType: 'Single Family' },
      financials: { rentEstimateMonthly: 2000, lastSalePrice: 400_000 },
    },
    place_id: null,
    formatted_address: '123 Main St, City, ST',
    latitude: 1,
    longitude: 2,
    confidence_score: 7,
    last_import_error: null,
    created_at: '',
    updated_at: '',
    ...overrides,
  }) as PropertyRow;

describe('buildPropertyAnalysisSummary', () => {
  it('fills rows from snapshot when breakdown is null', () => {
    const rows = buildPropertyAnalysisSummary(baseRow(), null);
    expect(rows.find((r) => r.label === 'Full Address')?.value).toContain('123 Main');
    expect(rows.find((r) => r.label === 'Square Footage')?.value).toContain('1,200');
    expect(rows.find((r) => r.label === 'Estimated Total Rent')?.value).toBe('$2,000/mo');
    expect(rows.find((r) => r.label === 'Estimated Mortgage')?.value).toBe('—');
  });

  it('does not throw on empty snapshot fields', () => {
    const row = baseRow({
      formatted_address: null,
      snapshot: {
        version: '1',
        address: { formatted: '' },
        geo: { lat: null, lng: null },
      },
    });
    const rows = buildPropertyAnalysisSummary(row, null);
    expect(rows.every((r) => typeof r.value === 'string')).toBe(true);
  });
});
