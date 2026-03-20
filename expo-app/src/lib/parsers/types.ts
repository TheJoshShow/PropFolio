/**
 * Parser types: partial address, parsed listing URL, errors.
 * Matches PropFolio PartialAddress, ParsedListingURL, URLParseError.
 */

export type ListingSource = 'zillow' | 'redfin';

export interface PartialAddress {
  streetAddress: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
}

export interface ParsedListingURL {
  source: ListingSource;
  listingID: string;
  address: PartialAddress | null;
  originalURL: string;
}

export type URLParseError =
  | { kind: 'unsupportedDomain' }
  | { kind: 'missingListingID' };

export type ParseURLResult = { ok: true; value: ParsedListingURL } | { ok: false; error: URLParseError };
