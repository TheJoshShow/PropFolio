import { generateUuid } from '@/lib/uuid';
import type {
  GeneratePropertySummaryResponse,
  NormalizeAddressResponse,
  RentEstimateResponse,
} from '@/types/edge-contracts';

import { invokeEdgeFunction } from '../import/edgeInvoke';

/**
 * Authenticated Edge calls with stable response types (secrets stay on the server).
 */
export const serverEdgeService = {
  async normalizeAddress(
    addressLine: string,
    correlationId?: string,
  ): Promise<NormalizeAddressResponse> {
    const cid = correlationId ?? generateUuid();
    return invokeEdgeFunction<NormalizeAddressResponse>('normalize-address', {
      addressLine,
      correlationId: cid,
    });
  },

  async rentEstimate(
    addressLine: string,
    correlationId?: string,
  ): Promise<RentEstimateResponse> {
    const cid = correlationId ?? generateUuid();
    return invokeEdgeFunction<RentEstimateResponse>('rent-estimate', {
      addressLine,
      correlationId: cid,
    });
  },

  async generatePropertySummary(
    propertyId: string,
    correlationId?: string,
  ): Promise<GeneratePropertySummaryResponse> {
    const cid = correlationId ?? generateUuid();
    return invokeEdgeFunction<GeneratePropertySummaryResponse>('generate-property-summary', {
      propertyId,
      correlationId: cid,
    });
  },
};
