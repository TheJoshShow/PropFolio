import { describe, expect, it } from 'vitest';

import type { PropertySnapshotV1 } from '@/types/property';

import {
  buildRenovationLedgerRows,
  coerceLedgerMoney,
  mergeRenovationLedger,
  sumRenovationLedger,
} from './mapRenovationLedger';

describe('coerceLedgerMoney', () => {
  it('accepts finite numbers and numeric strings', () => {
    expect(coerceLedgerMoney(12000)).toBe(12000);
    expect(coerceLedgerMoney('8,500')).toBe(8500);
    expect(coerceLedgerMoney(' 0 ')).toBe(0);
  });
  it('returns null for bad input', () => {
    expect(coerceLedgerMoney(null)).toBeNull();
    expect(coerceLedgerMoney(undefined)).toBeNull();
    expect(coerceLedgerMoney(NaN)).toBeNull();
    expect(coerceLedgerMoney('x')).toBeNull();
    expect(coerceLedgerMoney({})).toBeNull();
  });
});

describe('mergeRenovationLedger', () => {
  it('fills every category with null when snapshot empty', () => {
    const m = mergeRenovationLedger({} as PropertySnapshotV1, undefined);
    expect(Object.keys(m).length).toBe(13);
    expect(m.kitchen).toBeNull();
  });

  it('reads snapshot items and merges overrides', () => {
    const snap: PropertySnapshotV1 = {
      version: '1',
      address: { formatted: 'x' },
      geo: { lat: null, lng: null },
      renovation: {
        items: { kitchen: 10000, hvac: 2000 },
      },
    };
    const m = mergeRenovationLedger(snap, { items: { kitchen: 15000 } });
    expect(m.kitchen).toBe(15000);
    expect(m.hvac).toBe(2000);
    expect(m.plumbing).toBeNull();
  });

  it('allows explicit null override', () => {
    const snap: PropertySnapshotV1 = {
      version: '1',
      address: { formatted: 'x' },
      geo: { lat: null, lng: null },
      renovation: { items: { kitchen: 5000 } },
    };
    const m = mergeRenovationLedger(snap, { items: { kitchen: null } });
    expect(m.kitchen).toBeNull();
  });
});

describe('sumRenovationLedger', () => {
  it('returns null when no amounts', () => {
    const m = mergeRenovationLedger(undefined, undefined);
    expect(sumRenovationLedger(m)).toBeNull();
  });
  it('sums present rows only', () => {
    const m = mergeRenovationLedger(
      {
        version: '1',
        address: { formatted: 'x' },
        geo: { lat: null, lng: null },
        renovation: { items: { kitchen: 1000, contingency: 500 } },
      },
      undefined,
    );
    expect(sumRenovationLedger(m)).toBe(1500);
  });
  it('treats explicit zeros as contributing to total', () => {
    const merged = mergeRenovationLedger(undefined, undefined);
    merged.kitchen = 0;
    merged.bathrooms = 0;
    expect(sumRenovationLedger(merged)).toBe(0);
  });
});

describe('buildRenovationLedgerRows', () => {
  it('returns 13 rows in definition order', () => {
    const rows = buildRenovationLedgerRows(undefined, undefined);
    expect(rows).toHaveLength(13);
    expect(rows[0].key).toBe('roofExteriorEnvelope');
    expect(rows[rows.length - 1].key).toBe('contingency');
  });
});
