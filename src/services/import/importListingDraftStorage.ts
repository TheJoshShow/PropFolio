import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'propfolio.import.listingDraft.v1';

/** Max length aligned with import-property raw URL cap. */
const MAX_LEN = 2048;

export async function saveImportListingDraft(url: string): Promise<void> {
  const t = url.trim();
  if (!t) {
    return;
  }
  await AsyncStorage.setItem(KEY, t.slice(0, MAX_LEN));
}

export async function consumeImportListingDraft(): Promise<string | null> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    if (v) {
      await AsyncStorage.removeItem(KEY);
    }
    return v;
  } catch {
    return null;
  }
}
