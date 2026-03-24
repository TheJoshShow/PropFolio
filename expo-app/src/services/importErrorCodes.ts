/**
 * Normalized import failure codes for analytics, tests, and consistent UI copy.
 * User-facing strings come from IMPORT_USER_MESSAGES via userMessageForImportCode.
 */

import { IMPORT_USER_MESSAGES } from './importErrorMessages';

export type ImportErrorCode =
  | 'INVALID_LINK'
  | 'UNSUPPORTED_LINK'
  | 'MISSING_ADDRESS_FROM_LINK'
  | 'ADDRESS_NOT_FOUND'
  | 'ADDRESS_NOT_VERIFIED'
  | 'GEOCODE_FAILED'
  | 'AUTOCOMPLETE_UNAVAILABLE'
  | 'AUTH_REQUIRED'
  | 'AUTH_HYDRATING'
  | 'IMPORT_LIMIT'
  | 'SUPABASE_NOT_CONFIGURED'
  | 'PROFILE_SETUP_INCOMPLETE'
  | 'PORTFOLIO_CREATE_FAILED'
  | 'PROPERTY_SAVE_FAILED'
  | 'NETWORK_OFFLINE'
  | 'CONFIG_MISSING'
  | 'UNKNOWN';

/**
 * Title + body for enrichment-layer failures (manual verification / geocode).
 * Keeps alerts consistent with the rest of the Import screen.
 */
export function importEnrichmentAlert(code: ImportErrorCode): { title: string; message: string } {
  const message = userMessageForImportCode(code);
  switch (code) {
    case 'ADDRESS_NOT_VERIFIED':
      return { title: 'Check the address', message: IMPORT_USER_MESSAGES.invalidAddress };
    case 'ADDRESS_NOT_FOUND':
      return { title: 'Address not found', message: IMPORT_USER_MESSAGES.unresolvableAddress };
    case 'GEOCODE_FAILED':
      return { title: 'Address lookup failed', message };
    default:
      return { title: 'Cannot import', message };
  }
}

export function userMessageForImportCode(code: ImportErrorCode): string {
  switch (code) {
    case 'INVALID_LINK':
      return IMPORT_USER_MESSAGES.invalidListingLinkFormat;
    case 'UNSUPPORTED_LINK':
      return IMPORT_USER_MESSAGES.unsupportedListingUrl;
    case 'MISSING_ADDRESS_FROM_LINK':
      return IMPORT_USER_MESSAGES.unableToExtractListingAddress;
    case 'ADDRESS_NOT_FOUND':
      return IMPORT_USER_MESSAGES.unresolvableAddress;
    case 'ADDRESS_NOT_VERIFIED':
      return IMPORT_USER_MESSAGES.invalidAddress;
    case 'GEOCODE_FAILED':
      return IMPORT_USER_MESSAGES.addressLookupUnavailable;
    case 'AUTOCOMPLETE_UNAVAILABLE':
      return IMPORT_USER_MESSAGES.addressLookupUnavailable;
    case 'AUTH_REQUIRED':
      return IMPORT_USER_MESSAGES.notSignedIn;
    case 'AUTH_HYDRATING':
      return IMPORT_USER_MESSAGES.authenticationInProgress;
    case 'IMPORT_LIMIT':
      return "You've used your free imports. Upgrade to Pro to add more.";
    case 'SUPABASE_NOT_CONFIGURED':
      return IMPORT_USER_MESSAGES.supabaseNotConfigured;
    case 'PROFILE_SETUP_INCOMPLETE':
      return IMPORT_USER_MESSAGES.importAccountOrPortfolio;
    case 'PORTFOLIO_CREATE_FAILED':
      return IMPORT_USER_MESSAGES.portfolioCreateFailed;
    case 'PROPERTY_SAVE_FAILED':
      return IMPORT_USER_MESSAGES.importBackendUnavailable;
    case 'NETWORK_OFFLINE':
      return IMPORT_USER_MESSAGES.networkUnavailable;
    case 'CONFIG_MISSING':
      return IMPORT_USER_MESSAGES.addressLookupUnavailable;
    case 'UNKNOWN':
    default:
      return IMPORT_USER_MESSAGES.importTemporaryFailure;
  }
}
