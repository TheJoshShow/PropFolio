/**
 * Simulation inputs and result. Matches PropFolio SimulationInputs, SimulationResult.
 */

import type { UnderwritingOutputs } from '~/lib/underwriting/types';
import type { RenovationPlan, RenovationEstimateTier, RenovationCosts } from '~/lib/renovation/types';

export type SimulationRenovationInput =
  | { type: 'plan'; plan: RenovationPlan; tier: RenovationEstimateTier }
  | { type: 'costs'; costs: RenovationCosts };

/** User-facing simulation inputs. Amounts in USD; rates as decimals (e.g. 0.065 = 6.5%). */
export interface SimulationInputs {
  purchasePrice?: number | null;
  downPaymentPercent?: number | null;
  downPaymentAmount?: number | null;
  interestRateAnnual?: number | null;
  amortizationTermYears?: number | null;
  closingCosts?: number | null;
  monthlyRentPerUnit?: number | null;
  unitCount?: number | null;
  vacancyRatePercent?: number | null;
  otherIncomeAnnual?: number | null;
  squareFeet?: number | null;
  taxesAnnual?: number | null;
  insuranceAnnual?: number | null;
  propertyManagementAnnual?: number | null;
  repairsAndMaintenanceAnnual?: number | null;
  utilitiesAnnual?: number | null;
  capitalReservesAnnual?: number | null;
  renovationPlan?: RenovationPlan | null;
  renovationEstimateTier?: RenovationEstimateTier;
  renovationCosts?: RenovationCosts | null;
}

export interface SimulationResult {
  underwriting: UnderwritingOutputs;
  totalCashToClose: number | null;
  equityInvested: number | null;
  renovationTotal: number | null;
}
