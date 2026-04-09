/**
 * Mutable snapshot updated only from `revenueCatService` (avoids circular imports with billing diagnostics).
 */

let purchasesSdkConfigured = false;
let lastPurchasesConfigureError: string | null = null;

export function setRevenueCatConfigureSnapshot(configured: boolean, error: string | null): void {
  purchasesSdkConfigured = configured;
  lastPurchasesConfigureError = error;
}

export function getRevenueCatConfigureSnapshot(): {
  purchasesSdkConfigured: boolean;
  lastPurchasesConfigureError: string | null;
} {
  return { purchasesSdkConfigured, lastPurchasesConfigureError };
}
