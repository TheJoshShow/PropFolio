/**
 * Central market & underwriting defaults for PropFolio scoring.
 * Change formulas in `calculate/*`; tune policy knobs here only (single source of truth).
 */
export const SCORING_DEFAULTS = {
  /** Vacancy as fraction of gross potential rent (e.g. 0.06 = 6%). */
  VACANCY_RATE: 0.06,
  /** Operating maintenance + repairs as % of EGI — replace with line-item model later if needed. */
  MAINTENANCE_PCT_OF_EGI: 0.08,
  PROPERTY_MANAGEMENT_PCT_OF_EGI: 0.1,
  /** Monthly reserve for capital items (per property), before debt service. */
  CAPEX_RESERVE_MONTHLY: 150,

  /** Financing — conventional buy & hold baseline. */
  LOAN_TO_VALUE: 0.75,
  INTEREST_RATE_ANNUAL: 0.065,
  AMORTIZATION_YEARS: 30,
  INTEREST_ONLY: false,

  /** Closing costs as % of loan amount (cash outlay at close; optional). */
  CLOSING_COST_PCT_OF_LOAN: 0.015,

  /** Rehab budget when unknown (avoids divide-by-zero; user should override). */
  DEFAULT_REHAB_BUDGET: 0,

  /**
   * ARV uplift heuristic when ARV not supplied: ARV ≈ purchase * (1 + upliftMax * rehabIntensity).
   * rehabIntensity = min(1, rehabBudget / max(purchase * rehabToPriceRatioCap, 1)).
   * **Replace** with comps-based ARV when you have valuation service.
   */
  ARV_HEURISTIC_UPLIFT_MAX: 0.12,
  ARV_HEURISTIC_REHAB_TO_PRICE_RATIO_CAP: 0.25,

  /** Benchmark $/sqft/mo for "rent efficiency" sub-score (market-specific later). */
  RENT_EFFICIENCY_BENCHMARK_PER_SQFT_MONTHLY: 1.25,

  /** Confidence model */
  CONFIDENCE_MAX: 10,
  CONFIDENCE_BASE: 7.5,
  PENALTY_MISSING_PURCHASE_PRICE: 1.2,
  PENALTY_MISSING_RENT: 1.4,
  PENALTY_MISSING_PROPERTY_TAX: 0.35,
  PENALTY_MISSING_INSURANCE: 0.35,
  PENALTY_MISSING_SQFT: 0.25,
  PENALTY_MISSING_ARV_WHEN_REHAB_POSITIVE: 0.4,

  /** Factor weights (display / composite hints; sum need not be 1). */
  FACTOR_WEIGHT_UPSIDE: 1,
  FACTOR_WEIGHT_DOWNSIDE: 1,
  FACTOR_WEIGHT_RENT_EFFICIENCY: 1,
  FACTOR_WEIGHT_RENOVATION_SENSITIVITY: 1,
} as const;

export type ScoringDefaultKey = keyof typeof SCORING_DEFAULTS;
