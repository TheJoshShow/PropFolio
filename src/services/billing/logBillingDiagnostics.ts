import { PROP_FOLIO_BILLING_DIAGNOSTICS_LOG_TAG } from '@/services/revenuecat/billingLogTags';

import { getBillingDiagnosticsState } from './billingDiagnosticsStore';
import { buildPrimaryBillingDiagnosisString } from './buildBillingDiagnosis';

/**
 * Structured console output in development only. Never logs raw API keys.
 */
export function logBillingDiagnosticsStructured(reason: string): void {
  if (!__DEV__) {
    return;
  }
  const state = getBillingDiagnosticsState();
  const diagnosis = buildPrimaryBillingDiagnosisString(state);
  const payload = {
    reason,
    diagnosis,
    billingDiagnostics: state,
  };
  console.log(PROP_FOLIO_BILLING_DIAGNOSTICS_LOG_TAG, JSON.stringify(payload, null, 2));
}
