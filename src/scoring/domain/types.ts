/**
 * PropFolio scoring domain — pure data shapes (no React).
 * Multi-unit: use `unitCount` + aggregate `monthlyRentGross`; add `perUnit` later without breaking API.
 */

import type { RenovationItemsV1 } from '@/types/renovationLedger';

/** Opaque provider blob (RentCast row, etc.) — kept for audit, not used directly in formulas. */
export type RawProviderEnvelope = {
  source: 'rentcast' | 'zillow' | 'redfin' | 'manual' | 'unknown';
  fetchedAtIso?: string;
  /** Unstructured; do not read in calculators — only for persistence / debugging. */
  payload?: Record<string, unknown>;
};

/**
 * Normalized inputs after snapshot + user merge (annual $ where *_Annual suffix).
 * Null = unknown; calculators must branch explicitly.
 */
export type NormalizedPropertyInputs = {
  version: 1;
  /** Count of rentable units (future: per-unit rent vector). */
  unitCount: number;
  /** Total monthly market / in-place rent across units. */
  monthlyRentGross: number | null;
  purchasePrice: number | null;
  /** After repair value — user or heuristic; null if unknowable. */
  arv: number | null;
  sqft: number | null;
  yearBuilt: number | null;
  propertyType: string | null;

  annualPropertyTax: number | null;
  annualInsurance: number | null;
  annualHoa: number | null;
  /** Misc operating (utilities owner-paid, landscaping, etc.). */
  annualOtherOperating: number | null;

  /** One-time rehab; affects cash invested and optional ARV heuristic only. */
  rehabBudget: number | null;
};

export type FinancingAssumptions = {
  loanToValue: number;
  interestRateAnnual: number;
  amortizationYears: number;
  interestOnly: boolean;
  closingCostPctOfLoan: number;
};

export type OperatingAssumptions = {
  vacancyRate: number;
  maintenancePctOfEgi: number;
  managementPctOfEgi: number;
  capexReserveMonthly: number;
};

/** User overrides — partial; merged onto defaults + normalized. */
export type UserAssumptionOverrides = {
  financing?: Partial<FinancingAssumptions>;
  operating?: Partial<OperatingAssumptions>;
  /** Line-item renovation overrides; merged over snapshot.renovation.items for analysis UI. */
  renovation?: { items?: RenovationItemsV1 };
  /** Direct field overrides on normalized inputs */
  inputs?: Partial<
    Pick<
      NormalizedPropertyInputs,
      | 'monthlyRentGross'
      | 'purchasePrice'
      | 'arv'
      | 'annualPropertyTax'
      | 'annualInsurance'
      | 'annualHoa'
      | 'annualOtherOperating'
      | 'rehabBudget'
      | 'sqft'
      | 'unitCount'
    >
  >;
};

/**
 * Scenario = declarative patch applied on top of merged assumptions for what-if recalculation.
 * All fields optional; only provided keys override the active working copy.
 */
export type ScenarioPatch = {
  id: string;
  label: string;
  purchasePrice?: number;
  monthlyRentGross?: number;
  annualPropertyTax?: number;
  annualInsurance?: number;
  rehabBudget?: number;
  vacancyRate?: number;
  maintenancePctOfEgi?: number;
  managementPctOfEgi?: number;
  capexReserveMonthly?: number;
  annualOtherOperating?: number;
  annualHoa?: number;
  financing?: Partial<FinancingAssumptions>;
};

export type MetricAvailability = 'ok' | 'insufficient_data';

/** Single calculated metric with explicit guard metadata for UI + tests. */
export type CalculatedMetric = {
  key: PrimaryMetricKey;
  label: string;
  value: number | null;
  /** Normalized 0–1 when applicable (e.g. cap rate as decimal); null if N/A */
  normalized: number | null;
  availability: MetricAvailability;
  /** Human-readable formula id for support / docs */
  formulaId: string;
  missingDrivers: string[];
  unit: 'ratio' | 'currency_annual' | 'currency_monthly' | 'multiple' | 'percent';
};

export type PrimaryMetricKey =
  | 'noi_annual'
  | 'cap_rate'
  | 'cash_flow_annual'
  | 'cash_on_cash'
  | 'dscr'
  | 'arv'
  | 'egi_annual'
  | 'operating_expense_annual'
  | 'debt_service_annual'
  | 'gross_rent_multiplier_hint';

export type ScoreFactorKind =
  | 'upside_potential'
  | 'downside_resilience'
  | 'rent_efficiency'
  | 'renovation_sensitivity'
  | 'missing_data_penalty';

export type ScoreFactor = {
  id: string;
  kind: ScoreFactorKind;
  label: string;
  /** 0–100 sub-score for visualization */
  score: number;
  /** Relative emphasis in composite (not required to sum to 1). */
  weight: number;
  narrative: string;
};

export type ConfidencePenalty = {
  code: string;
  label: string;
  deduction: number;
};

export type ConfidenceResult = {
  score: number;
  max: number;
  base: number;
  penalties: ConfidencePenalty[];
};

/** Full UI-facing breakdown — versioned for migrations. */
export type ScoreBreakdown = {
  schemaVersion: 2;
  engineVersion: string;
  computedAtIso: string;
  scenarioId: string | null;
  confidence: ConfidenceResult;
  primaryMetrics: CalculatedMetric[];
  factors: ScoreFactor[];
  /** Effective inputs after scenario (for audit / “as shown”) */
  effectiveInputs: NormalizedPropertyInputs;
  effectiveFinancing: FinancingAssumptions;
  effectiveOperating: OperatingAssumptions;
};

export type ScoringEngineInput = {
  raw?: RawProviderEnvelope;
  normalized: NormalizedPropertyInputs;
  /** Omit to use `defaultFinancing()` from defaults module. */
  financing?: FinancingAssumptions;
  /** Omit to use `defaultOperating()` from defaults module. */
  operating?: OperatingAssumptions;
  userOverrides?: UserAssumptionOverrides;
  activeScenario?: ScenarioPatch | null;
};
