import { describe, expect, it } from 'vitest';

import type { PropertySnapshotV1 } from '@/types/property';

import {
  buildMarketSnapshotRows,
  formatBaths,
  formatCoordinates,
  formatListingProvider,
  formatMarketDate,
  formatSnapshotAddress,
  formatSqft,
} from './mapMarketDataRows';

describe('formatMarketDate', () => {
  it('formats ISO dates', () => {
    const s = formatMarketDate('2020-06-15');
    expect(s).toMatch(/Jun/);
    expect(s).toMatch(/2020/);
  });
  it('returns em dash for empty', () => {
    expect(formatMarketDate(null)).toBe('—');
    expect(formatMarketDate('')).toBe('—');
  });
});

describe('formatSqft / formatBaths / formatCoordinates', () => {
  it('formats sqft with grouping', () => {
    expect(formatSqft(1400)).toBe('1,400');
    expect(formatSqft(null)).toBe('—');
  });
  it('preserves half baths', () => {
    expect(formatBaths(2.5)).toBe('2.5');
    expect(formatBaths(2)).toBe('2');
  });
  it('formats coordinates', () => {
    expect(formatCoordinates(40.123456, -74.987654)).toContain('40.12346');
    expect(formatCoordinates(null, 1)).toBe('—');
  });
});

describe('formatListingProvider', () => {
  it('title-cases known providers', () => {
    expect(formatListingProvider('zillow')).toBe('Zillow');
    expect(formatListingProvider('redfin')).toBe('Redfin');
  });
});

describe('formatSnapshotAddress', () => {
  it('prefers formatted', () => {
    const snap = {
      version: '1' as const,
      address: { formatted: '123 Main St', line1: null, city: null, state: null, zip: null },
      geo: { lat: null, lng: null },
    };
    expect(formatSnapshotAddress(snap as PropertySnapshotV1)).toBe('123 Main St');
  });
  it('composes partial address', () => {
    const snap = {
      version: '1' as const,
      address: { formatted: '', line1: '1 Oak', city: 'Austin', state: 'TX', zip: '78701' },
      geo: { lat: null, lng: null },
    };
    expect(formatSnapshotAddress(snap as PropertySnapshotV1)).toContain('Austin');
  });
});

describe('buildMarketSnapshotRows', () => {
  it('returns stable row count for null snapshot', () => {
    const rows = buildMarketSnapshotRows(null);
    expect(rows.length).toBe(15);
    expect(rows.every((r) => r.value === '—')).toBe(true);
  });

  it('maps financials and structure', () => {
    const snap: PropertySnapshotV1 = {
      version: '1',
      address: { formatted: 'X' },
      geo: { lat: 1, lng: 2 },
      structure: { beds: 3, baths: 2, sqft: 1000, yearBuilt: 1999, propertyType: 'SFR' },
      financials: {
        rentEstimateMonthly: 2500,
        lastSalePrice: 400_000,
        lastSaleDate: '2019-01-01',
        assessedValueLatest: 380_000,
      },
      listing: { provider: 'zillow', parsingStatus: 'ok' },
      providerNotes: { rentcastProperty: true, rentcastRent: false },
    };
    const rows = buildMarketSnapshotRows(snap);
    const byLabel = Object.fromEntries(rows.map((r) => [r.label, r.value]));
    expect(byLabel['Rent estimate (monthly)']).toMatch(/\$2,500/);
    expect(byLabel.Beds).toBe('3');
    expect(byLabel['Property type']).toBe('SFR');
    expect(byLabel['Listing parse status']).toBe('ok');
    expect(byLabel['RentCast property record']).toBe('Yes');
    expect(byLabel['RentCast rent estimate']).toBe('No');
  });
});
