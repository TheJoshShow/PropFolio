import { useCallback, useEffect, useRef, useState } from 'react';

import { isAbortError } from '@/lib/abortError';
import { generatePlacesSessionToken, generateUuid } from '@/lib/uuid';
import { isManualImportReadyToSubmit } from './manualImportReadiness';
import { propertyImportService } from '@/services/property-import';
import type { AutocompletePrediction, ResolvedPlaceDto } from '@/services/property-import';
import { isResolvedPlaceComplete } from '@/services/property-import/placesResponseTransforms';
import { serverEdgeService } from '@/services/edge/serverEdgeService';

const MIN_QUERY_CHARS = 3;
/** Minimum typed length before “verify address” fallback (geocode + place details). */
const MIN_MANUAL_GEOCODE_CHARS = 12;
/** Slightly relaxed to cut wasted autocomplete calls while typing. */
const DEBOUNCE_MS = 420;

function logPlacesClientError(scope: 'autocomplete' | 'resolve', message: string, err: unknown) {
  const detail = err instanceof Error ? err.message : String(err);
  console.error(`[PropFolio places ${scope}] ${message}`, detail);
}

function classifyAutocompleteErrorMessage(msg: string): string {
  const lower = msg.toLowerCase();
  if (
    lower.includes('requested function was not found') ||
    lower.includes('function not found') ||
    (lower.includes('not found') && lower.includes('function'))
  ) {
    return 'Address suggestions are temporarily unavailable. You can still enter the full address manually.';
  }
  if (lower.includes('unauthorized') || msg === 'UNAUTHORIZED' || lower.includes('401')) {
    return 'Sign in again to use address search.';
  }
  if (
    lower.includes('not configured') ||
    lower.includes('places search is not') ||
    lower.includes('places is not configured') ||
    lower.includes('permission_denied') ||
    lower.includes('permission denied') ||
    lower.includes('invalid_argument') ||
    lower.includes('invalid argument') ||
    lower.includes('api key not valid') ||
    lower.includes('billing') ||
    lower.includes('blocked')
  ) {
    return msg.length > 0 && msg.length < 140 ? msg : 'Address search is not available in this build.';
  }
  if (
    lower.includes('timed out') ||
    lower.includes('timeout') ||
    lower.includes('network') ||
    lower.includes('socket') ||
    lower.includes('failed to fetch') ||
    lower.includes('econnrefused') ||
    lower.includes('econnreset') ||
    lower.includes('503') ||
    lower.includes('504') ||
    lower.includes('502') ||
    lower.includes('autocomplete failed') ||
    lower.includes('server error')
  ) {
    return 'Suggestions are temporarily unavailable. Check your connection and try again.';
  }
  if (msg.trim().length > 0 && msg.length < 200) {
    return msg.trim();
  }
  return "Couldn't load address suggestions. Check your connection and try again.";
}

export type ManualAddressSearchConfig = {
  /** When false, hooks idle (no debounce / fetch). */
  active: boolean;
  /** Correlation id for edge logs (rotate when entering manual flow). */
  placesCorrelationId?: string;
};

export type ManualAddressSearchState = {
  query: string;
  debouncedQuery: string;
  suggestions: AutocompletePrediction[];
  selectedSuggestion: AutocompletePrediction | null;
  selectedPlaceId: string | null;
  placeDetails: ResolvedPlaceDto | null;
  isLoadingSuggestions: boolean;
  isResolvingSelection: boolean;
  autocompleteSessionToken: string;
  autocompleteError: string | null;
};

export function useManualAddressSearch(config: ManualAddressSearchConfig) {
  const { active, placesCorrelationId: placesCorrelationIdProp } = config;

  const [query, setQueryState] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AutocompletePrediction[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<AutocompletePrediction | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [placeDetails, setPlaceDetails] = useState<ResolvedPlaceDto | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isResolvingSelection, setIsResolvingSelection] = useState(false);
  const [isManualGeocoding, setIsManualGeocoding] = useState(false);
  const sessionTokenRef = useRef(generatePlacesSessionToken());
  const [autocompleteSessionToken, setAutocompleteSessionToken] = useState(() => sessionTokenRef.current);
  const [autocompleteError, setAutocompleteError] = useState<string | null>(null);

  const placesCorrelationIdRef = useRef(placesCorrelationIdProp ?? generateUuid());
  useEffect(() => {
    if (placesCorrelationIdProp) {
      placesCorrelationIdRef.current = placesCorrelationIdProp;
    }
  }, [placesCorrelationIdProp]);

  const autocompleteSeqRef = useRef(0);
  const autocompleteAbortRef = useRef<AbortController | null>(null);
  const resolveSeqRef = useRef(0);
  const resolveInFlightPlaceIdRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryRef = useRef(query);
  queryRef.current = query;

  const rotateSessionToken = useCallback(() => {
    const next = generatePlacesSessionToken();
    sessionTokenRef.current = next;
    setAutocompleteSessionToken(next);
  }, []);

  const resetSearchSession = useCallback(() => {
    autocompleteAbortRef.current?.abort();
    autocompleteAbortRef.current = null;
    autocompleteSeqRef.current += 1;
    resolveSeqRef.current += 1;
    resolveInFlightPlaceIdRef.current = null;
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    setDebouncedQuery('');
    setSuggestions([]);
    setSelectedSuggestion(null);
    setSelectedPlaceId(null);
    setPlaceDetails(null);
    setIsLoadingSuggestions(false);
    setIsResolvingSelection(false);
    setIsManualGeocoding(false);
    setAutocompleteError(null);
    setQueryState('');
    rotateSessionToken();
  }, [rotateSessionToken]);

  const beginNewSearchSessionKeepingQuery = useCallback(() => {
    autocompleteAbortRef.current?.abort();
    autocompleteAbortRef.current = null;
    autocompleteSeqRef.current += 1;
    rotateSessionToken();
    setSuggestions([]);
    setSelectedSuggestion(null);
    setSelectedPlaceId(null);
    setPlaceDetails(null);
    setAutocompleteError(null);
  }, [rotateSessionToken]);

  const setQuery = useCallback(
    (next: string) => {
      if (placeDetails) {
        beginNewSearchSessionKeepingQuery();
      }
      setQueryState(next);
      setAutocompleteError(null);
    },
    [beginNewSearchSessionKeepingQuery, placeDetails],
  );

  const runAutocomplete = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < MIN_QUERY_CHARS) {
      return;
    }
    autocompleteAbortRef.current?.abort();
    const ac = new AbortController();
    autocompleteAbortRef.current = ac;
    const seq = ++autocompleteSeqRef.current;
    setIsLoadingSuggestions(true);
    setAutocompleteError(null);
    try {
      const res = await propertyImportService.autocompleteAddress(
        trimmed,
        sessionTokenRef.current,
        placesCorrelationIdRef.current,
        { signal: ac.signal },
      );
      if (seq !== autocompleteSeqRef.current) {
        return;
      }
      setSuggestions(res.predictions ?? []);
    } catch (e) {
      if (isAbortError(e)) {
        return;
      }
      if (seq !== autocompleteSeqRef.current) {
        return;
      }
      setSuggestions([]);
      logPlacesClientError('autocomplete', 'request failed', e);
      const msg = e instanceof Error ? e.message : '';
      setAutocompleteError(classifyAutocompleteErrorMessage(msg));
    } finally {
      if (seq === autocompleteSeqRef.current) {
        setIsLoadingSuggestions(false);
      }
      if (autocompleteAbortRef.current === ac) {
        autocompleteAbortRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    if (!active) {
      autocompleteAbortRef.current?.abort();
      autocompleteAbortRef.current = null;
      autocompleteSeqRef.current += 1;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      setIsLoadingSuggestions(false);
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_CHARS) {
      autocompleteAbortRef.current?.abort();
      autocompleteAbortRef.current = null;
      autocompleteSeqRef.current += 1;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      setDebouncedQuery('');
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      setAutocompleteError(null);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      const latest = queryRef.current.trim();
      setDebouncedQuery(latest);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, active]);

  useEffect(() => {
    if (!active) {
      return;
    }
    const trimmed = debouncedQuery.trim();
    if (trimmed.length < MIN_QUERY_CHARS) {
      return;
    }
    void runAutocomplete(debouncedQuery);
  }, [debouncedQuery, active, runAutocomplete]);

  const selectSuggestion = useCallback(
    async (prediction: AutocompletePrediction) => {
      if (resolveInFlightPlaceIdRef.current === prediction.placeId) {
        return;
      }
      if (placeDetails?.placeId === prediction.placeId && isResolvedPlaceComplete(placeDetails)) {
        return;
      }

      const seq = ++resolveSeqRef.current;
      resolveInFlightPlaceIdRef.current = prediction.placeId;
      setSelectedSuggestion(prediction);
      setSelectedPlaceId(prediction.placeId);
      setQueryState(prediction.fullText);
      setSuggestions([]);
      setAutocompleteError(null);
      setPlaceDetails(null);
      setIsResolvingSelection(true);

      const tokenForDetails = sessionTokenRef.current;

      try {
        const res = await propertyImportService.resolvePlaceDetails(
          prediction.placeId,
          placesCorrelationIdRef.current,
          tokenForDetails,
        );
        if (seq !== resolveSeqRef.current) {
          return;
        }
        const dto: ResolvedPlaceDto = {
          placeId: res.placeId,
          formattedAddress: res.formattedAddress,
          latitude: res.latitude,
          longitude: res.longitude,
          normalizedOneLine: res.normalizedOneLine ?? null,
          streetNumber: res.streetNumber ?? null,
          route: res.route ?? null,
          city: res.city ?? null,
          state: res.state ?? null,
          postalCode: res.postalCode ?? null,
          country: res.country ?? null,
        };
        if (!isResolvedPlaceComplete(dto)) {
          setAutocompleteError('Unable to verify this address. Pick another suggestion or refine your search.');
          logPlacesClientError('resolve', 'incomplete place payload', dto);
          return;
        }
        const display =
          dto.formattedAddress.trim() ||
          (typeof dto.normalizedOneLine === 'string' ? dto.normalizedOneLine.trim() : '');
        setQueryState(display);
        setPlaceDetails(dto);
      } catch (e) {
        if (seq !== resolveSeqRef.current) {
          return;
        }
        logPlacesClientError('resolve', 'request failed', e);
        const msg = e instanceof Error ? e.message : 'Could not verify this address.';
        setAutocompleteError(
          msg.toLowerCase().includes('resolve') || msg.length < 120
            ? msg
            : 'Unable to verify this address. Try another suggestion.',
        );
      } finally {
        if (resolveInFlightPlaceIdRef.current === prediction.placeId) {
          resolveInFlightPlaceIdRef.current = null;
        }
        if (seq === resolveSeqRef.current) {
          setIsResolvingSelection(false);
          rotateSessionToken();
        }
      }
    },
    [placeDetails, rotateSessionToken],
  );

  /** Address text + coordinates resolved (includes geocode path — not sufficient for import submit). */
  const importReady = isResolvedPlaceComplete(placeDetails);

  /**
   * True only when the user picked an autocomplete row and place details match that pick.
   * Prevents treating geocode-only verification as import-ready.
   */
  const importReadyToSubmit = isManualImportReadyToSubmit(
    placeDetails,
    selectedSuggestion,
    selectedPlaceId,
  );

  const resolveManualEntryViaGeocode = useCallback(async (): Promise<ResolvedPlaceDto | null> => {
    const line = queryRef.current.trim();
    if (line.length < MIN_MANUAL_GEOCODE_CHARS) {
      setAutocompleteError(
        `Enter at least ${MIN_MANUAL_GEOCODE_CHARS} characters (street, city, and ZIP) to verify.`,
      );
      return null;
    }
    const seq = ++resolveSeqRef.current;
    setIsManualGeocoding(true);
    setAutocompleteError(null);
    try {
      const norm = await serverEdgeService.normalizeAddress(line, placesCorrelationIdRef.current);
      if (seq !== resolveSeqRef.current) {
        return null;
      }
      if (norm.ok === false) {
        setAutocompleteError(
          norm.error.message.length < 180
            ? norm.error.message
            : 'We couldn’t verify that address. Check spelling and try again.',
        );
        return null;
      }
      const n = norm.normalized;
      const pid = n?.placeId?.trim();
      if (!pid) {
        setAutocompleteError(
          'We couldn’t verify that address. Try a suggestion from search or refine what you typed.',
        );
        return null;
      }
      const res = await propertyImportService.resolvePlaceDetails(
        pid,
        placesCorrelationIdRef.current,
        undefined,
      );
      if (seq !== resolveSeqRef.current) {
        return null;
      }
      const dto: ResolvedPlaceDto = {
        placeId: res.placeId,
        formattedAddress: res.formattedAddress,
        latitude: res.latitude,
        longitude: res.longitude,
        normalizedOneLine: res.normalizedOneLine ?? null,
        streetNumber: res.streetNumber ?? null,
        route: res.route ?? null,
        city: res.city ?? null,
        state: res.state ?? null,
        postalCode: res.postalCode ?? null,
        country: res.country ?? null,
      };
      if (!isResolvedPlaceComplete(dto)) {
        setAutocompleteError('Unable to verify this address. Check the spelling and try again.');
        return null;
      }
      const display =
        dto.formattedAddress.trim() ||
        (typeof dto.normalizedOneLine === 'string' ? dto.normalizedOneLine.trim() : '');
      setQueryState(display);
      setSelectedSuggestion(null);
      setSelectedPlaceId(dto.placeId);
      setPlaceDetails(dto);
      rotateSessionToken();
      return dto;
    } catch (e) {
      if (seq !== resolveSeqRef.current) {
        return null;
      }
      logPlacesClientError('resolve', 'manual geocode path failed', e);
      setAutocompleteError(classifyAutocompleteErrorMessage(e instanceof Error ? e.message : ''));
      return null;
    } finally {
      if (seq === resolveSeqRef.current) {
        setIsManualGeocoding(false);
      }
    }
  }, [rotateSessionToken]);

  const canAttemptManualVerify = query.trim().length >= MIN_MANUAL_GEOCODE_CHARS && !importReady;

  return {
    MIN_QUERY_CHARS,
    MIN_MANUAL_GEOCODE_CHARS,
    query,
    setQuery,
    debouncedQuery,
    suggestions,
    selectedSuggestion,
    selectedPlaceId,
    placeDetails,
    isLoadingSuggestions,
    isResolvingSelection,
    isManualGeocoding,
    autocompleteSessionToken,
    autocompleteError,
    selectSuggestion,
    resolveManualEntryViaGeocode,
    resetSearchSession,
    rotateSessionToken,
    importReady,
    importReadyToSubmit,
    canAttemptManualVerify,
  };
}

export type ManualAddressSearchHandle = ReturnType<typeof useManualAddressSearch>;
