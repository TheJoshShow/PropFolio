import { serverEdgeService } from '../edge/serverEdgeService';

import type { AiSummaryRequest, AiSummaryResponse } from './types';

/**
 * Narrative-only copy via `generate-property-summary` Edge Function (no client-side metric math).
 */
export const aiSummaryService = {
  async fetchSummary(request: AiSummaryRequest): Promise<AiSummaryResponse> {
    const res = await serverEdgeService.generatePropertySummary(request.propertyId);
    if (!res.ok) {
      throw new Error(res.error.message);
    }
    const body = res.summary?.trim() ?? '';
    const markdown =
      body ||
      (res.mode === 'placeholder'
        ? '_AI summaries are not configured in this environment._'
        : '_No summary text was returned._');
    return {
      markdown,
      mode: res.mode,
    };
  },
};
