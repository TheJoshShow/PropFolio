import type { AutocompletePrediction, ResolvedPlaceDto } from '@/services/property-import';
import { isResolvedPlaceComplete } from '@/services/property-import/placesResponseTransforms';

/**
 * Manual import may only proceed after the user taps an autocomplete suggestion and
 * place details resolve for that same `placeId` (not free-text / geocode-only).
 */
export function isManualImportReadyFromSuggestionPick(
  placeDetails: ResolvedPlaceDto | null,
  selectedSuggestion: AutocompletePrediction | null,
): boolean {
  if (!selectedSuggestion || !placeDetails) {
    return false;
  }
  if (!isResolvedPlaceComplete(placeDetails)) {
    return false;
  }
  return placeDetails.placeId === selectedSuggestion.placeId;
}
