export type AiSummaryKind = 'property_overview' | 'risk_flags' | 'market_context';

export type AiSummaryRequest = {
  kind: AiSummaryKind;
  /** Opaque handle to server-resolved property context — no client-side metric computation */
  propertyId: string;
  locale?: string;
};

export type AiSummaryResponse = {
  markdown: string;
  /** Populated when Edge returns structured metadata (optional). */
  modelVersion?: string;
  mode?: 'ai' | 'placeholder';
};
