/**
 * Refreshes subscription/credit state after an import attempt whose server response may
 * have changed the wallet (success with credit consumed, insufficient credits, etc.).
 * `useImportSubmission` applies `balance_after` from the import response first (when present),
 * then calls this so React state reconciles with Supabase/RevenueCat.
 * Call from the shared import lifecycle only — not for autocomplete or NEEDS_ADDRESS.
 */
export async function refreshWalletAfterPropertyImport(refresh: () => Promise<unknown>): Promise<void> {
  await refresh();
}
