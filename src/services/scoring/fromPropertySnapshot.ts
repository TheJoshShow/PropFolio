import type { PropertySnapshotV1 } from '@/types/property';

import type { ScoringPropertySnapshot } from './scoringEngine';

/**
 * Legacy debug shape; prefer `scoringEngine.computeFromSnapshot(snapshot)` for scores.
 */
export function propertySnapshotToScoringInput(
  snapshot: PropertySnapshotV1,
): ScoringPropertySnapshot {
  const si = snapshot.scoringInputs ?? {};
  return {
    version: snapshot.version,
    addressFormatted: snapshot.address.formatted,
    geo: snapshot.geo,
    structure: snapshot.structure ?? {},
    financials: snapshot.financials ?? {},
    ...si,
  };
}
