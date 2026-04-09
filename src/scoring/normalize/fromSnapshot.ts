import type { PropertySnapshotV1 } from '@/types/property';

import type { NormalizedPropertyInputs, RawProviderEnvelope } from '../domain/types';
import { finiteOrNull } from './guards';

/**
 * Maps persisted snapshot → normalized inputs for scoring.
 * Extend when snapshot schema grows (e.g. explicit tax lines from provider).
 */
export function normalizedInputsFromSnapshot(
  snapshot: PropertySnapshotV1,
  raw?: RawProviderEnvelope,
): { normalized: NormalizedPropertyInputs; raw: RawProviderEnvelope | undefined } {
  const s = snapshot.structure ?? {};
  const f = snapshot.financials ?? {};

  const unitsFromSnap = finiteOrNull(s.unitCount);
  const unitCount =
    unitsFromSnap != null && unitsFromSnap >= 1
      ? Math.min(Math.floor(unitsFromSnap), 999)
      : 1;

  const normalized: NormalizedPropertyInputs = {
    version: 1,
    unitCount,
    monthlyRentGross: finiteOrNull(f.rentEstimateMonthly),
    purchasePrice: finiteOrNull(f.lastSalePrice),
    arv: null,
    sqft: finiteOrNull(s.sqft),
    yearBuilt: finiteOrNull(s.yearBuilt),
    propertyType: typeof s.propertyType === 'string' ? s.propertyType : null,
    annualPropertyTax: null,
    annualInsurance: null,
    annualHoa: null,
    annualOtherOperating: null,
    rehabBudget: null,
  };

  return {
    normalized,
    raw: raw ?? {
      source: snapshot.providerNotes?.rentcastProperty ? 'rentcast' : 'unknown',
      payload: { snapshotVersion: snapshot.version },
    },
  };
}
