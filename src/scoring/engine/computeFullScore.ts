import type { PropertySnapshotV1 } from '@/types/property';

import { mergeUserAssumptions, defaultFinancing, defaultOperating } from '../assumptions/mergeAssumptions';
import type {
  RawProviderEnvelope,
  ScoreBreakdown,
  ScoringEngineInput,
  ScenarioPatch,
  UserAssumptionOverrides,
} from '../domain/types';
import { normalizedInputsFromSnapshot } from '../normalize/fromSnapshot';
import { applyScenario } from '../scenarios/applyScenario';
import { computePrimaryMetrics } from '../calculate/primaryMetrics';
import { computeConfidence } from '../confidence/computeConfidence';
import { buildScoreFactors } from '../factors/buildScoreFactors';

export const SCORING_ENGINE_VERSION = 'propfolio-scoring-1.0.0';

/**
 * End-to-end deterministic score run. No side effects; safe to call on every assumption change.
 */
export function computeFullScore(input: ScoringEngineInput): ScoreBreakdown {
  const financing0 = input.financing ?? defaultFinancing();
  const operating0 = input.operating ?? defaultOperating();

  const merged = mergeUserAssumptions(
    input.normalized,
    financing0,
    operating0,
    input.userOverrides,
  );

  const scenarized = applyScenario(
    merged.normalized,
    merged.financing,
    merged.operating,
    input.activeScenario ?? null,
  );

  const primaryMetrics = computePrimaryMetrics(
    scenarized.normalized,
    scenarized.financing,
    scenarized.operating,
  );

  const confidence = computeConfidence(scenarized.normalized);
  const factors = buildScoreFactors(
    scenarized.normalized,
    scenarized.financing,
    scenarized.operating,
    primaryMetrics,
    confidence.score,
  );

  return {
    schemaVersion: 2,
    engineVersion: SCORING_ENGINE_VERSION,
    computedAtIso: new Date().toISOString(),
    scenarioId: scenarized.scenarioId,
    confidence,
    primaryMetrics,
    factors,
    effectiveInputs: scenarized.normalized,
    effectiveFinancing: scenarized.financing,
    effectiveOperating: scenarized.operating,
  };
}

/** Convenience: snapshot from DB + optional user/scenario overlays. */
export function computeScoreFromPropertySnapshot(
  snapshot: PropertySnapshotV1,
  options?: {
    userOverrides?: UserAssumptionOverrides;
    scenario?: ScenarioPatch | null;
    rawPayload?: Record<string, unknown>;
  },
): ScoreBreakdown {
  const rawEnvelope: RawProviderEnvelope | undefined =
    options?.rawPayload != null
      ? {
          source: snapshot.providerNotes?.rentcastProperty ? 'rentcast' : 'unknown',
          payload: options.rawPayload,
        }
      : undefined;

  const { normalized } = normalizedInputsFromSnapshot(snapshot, rawEnvelope);

  return computeFullScore({
    normalized,
    financing: defaultFinancing(),
    operating: defaultOperating(),
    userOverrides: options?.userOverrides,
    activeScenario: options?.scenario ?? null,
  });
}
