/**
 * Market & comps adapters — placeholders until RentCast / internal comps API is wired.
 * UI imports types from here so real clients can swap in without screen churn.
 */

export type ComparablePlaceholder = {
  id: string;
  headline: string;
  sub: string;
  status: 'placeholder';
};

export const COMPARABLES_PLACEHOLDER: ComparablePlaceholder[] = [
  {
    id: 'comps-1',
    headline: 'Comparable sales',
    sub: 'Connect a comps provider to show radius-based sales and $/sq ft context.',
    status: 'placeholder',
  },
];

export type MarketTrendPlaceholder = {
  id: string;
  headline: string;
  sub: string;
  status: 'placeholder';
};

export const MARKET_TREND_PLACEHOLDER: MarketTrendPlaceholder[] = [
  {
    id: 'trend-1',
    headline: 'Appreciation & rent growth',
    sub: 'ZIP- or tract-level trends will appear here when a market analytics feed is enabled.',
    status: 'placeholder',
  },
];

/** Single analysis-tab block — avoids stacked duplicate cards before real comps/trends APIs exist. */
export const MARKET_ANALYSIS_EXTENSION_PLACEHOLDER = {
  title: 'Comps & market trends',
  bullets: [
    COMPARABLES_PLACEHOLDER[0].sub,
    MARKET_TREND_PLACEHOLDER[0].sub,
  ] as const,
} as const;
