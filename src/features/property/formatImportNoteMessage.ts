/**
 * Maps server-persisted `last_import_error` tokens to user-facing copy.
 */
export function formatImportNoteMessage(raw: string | null | undefined): string | null {
  if (raw == null) {
    return null;
  }
  const t = raw.trim();
  if (!t) {
    return null;
  }
  if (t === 'rentcast_not_configured') {
    return 'Listing enrichment is not available yet (RentCast is not configured on the server). Ask your project admin to add the RENTCAST_API_KEY secret for the import-property function and redeploy.';
  }
  return t;
}
