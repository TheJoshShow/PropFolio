/**
 * API and platform services: Supabase, property data, usage tracking.
 * Adapters live here; platform-specific code isolated.
 */

export { getSupabase, supabase } from './supabase';
export {
  geocodeAddress,
  placesAutocomplete,
  rentEstimate,
  openaiSummarize,
  censusData,
} from './edgeFunctions';
export type {
  GeocodeResult,
  PlacesPrediction,
  RentEstimateResult,
  OpenAISummarizeResult,
  CensusDataResult,
} from './edgeFunctions';
