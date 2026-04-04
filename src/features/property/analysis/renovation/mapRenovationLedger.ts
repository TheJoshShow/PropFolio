import type { UserAssumptionOverrides } from '@/scoring';
import type { PropertySnapshotV1 } from '@/types/property';
import {
  RENOVATION_CATEGORY_DEFS,
  type RenovationCategoryKey,
  type RenovationItemsV1,
} from '@/types/renovationLedger';

/** Single category for rendering: stable key, label, coerced amount or null. */
export type RenovationLedgerRowModel = {
  key: RenovationCategoryKey;
  label: string;
  amount: number | null;
};

/**
 * Coerce imported/JSON values to a finite dollar amount or null.
 */
export function coerceLedgerMoney(value: unknown): number | null {
  if (value == null) {
    return null;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const n = Number(String(value).replace(/,/g, '').trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function readItem(items: RenovationItemsV1 | undefined, key: RenovationCategoryKey): unknown {
  if (!items || !Object.prototype.hasOwnProperty.call(items, key)) {
    return undefined;
  }
  return items[key];
}

/**
 * Merge snapshot line items with user override map. Override keys win when present on the object.
 */
export function mergeRenovationLedger(
  snapshot: PropertySnapshotV1 | null | undefined,
  overrides?: UserAssumptionOverrides['renovation'],
): Record<RenovationCategoryKey, number | null> {
  const base = snapshot?.renovation?.items;
  const over = overrides?.items;
  const out = {} as Record<RenovationCategoryKey, number | null>;
  for (const { key } of RENOVATION_CATEGORY_DEFS) {
    if (over && Object.prototype.hasOwnProperty.call(over, key)) {
      out[key] = coerceLedgerMoney(readItem(over, key));
    } else {
      out[key] = coerceLedgerMoney(readItem(base, key));
    }
  }
  return out;
}

/**
 * Sum of all categories that have a finite value. Returns null when no category has a value
 * (empty ledger — show em dash, not a fabricated total).
 */
export function sumRenovationLedger(items: Record<RenovationCategoryKey, number | null>): number | null {
  let sum = 0;
  let any = false;
  for (const { key } of RENOVATION_CATEGORY_DEFS) {
    const v = items[key];
    if (v != null && Number.isFinite(v)) {
      sum += v;
      any = true;
    }
  }
  return any ? sum : null;
}

export function buildRenovationLedgerRows(
  snapshot: PropertySnapshotV1 | null | undefined,
  overrides?: UserAssumptionOverrides['renovation'],
): RenovationLedgerRowModel[] {
  const merged = mergeRenovationLedger(snapshot, overrides);
  return RENOVATION_CATEGORY_DEFS.map(({ key, label }) => ({
    key,
    label,
    amount: merged[key],
  }));
}
