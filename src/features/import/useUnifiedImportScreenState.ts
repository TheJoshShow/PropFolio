import { useLayoutEffect, useMemo, useRef, useState } from 'react';

import { pasteContainsImportableListing } from '@/services/import/listingImportReadiness';

const URL_DEBOUNCE_MS = 400;

export type UrlClientValidation = 'idle' | 'checking' | 'valid' | 'invalid';

export type ActiveImportSource = 'url' | 'address' | null;

/** Normalize listing field text so verification ignores outer whitespace / NBSP (common in iOS paste). */
export function normalizeListingUrlInput(s: string): string {
  return s.replace(/\u00A0/g, ' ').trim();
}

type Options = {
  listingUrl: string;
  importReadyFromSuggestionPick: boolean;
  completingListingAddress: boolean;
};

/**
 * Debounced client-side listing URL checks (no network). Uses the same `parseListingUrl` rules as
 * the import Edge function so “verified” means importable, not merely “mentions Zillow”.
 *
 * When both a verified link and a verified Places address are present, **listing URL wins** so we
 * always send `importFromListingUrl` (richer snapshot) unless the user is in the NEEDS_ADDRESS
 * completion step (`completingListingAddress`).
 */
export function useUnifiedImportScreenState({
  listingUrl,
  importReadyFromSuggestionPick,
  completingListingAddress,
}: Options) {
  const [urlClientState, setUrlClientState] = useState<UrlClientValidation>('idle');
  /** Normalized text that last passed `pasteContainsImportableListing`. */
  const [urlVerifiedFingerprint, setUrlVerifiedFingerprint] = useState<string | null>(null);
  const listingUrlRef = useRef(listingUrl);
  listingUrlRef.current = listingUrl;

  useLayoutEffect(() => {
    const norm = normalizeListingUrlInput(listingUrl);
    if (!norm) {
      setUrlClientState('idle');
      setUrlVerifiedFingerprint(null);
      return;
    }
    setUrlClientState('checking');
    setUrlVerifiedFingerprint(null);
    const normAtSchedule = norm;
    const id = setTimeout(() => {
      const normNow = normalizeListingUrlInput(listingUrlRef.current);
      if (normNow !== normAtSchedule) {
        return;
      }
      if (pasteContainsImportableListing(normNow)) {
        setUrlClientState('valid');
        setUrlVerifiedFingerprint(normNow);
      } else {
        setUrlClientState('invalid');
        setUrlVerifiedFingerprint(null);
      }
    }, URL_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [listingUrl]);

  const urlIsStableVerified = useMemo(() => {
    const norm = normalizeListingUrlInput(listingUrl);
    return (
      urlClientState === 'valid' && urlVerifiedFingerprint !== null && urlVerifiedFingerprint === norm
    );
  }, [listingUrl, urlClientState, urlVerifiedFingerprint]);

  const activeImportSource = useMemo((): ActiveImportSource => {
    if (completingListingAddress) {
      return 'address';
    }
    const urlOk = urlIsStableVerified;
    const addrOk = importReadyFromSuggestionPick;
    if (!urlOk && !addrOk) {
      return null;
    }
    if (urlOk && !addrOk) {
      return 'url';
    }
    if (!urlOk && addrOk) {
      return 'address';
    }
    return 'url';
  }, [completingListingAddress, importReadyFromSuggestionPick, urlIsStableVerified]);

  return { urlClientState, urlIsStableVerified, activeImportSource };
}
