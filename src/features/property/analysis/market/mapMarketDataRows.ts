import { formatCurrency, type PropertySnapshotV1 } from '@/types/property';

export type MarketDataRowModel = {
  label: string;
  value: string;
  valueDetail?: string;
};

function emDash(): string {
  return '—';
}

export function formatMarketDate(raw: string | null | undefined): string {
  if (raw == null || typeof raw !== 'string' || !raw.trim()) {
    return emDash();
  }
  const d = new Date(raw.trim());
  if (Number.isNaN(d.getTime())) {
    return raw.trim();
  }
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatOptionalInt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) {
    return emDash();
  }
  return String(Math.round(n));
}

export function formatBaths(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) {
    return emDash();
  }
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function formatSqft(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) {
    return emDash();
  }
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(n));
}

export function formatCoordinates(lat: number | null | undefined, lng: number | null | undefined): string {
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return emDash();
  }
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export function formatYesNoKnown(yes: boolean | undefined): string {
  if (yes === true) {
    return 'Yes';
  }
  if (yes === false) {
    return 'No';
  }
  return 'Unknown';
}

export function formatListingProvider(provider: string | null | undefined): string {
  if (provider == null || provider === '') {
    return emDash();
  }
  if (provider === 'zillow') {
    return 'Zillow';
  }
  if (provider === 'redfin') {
    return 'Redfin';
  }
  return provider;
}

/**
 * Primary address line for display — prefers formatted, else composed line.
 */
export function formatSnapshotAddress(snap: PropertySnapshotV1): string {
  const f = snap.address?.formatted?.trim();
  if (f) {
    return f;
  }
  const parts = [snap.address?.line1, snap.address?.city, snap.address?.state, snap.address?.zip].filter(
    (x): x is string => typeof x === 'string' && x.trim().length > 0,
  );
  if (parts.length > 0) {
    return parts.join(', ');
  }
  return emDash();
}

/**
 * Rows derived only from snapshot import data (no fabricated market stats).
 */
export function buildMarketSnapshotRows(snap: PropertySnapshotV1 | null | undefined): MarketDataRowModel[] {
  if (!snap) {
    const dash = emDash();
    return [
      { label: 'Rent estimate (monthly)', value: dash },
      { label: 'Last sale price', value: dash },
      { label: 'Last sale date', value: dash },
      { label: 'Assessed value (latest)', value: dash },
      { label: 'Beds', value: dash },
      { label: 'Baths', value: dash },
      { label: 'Square feet', value: dash },
      { label: 'Year built', value: dash },
      { label: 'Property type', value: dash },
      { label: 'Listing provider', value: dash },
      { label: 'Listing parse status', value: dash },
      { label: 'Address (import)', value: dash },
      { label: 'Coordinates', value: dash },
      { label: 'RentCast property record', value: dash },
      { label: 'RentCast rent estimate', value: dash },
    ];
  }

  const fin = snap.financials;
  const str = snap.structure;
  const rent =
    fin?.rentEstimateMonthly != null && Number.isFinite(fin.rentEstimateMonthly)
      ? formatCurrency(fin.rentEstimateMonthly)
      : emDash();
  const sale =
    fin?.lastSalePrice != null && Number.isFinite(fin.lastSalePrice)
      ? formatCurrency(fin.lastSalePrice)
      : emDash();
  const assessed =
    fin?.assessedValueLatest != null && Number.isFinite(fin.assessedValueLatest)
      ? formatCurrency(fin.assessedValueLatest)
      : emDash();

  const propType =
    str?.propertyType != null && String(str.propertyType).trim() !== ''
      ? String(str.propertyType).trim()
      : emDash();

  const parseStatusRaw = snap.listing?.parsingStatus;
  const parseStatus =
    parseStatusRaw != null && String(parseStatusRaw).trim() !== ''
      ? String(parseStatusRaw).trim()
      : emDash();

  return [
    { label: 'Rent estimate (monthly)', value: rent },
    { label: 'Last sale price', value: sale },
    { label: 'Last sale date', value: formatMarketDate(fin?.lastSaleDate ?? null) },
    { label: 'Assessed value (latest)', value: assessed },
    { label: 'Beds', value: formatOptionalInt(str?.beds ?? null) },
    { label: 'Baths', value: formatBaths(str?.baths ?? null) },
    { label: 'Square feet', value: formatSqft(str?.sqft ?? null) },
    { label: 'Year built', value: formatOptionalInt(str?.yearBuilt ?? null) },
    { label: 'Property type', value: propType },
    { label: 'Listing provider', value: formatListingProvider(snap.listing?.provider ?? null) },
    { label: 'Listing parse status', value: parseStatus },
    { label: 'Address (import)', value: formatSnapshotAddress(snap) },
    { label: 'Coordinates', value: formatCoordinates(snap.geo?.lat ?? null, snap.geo?.lng ?? null) },
    {
      label: 'RentCast property record',
      value: formatYesNoKnown(snap.providerNotes?.rentcastProperty),
    },
    {
      label: 'RentCast rent estimate',
      value: formatYesNoKnown(snap.providerNotes?.rentcastRent),
    },
  ];
}
