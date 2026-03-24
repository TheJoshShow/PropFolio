/**
 * Single entry for errors caught by UI layers (boundaries, route error screens).
 */

import { recordNonFatal } from './crashlytics';
import { isDuplicateReport } from './reportDedupe';

export function reportCapturedError(error: unknown, context: string): void {
  try {
    if (isDuplicateReport(error)) {
      return;
    }
    recordNonFatal(error, context);
  } catch {
    /* never throw */
  }
}
