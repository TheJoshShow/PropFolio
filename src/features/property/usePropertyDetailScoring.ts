import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';

import { computeScoreFromPropertySnapshot } from '@/scoring';
import type { ScenarioPatch, ScoreBreakdown, UserAssumptionOverrides } from '@/scoring';
import type { PropertyRow } from '@/types/property';

import {
  clearPropertyDetailState,
  loadPropertyDetailState,
  savePropertyDetailState,
} from './propertyDetailScenarioStorage';

export function isUserAssumptionOverridesEmpty(o: UserAssumptionOverrides): boolean {
  const hasInputs = Boolean(o.inputs && Object.keys(o.inputs).length > 0);
  const hasFin = Boolean(o.financing && Object.keys(o.financing).length > 0);
  const hasOp = Boolean(o.operating && Object.keys(o.operating).length > 0);
  const hasReno = Boolean(o.renovation?.items && Object.keys(o.renovation.items).length > 0);
  return !hasInputs && !hasFin && !hasOp && !hasReno;
}

export type UsePropertyDetailScoringResult = {
  ready: boolean;
  userOverrides: UserAssumptionOverrides;
  setUserOverrides: Dispatch<SetStateAction<UserAssumptionOverrides>>;
  stressScenario: ScenarioPatch | null;
  setStressScenario: Dispatch<SetStateAction<ScenarioPatch | null>>;
  baselineBreakdown: ScoreBreakdown | null;
  breakdown: ScoreBreakdown | null;
  saveScenario: () => Promise<void>;
  resetToBaseline: () => Promise<void>;
  /** Loaded from device or saved this session */
  hasSavedAssumptionsFile: boolean;
  /** Overrides or renovation stress active */
  hasModelingLayer: boolean;
};

/**
 * Deterministic scoring for detail UI: imported snapshot + saved overrides + optional renovation stress patch.
 */
export function usePropertyDetailScoring(property: PropertyRow | null): UsePropertyDetailScoringResult {
  const id = property?.id;
  const snapshot = property?.snapshot ?? null;

  const [userOverrides, setUserOverrides] = useState<UserAssumptionOverrides>({});
  const [stressScenario, setStressScenario] = useState<ScenarioPatch | null>(null);
  const [ready, setReady] = useState(false);
  const [savedFileExists, setSavedFileExists] = useState(false);

  useEffect(() => {
    setReady(false);
    setUserOverrides({});
    setStressScenario(null);
    setSavedFileExists(false);
    if (!id) {
      setReady(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      const stored = await loadPropertyDetailState(id);
      if (cancelled) {
        return;
      }
      if (stored) {
        setUserOverrides(stored.userOverrides ?? {});
        setStressScenario(stored.scenarioPatch ?? null);
        setSavedFileExists(true);
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const baselineBreakdown = useMemo(() => {
    if (!snapshot) {
      return null;
    }
    return computeScoreFromPropertySnapshot(snapshot);
  }, [snapshot]);

  const breakdown = useMemo(() => {
    if (!snapshot) {
      return null;
    }
    return computeScoreFromPropertySnapshot(snapshot, {
      userOverrides,
      scenario: stressScenario,
    });
  }, [snapshot, userOverrides, stressScenario]);

  const saveScenario = useCallback(async () => {
    if (!id) {
      return;
    }
    await savePropertyDetailState(id, { userOverrides, scenarioPatch: stressScenario });
    setSavedFileExists(true);
  }, [id, userOverrides, stressScenario]);

  const resetToBaseline = useCallback(async () => {
    if (!id) {
      return;
    }
    setUserOverrides({});
    setStressScenario(null);
    await clearPropertyDetailState(id);
    setSavedFileExists(false);
  }, [id]);

  const hasModelingLayer = !isUserAssumptionOverridesEmpty(userOverrides) || stressScenario != null;

  return {
    ready,
    userOverrides,
    setUserOverrides,
    stressScenario,
    setStressScenario,
    baselineBreakdown,
    breakdown,
    saveScenario,
    resetToBaseline,
    hasSavedAssumptionsFile: savedFileExists,
    hasModelingLayer,
  };
}
