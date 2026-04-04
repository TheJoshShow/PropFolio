import type { CalculatedMetric } from '@/scoring';
import { formatCurrency } from '@/types/property';

/**
 * Display layer for engine metrics — keep in sync with `CalculatedMetric.unit` meanings.
 */
export function formatCalculatedMetric(m: CalculatedMetric): string {
  if (m.availability !== 'ok' || m.value == null || !Number.isFinite(m.value)) {
    return '—';
  }
  const v = m.value;
  switch (m.unit) {
    case 'ratio':
      return `${(v * 100).toFixed(2)}%`;
    case 'currency_annual':
    case 'currency_monthly':
      return formatCurrency(v);
    case 'multiple':
      if (m.key === 'dscr') {
        return `${v.toFixed(2)}×`;
      }
      if (m.key === 'gross_rent_multiplier_hint') {
        return `${v.toFixed(1)}×`;
      }
      return String(v);
    case 'percent':
      return `${v.toFixed(1)}%`;
    default:
      return String(v);
  }
}

export function metricFootnote(m: CalculatedMetric): string | undefined {
  if (m.missingDrivers.length === 0) {
    return undefined;
  }
  return `Needs: ${m.missingDrivers.slice(0, 3).join(', ')}${m.missingDrivers.length > 3 ? '…' : ''}`;
}
