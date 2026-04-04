import type {
  FinancingAssumptions,
  NormalizedPropertyInputs,
  OperatingAssumptions,
  ScenarioPatch,
} from '../domain/types';

/**
 * Pure: returns new objects; does not mutate inputs. Fast O(1) field copies.
 */
export function applyScenario(
  normalized: NormalizedPropertyInputs,
  financing: FinancingAssumptions,
  operating: OperatingAssumptions,
  scenario: ScenarioPatch | null | undefined,
): {
  normalized: NormalizedPropertyInputs;
  financing: FinancingAssumptions;
  operating: OperatingAssumptions;
  scenarioId: string | null;
} {
  if (!scenario) {
    return {
      normalized: { ...normalized },
      financing: { ...financing },
      operating: { ...operating },
      scenarioId: null,
    };
  }

  const n: NormalizedPropertyInputs = { ...normalized };
  if (scenario.purchasePrice !== undefined) {
    n.purchasePrice = scenario.purchasePrice;
  }
  if (scenario.monthlyRentGross !== undefined) {
    n.monthlyRentGross = scenario.monthlyRentGross;
  }
  if (scenario.annualPropertyTax !== undefined) {
    n.annualPropertyTax = scenario.annualPropertyTax;
  }
  if (scenario.annualInsurance !== undefined) {
    n.annualInsurance = scenario.annualInsurance;
  }
  if (scenario.rehabBudget !== undefined) {
    n.rehabBudget = scenario.rehabBudget;
  }
  if (scenario.annualOtherOperating !== undefined) {
    n.annualOtherOperating = scenario.annualOtherOperating;
  }
  if (scenario.annualHoa !== undefined) {
    n.annualHoa = scenario.annualHoa;
  }

  const o: OperatingAssumptions = { ...operating };
  if (scenario.vacancyRate !== undefined) {
    o.vacancyRate = scenario.vacancyRate;
  }
  if (scenario.maintenancePctOfEgi !== undefined) {
    o.maintenancePctOfEgi = scenario.maintenancePctOfEgi;
  }
  if (scenario.managementPctOfEgi !== undefined) {
    o.managementPctOfEgi = scenario.managementPctOfEgi;
  }
  if (scenario.capexReserveMonthly !== undefined) {
    o.capexReserveMonthly = scenario.capexReserveMonthly;
  }

  const f: FinancingAssumptions = { ...financing, ...scenario.financing };

  return {
    normalized: n,
    financing: f,
    operating: o,
    scenarioId: scenario.id,
  };
}
