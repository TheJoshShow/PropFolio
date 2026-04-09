import type {
  PropertyImportNeedsAddress,
  PropertyImportResult,
  PropertyImportSuccess,
} from '@/services/property-import';

export function isNeedsAddress(
  r: PropertyImportResult,
): r is Extract<PropertyImportResult, { code: 'NEEDS_ADDRESS' }> {
  return (
    r != null &&
    typeof r === 'object' &&
    'ok' in r &&
    (r as { ok: boolean }).ok === false &&
    (r as { code?: string }).code === 'NEEDS_ADDRESS'
  );
}

export function isImportSuccess(r: PropertyImportResult): r is PropertyImportSuccess {
  return r != null && typeof r === 'object' && 'ok' in r && (r as { ok: boolean }).ok === true;
}

export function isInsufficientCredits(
  r: PropertyImportResult,
): r is Extract<PropertyImportResult, { code: 'INSUFFICIENT_CREDITS' }> {
  return (
    r != null &&
    typeof r === 'object' &&
    'ok' in r &&
    (r as { ok: boolean }).ok === false &&
    (r as { code?: string }).code === 'INSUFFICIENT_CREDITS'
  );
}

export function isSubscriptionRequired(
  r: PropertyImportResult,
): r is Extract<PropertyImportResult, { code: 'SUBSCRIPTION_REQUIRED' }> {
  return (
    r != null &&
    typeof r === 'object' &&
    'ok' in r &&
    (r as { ok: boolean }).ok === false &&
    (r as { code?: string }).code === 'SUBSCRIPTION_REQUIRED'
  );
}

export function isCreditConsumeFailed(
  r: PropertyImportResult,
): r is Extract<PropertyImportResult, { code: 'CREDIT_CONSUME_FAILED' }> {
  return (
    r != null &&
    typeof r === 'object' &&
    'ok' in r &&
    (r as { ok: boolean }).ok === false &&
    (r as { code?: string }).code === 'CREDIT_CONSUME_FAILED'
  );
}

/**
 * Terminal outcomes from `import-property` after a completed HTTP response.
 * Wallet-changing failures use `refreshWallet`; NEEDS_ADDRESS does not consume credits.
 */
export type PropertyImportFlowOutcome =
  | { kind: 'needs_address'; result: PropertyImportNeedsAddress }
  | { kind: 'import_saved'; result: PropertyImportSuccess }
  | { kind: 'failure_refresh_wallet'; message: string }
  | { kind: 'failure_silent_wallet'; message: string };

const DEFAULT_INSUFFICIENT =
  'Not enough credits. Buy a pack from Settings or wait for your monthly included credit.';
const DEFAULT_SUBSCRIPTION =
  'You need an active PropFolio membership to import. Open Membership from Settings.';
const DEFAULT_CREDIT_FAIL = 'Could not confirm your credit with the server. Try again.';
const DEFAULT_INCOMPLETE = 'Import could not be completed.';

function safeImportFailureMessage(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes('row-level security') || m.includes('rls') || m.includes('internal')) {
    return 'We couldn’t finish this import. Please try again in a moment.';
  }
  if (raw.trim().length > 0 && raw.length < 220) {
    return raw.trim();
  }
  return DEFAULT_INCOMPLETE;
}

export function interpretPropertyImportResult(result: PropertyImportResult): PropertyImportFlowOutcome {
  if (isNeedsAddress(result)) {
    return { kind: 'needs_address', result };
  }
  if (isInsufficientCredits(result)) {
    return {
      kind: 'failure_refresh_wallet',
      message: result.message ?? DEFAULT_INSUFFICIENT,
    };
  }
  if (isSubscriptionRequired(result)) {
    return {
      kind: 'failure_refresh_wallet',
      message: result.message ?? DEFAULT_SUBSCRIPTION,
    };
  }
  if (isCreditConsumeFailed(result)) {
    return {
      kind: 'failure_refresh_wallet',
      message: result.message ?? DEFAULT_CREDIT_FAIL,
    };
  }
  if (isImportSuccess(result)) {
    return { kind: 'import_saved', result };
  }
  if (result && typeof result === 'object' && 'error' in result) {
    const err = (result as { error?: string }).error;
    if (typeof err === 'string' && err.length) {
      return { kind: 'failure_silent_wallet', message: safeImportFailureMessage(err) };
    }
  }
  const msg = result && typeof result === 'object' && 'message' in result ? (result as { message?: string }).message : undefined;
  if (typeof msg === 'string' && msg.length) {
    return { kind: 'failure_silent_wallet', message: safeImportFailureMessage(msg) };
  }
  return { kind: 'failure_silent_wallet', message: DEFAULT_INCOMPLETE };
}
