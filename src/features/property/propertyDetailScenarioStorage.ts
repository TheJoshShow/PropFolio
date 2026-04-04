import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ScenarioPatch, UserAssumptionOverrides } from '@/scoring';

/**
 * Local persistence for property-detail assumptions / scenarios.
 * Replace with Supabase `property_assumptions` (or snapshot JSON merge) when API exists.
 */
const key = (propertyId: string) => `@propfolio/detail_state_v1/${propertyId}`;

export type PropertyDetailPersistedState = {
  v: 1;
  userOverrides: UserAssumptionOverrides;
  /** Optional non-persisted stress tests use hook state; this stores an explicit saved scenario overlay if used later */
  scenarioPatch: ScenarioPatch | null;
  savedAtIso: string;
};

export async function loadPropertyDetailState(
  propertyId: string,
): Promise<PropertyDetailPersistedState | null> {
  try {
    const raw = await AsyncStorage.getItem(key(propertyId));
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as PropertyDetailPersistedState;
    if (parsed?.v !== 1 || typeof parsed.userOverrides !== 'object') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function savePropertyDetailState(
  propertyId: string,
  state: {
    userOverrides: UserAssumptionOverrides;
    scenarioPatch: ScenarioPatch | null;
    savedAtIso?: string;
  },
): Promise<void> {
  const payload: PropertyDetailPersistedState = {
    v: 1,
    userOverrides: state.userOverrides,
    scenarioPatch: state.scenarioPatch ?? null,
    savedAtIso: state.savedAtIso ?? new Date().toISOString(),
  };
  await AsyncStorage.setItem(key(propertyId), JSON.stringify(payload));
}

export async function clearPropertyDetailState(propertyId: string): Promise<void> {
  await AsyncStorage.removeItem(key(propertyId));
}
