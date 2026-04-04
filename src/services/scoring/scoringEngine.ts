import type { PropertySnapshotV1 } from '@/types/property';

import { computeScoreFromPropertySnapshot } from '@/scoring';
import type { ScenarioPatch, ScoreBreakdown, UserAssumptionOverrides } from '@/scoring';

/** @deprecated Prefer `PropertySnapshotV1` + `scoringEngine.computeFromSnapshot`. */
export type ScoringPropertySnapshot = Record<string, unknown>;

export const scoringEngine = {
  /**
   * Full score from persisted property snapshot + optional user/scenario overlays.
   * All numbers are deterministic — never call AI for these results.
   */
  computeFromSnapshot(
    snapshot: PropertySnapshotV1,
    options?: {
      userOverrides?: UserAssumptionOverrides;
      scenario?: ScenarioPatch | null;
      rawPayload?: Record<string, unknown>;
    },
  ): ScoreBreakdown {
    return computeScoreFromPropertySnapshot(snapshot, options);
  },
};
