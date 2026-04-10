import type { AutocompletePrediction, ResolvedPlaceDto } from '@/services/property-import';
import { isResolvedPlaceComplete } from '@/services/property-import/placesResponseTransforms';

/**
 * Manual import may proceed when:
 * - the user picked a suggestion and place details match that `placeId`, or
 * - the user verified via “verify address” (geocode + place details) — no suggestion row, but
 *   `selectedPlaceId` matches the resolved `placeDetails.placeId`.
 */
export function isManualImportReadyToSubmit(
  placeDetails: ResolvedPlaceDto | null,
  selectedSuggestion: AutocompletePrediction | null,
  selectedPlaceId: string | null,
): boolean {
  if (!placeDetails || !isResolvedPlaceComplete(placeDetails)) {
    return false;
  }
  if (selectedSuggestion) {
    return placeDetails.placeId === selectedSuggestion.placeId;
  }
  return typeof selectedPlaceId === 'string' && selectedPlaceId === placeDetails.placeId;
}
