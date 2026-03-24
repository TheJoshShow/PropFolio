import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PropertyWhatIfDraft } from '../features/property-analysis/whatIfAssumptions';
import { recordFlowException } from './monitoring/flowInstrumentation';

const PREFIX = '@propfolio/property_what_if';

interface StoredWhatIf {
  draft: PropertyWhatIfDraft;
  propertyUpdatedAt: string | null;
}

function key(userId: string, propertyId: string): string {
  return `${PREFIX}_${userId}_${propertyId}`;
}

export async function getPropertyWhatIfOverrides(
  userId: string,
  propertyId: string,
  propertyUpdatedAt: string | null
): Promise<PropertyWhatIfDraft | null> {
  if (!userId.trim() || !propertyId.trim()) return null;
  try {
    const raw = await AsyncStorage.getItem(key(userId, propertyId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredWhatIf | PropertyWhatIfDraft;
    if (
      parsed &&
      typeof parsed === 'object' &&
      'draft' in parsed &&
      typeof (parsed as StoredWhatIf).draft === 'object'
    ) {
      const stored = parsed as StoredWhatIf;
      if (stored.propertyUpdatedAt && propertyUpdatedAt && stored.propertyUpdatedAt !== propertyUpdatedAt) {
        await AsyncStorage.removeItem(key(userId, propertyId));
        return null;
      }
      return stored.draft ?? null;
    }
    // Backward compatibility with old shape; clear if property baseline changed.
    if (propertyUpdatedAt) {
      await AsyncStorage.removeItem(key(userId, propertyId));
      return null;
    }
    return parsed as PropertyWhatIfDraft;
  } catch {
    return null;
  }
}

export async function setPropertyWhatIfOverrides(
  userId: string,
  propertyId: string,
  value: PropertyWhatIfDraft,
  propertyUpdatedAt: string | null
): Promise<void> {
  if (!userId.trim() || !propertyId.trim()) return;
  try {
    const payload: StoredWhatIf = { draft: value, propertyUpdatedAt };
    await AsyncStorage.setItem(key(userId, propertyId), JSON.stringify(payload));
  } catch (e) {
    recordFlowException('analysis_whatif_storage_write_failed', e, { stage: 'whatif_storage', recoverable: true });
  }
}

export async function clearPropertyWhatIfOverrides(userId: string, propertyId: string): Promise<void> {
  if (!userId.trim() || !propertyId.trim()) return;
  try {
    await AsyncStorage.removeItem(key(userId, propertyId));
  } catch {
    // ignore
  }
}
