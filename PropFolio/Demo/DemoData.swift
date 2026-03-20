//
//  DemoData.swift
//  PropFolio
//
//  Rich demo data for full app testing: multifamily (strong), value-add (renovation), thin-margin (risky).
//  Load in development via Settings → "Use demo data" or Import → "Load demo property".
//

import Foundation

/// Identifiers for the three demo properties.
enum DemoPropertyId: String, CaseIterable {
    case multifamilyStrong = "demo_multifamily_strong"
    case valueAddRenovation = "demo_valueadd_renovation"
    case thinMarginRisky = "demo_thinmargin_risky"
}

enum DemoData {

    private static let meta = ImportMetadata(source: .derived, fetchedAt: Date(), confidence: .high)
    private static func tracked<T: Codable & Sendable>(_ value: T) -> TrackedValue<T> {
        TrackedValue(value: value, metadata: meta)
    }

    /// Placeholder photo URLs (picsum) so gallery and cards render. Use same seed per property for consistency.
    private static func photoURLs(seed: String, count: Int = 5) -> [TrackedValue<URL>] {
        (1...count).compactMap { i in
            guard let url = URL(string: "https://picsum.photos/seed/\(seed)/800/600") else { return nil }
            return TrackedValue(value: url, metadata: meta)
        }
    }

    // MARK: - 1. Small multifamily, strong cash flow (high score, high confidence, positive future value)

    static func normalizedPropertyMultifamilyStrong(id: UUID) -> NormalizedProperty {
        let now = Date()
        return NormalizedProperty(
            id: id,
            streetAddress: tracked("2847 Maple Ridge Dr"),
            unit: nil,
            city: tracked("Austin"),
            state: tracked("TX"),
            postalCode: tracked("78754"),
            countryCode: tracked("US"),
            propertyType: tracked(PropertyType.multiFamily),
            bedrooms: tracked(8),
            bathrooms: tracked(8),
            squareFeet: tracked(4_800),
            lotSizeSqFt: tracked(8_500),
            yearBuilt: tracked(1985),
            listPrice: tracked(520_000),
            estimatedValue: tracked(535_000),
            lastSoldPrice: tracked(480_000),
            lastSoldDate: tracked(Calendar.current.date(byAdding: .month, value: -18, to: now)!),
            estimatedRent: tracked(4_800),
            photoURLs: photoURLs(seed: "maple-ridge-2847", count: 6),
            createdAt: now,
            updatedAt: now
        )
    }

    /// Simulation inputs for the strong 4-plex: 4 units × $1,200/mo, 25% down, 6.5%, full expense breakdown.
    static var simulationInputsMultifamilyStrong: SimulationInputs {
        SimulationInputs(
            purchasePrice: 520_000,
            downPaymentPercent: 25,
            interestRateAnnual: 0.065,
            amortizationTermYears: 30,
            closingCosts: 8_500,
            monthlyRentPerUnit: 1_200,
            unitCount: 4,
            vacancyRatePercent: 5,
            otherIncomeAnnual: 1_200,
            squareFeet: 4_800,
            taxesAnnual: 8_200,
            insuranceAnnual: 2_400,
            propertyManagementAnnual: 4_680,
            repairsAndMaintenanceAnnual: 2_400,
            utilitiesAnnual: 0,
            capitalReservesAnnual: 2_600,
            renovationPlan: nil,
            renovationEstimateTier: .base,
            renovationCosts: nil
        )
    }

    /// Full analysis state for strong multifamily: score 85, high confidence, supportive future value.
    static func analysisStateMultifamilyStrong(address: String) -> AnalysisDashboardState {
        let underwriting = UnderwritingOutputs(
            grossScheduledRentAnnual: 57_600,
            vacancyAdjustedGrossIncome: 54_720,
            otherIncomeAnnual: 1_200,
            effectiveGrossIncome: 55_920,
            operatingExpensesAnnual: 21_880,
            noi: 34_040,
            annualDebtService: 24_900,
            monthlyCashFlow: 762,
            annualCashFlow: 9_140,
            dscr: 1.37,
            capRate: 0.0655,
            cashOnCashReturn: 0.071,
            grm: 9.03,
            expenseRatio: 0.39,
            breakEvenRatio: 0.73,
            debtYield: 0.065,
            ltv: 0.75,
            pricePerUnit: 130_000,
            pricePerSquareFoot: 108.33,
            breakevenOccupancy: 0.73,
            equityPaydown5Year: 28_000,
            irrPlaceholder: nil
        )
        let dealResult = DealScoreResult(
            totalScore: Decimal(85),
            band: .strong,
            components: [],
            wasCappedByConfidence: false,
            explanationSummary: "Strong deal (85/100). Solid cap rate, DSCR, and cash-on-cash with complete data."
        )
        let confResult = ConfidenceMeterResult(
            score: Decimal(82),
            band: .high,
            explanation: ConfidenceMeterExplanation(
                supportingFactors: [
                    "Property data is complete (units, rent, expenses).",
                    "Rent and value from verified listing source.",
                    "Financing and expense assumptions are explicit."
                ],
                limitingFactors: [],
                summary: "Analysis is well grounded in data you can rely on."
            ),
            recommendedActions: []
        )
        let futureValue = FutureValueSummary(
            score: 72,
            bandLabel: "Moderate tailwinds",
            oneLiner: "Rent growth and demand in this submarket support stable to rising value over a 5-year hold."
        )
        return AnalysisDashboardState(
            propertyAddress: address,
            dealScoreResult: dealResult,
            confidenceMeterResult: confResult,
            underwritingOutputs: underwriting,
            futureValueSummary: futureValue,
            risks: [
                AnalysisCallout(title: "Interest rate sensitivity", body: "Refinance or sale in a higher-rate environment could compress multiples.", isRisk: true)
            ],
            opportunities: [
                AnalysisCallout(title: "Strong cash flow", body: "~$760/mo cash flow and 7.1% CoC with 25% down; good margin for reserves.", isRisk: false),
                AnalysisCallout(title: "Value-add potential", body: "1985 build; light cosmetic upgrades could support rent increases.", isRisk: false)
            ]
        )
    }

    // MARK: - 2. Value-add property with renovation needs (mid score, medium confidence, post-renovation value)

    static func normalizedPropertyValueAdd(id: UUID) -> NormalizedProperty {
        let now = Date()
        return NormalizedProperty(
            id: id,
            streetAddress: tracked("910 Oak Hollow Ln"),
            unit: nil,
            city: tracked("Round Rock"),
            state: tracked("TX"),
            postalCode: tracked("78664"),
            countryCode: tracked("US"),
            propertyType: tracked(PropertyType.multiFamily),
            bedrooms: tracked(6),
            bathrooms: tracked(6),
            squareFeet: tracked(3_200),
            lotSizeSqFt: tracked(7_200),
            yearBuilt: tracked(1978),
            listPrice: tracked(385_000),
            estimatedValue: tracked(370_000),
            lastSoldPrice: nil,
            lastSoldDate: nil,
            estimatedRent: tracked(3_000),
            photoURLs: photoURLs(seed: "oak-hollow-910", count: 5),
            createdAt: now,
            updatedAt: now
        )
    }

    /// Renovation plan: kitchens, bathrooms, flooring, paint, HVAC, contingency. Region 1.05 (TX).
    static var renovationPlanValueAdd: RenovationPlan {
        var plan = RenovationPlan(lineItems: [], regionMultiplier: 1.05, contingencyPercent: 12)
        plan.setLineItem(RenovationLineItem(category: .kitchens, low: 8_000, base: 18_000, high: 32_000))
        plan.setLineItem(RenovationLineItem(category: .bathrooms, low: 5_000, base: 14_000, high: 24_000))
        plan.setLineItem(RenovationLineItem(category: .flooring, low: 4_000, base: 8_000, high: 16_000))
        plan.setLineItem(RenovationLineItem(category: .paint, low: 2_000, base: 4_500, high: 7_000))
        plan.setLineItem(RenovationLineItem(category: .hvac, low: 6_000, base: 10_000, high: 16_000))
        plan.setLineItem(RenovationLineItem(category: .permitsContingency, low: 1_000, base: 3_500, high: 6_000))
        return plan
    }

    static var simulationInputsValueAdd: SimulationInputs {
        SimulationInputs(
            purchasePrice: 385_000,
            downPaymentPercent: 25,
            interestRateAnnual: 0.07,
            amortizationTermYears: 30,
            closingCosts: 6_200,
            monthlyRentPerUnit: 500,
            unitCount: 6,
            vacancyRatePercent: 8,
            otherIncomeAnnual: 600,
            squareFeet: 3_200,
            taxesAnnual: 6_800,
            insuranceAnnual: 1_900,
            propertyManagementAnnual: 2_160,
            repairsAndMaintenanceAnnual: 1_800,
            utilitiesAnnual: 0,
            capitalReservesAnnual: 1_500,
            renovationPlan: renovationPlanValueAdd,
            renovationEstimateTier: .base,
            renovationCosts: nil
        )
    }

    static func analysisStateValueAdd(address: String) -> AnalysisDashboardState {
        let underwriting = UnderwritingOutputs(
            grossScheduledRentAnnual: 36_000,
            vacancyAdjustedGrossIncome: 33_120,
            otherIncomeAnnual: 600,
            effectiveGrossIncome: 33_720,
            operatingExpensesAnnual: 14_160,
            noi: 19_560,
            annualDebtService: 22_900,
            monthlyCashFlow: -278,
            annualCashFlow: -3_340,
            dscr: 0.85,
            capRate: 0.0508,
            cashOnCashReturn: -0.008,
            grm: 10.69,
            expenseRatio: 0.42,
            breakEvenRatio: 0.92,
            debtYield: 0.051,
            ltv: 0.75,
            pricePerUnit: 64_167,
            pricePerSquareFoot: 120.31,
            breakevenOccupancy: 0.92,
            equityPaydown5Year: 18_000,
            irrPlaceholder: nil
        )
        let dealResult = DealScoreResult(
            totalScore: Decimal(58),
            band: .fair,
            components: [],
            wasCappedByConfidence: false,
            explanationSummary: "Value-add deal (58/100). Negative cash flow today; score reflects upside from renovation and rent growth."
        )
        let confResult = ConfidenceMeterResult(
            score: Decimal(58),
            band: .medium,
            explanation: ConfidenceMeterExplanation(
                supportingFactors: ["Unit count and structure are known.", "Renovation scope and costs are itemized."],
                limitingFactors: [
                    "Current rent is below market; post-renovation rent is estimated.",
                    "Some expense assumptions are based on comparable properties."
                ],
                summary: "Reasonably grounded; a few gaps or overrides remain."
            ),
            recommendedActions: ["Lock in renovation quotes.", "Verify post-renovation rents with local comps."]
        )
        let futureValue = FutureValueSummary(
            score: 65,
            bandLabel: "Upside after rehab",
            oneLiner: "After renovation, comps suggest 15–20% value lift and rent growth; hold 3–5 years to capture."
        )
        return AnalysisDashboardState(
            propertyAddress: address,
            dealScoreResult: dealResult,
            confidenceMeterResult: confResult,
            underwritingOutputs: underwriting,
            futureValueSummary: futureValue,
            risks: [
                AnalysisCallout(title: "Negative cash flow during hold", body: "Stabilized NOI is negative until rent increases; ensure reserves for 12–18 months.", isRisk: true),
                AnalysisCallout(title: "Renovation execution", body: "Base case ~$58k renovation; delays or overruns will push out break-even.", isRisk: true)
            ],
            opportunities: [
                AnalysisCallout(title: "Purchase below estimated value", body: "Listed below estimated value; value-add margin if rehabs stay on budget.", isRisk: false),
                AnalysisCallout(title: "Rent growth after rehabs", body: "Post-renovation rents could support 6.5%+ cap and positive cash flow.", isRisk: false)
            ]
        )
    }

    // MARK: - 3. Thin-margin / risky deal (low score, low confidence, cautious future value)

    static func normalizedPropertyThinMargin(id: UUID) -> NormalizedProperty {
        let now = Date()
        return NormalizedProperty(
            id: id,
            streetAddress: tracked("1200 W Anderson Ln #204"),
            unit: tracked("204"),
            city: tracked("Austin"),
            state: tracked("TX"),
            postalCode: tracked("78757"),
            countryCode: tracked("US"),
            propertyType: tracked(PropertyType.condo),
            bedrooms: tracked(2),
            bathrooms: tracked(2),
            squareFeet: tracked(1_100),
            lotSizeSqFt: nil,
            yearBuilt: tracked(2002),
            listPrice: tracked(325_000),
            estimatedValue: tracked(318_000),
            lastSoldPrice: tracked(305_000),
            lastSoldDate: tracked(Calendar.current.date(byAdding: .month, value: -8, to: now)!),
            estimatedRent: tracked(1_650),
            photoURLs: photoURLs(seed: "anderson-1200", count: 4),
            createdAt: now,
            updatedAt: now
        )
    }

    static var simulationInputsThinMargin: SimulationInputs {
        SimulationInputs(
            purchasePrice: 325_000,
            downPaymentPercent: 15,
            interestRateAnnual: 0.0725,
            amortizationTermYears: 30,
            closingCosts: 5_500,
            monthlyRentPerUnit: 1_650,
            unitCount: 1,
            vacancyRatePercent: 7,
            otherIncomeAnnual: 0,
            squareFeet: 1_100,
            taxesAnnual: 6_200,
            insuranceAnnual: 1_400,
            propertyManagementAnnual: 1_188,
            repairsAndMaintenanceAnnual: 1_200,
            utilitiesAnnual: 0,
            capitalReservesAnnual: 1_000,
            renovationPlan: nil,
            renovationEstimateTier: .base,
            renovationCosts: nil
        )
    }

    static func analysisStateThinMargin(address: String) -> AnalysisDashboardState {
        let underwriting = UnderwritingOutputs(
            grossScheduledRentAnnual: 19_800,
            vacancyAdjustedGrossIncome: 18_414,
            otherIncomeAnnual: 0,
            effectiveGrossIncome: 18_414,
            operatingExpensesAnnual: 9_988,
            noi: 8_426,
            annualDebtService: 22_100,
            monthlyCashFlow: -1_139,
            annualCashFlow: -13_674,
            dscr: 0.38,
            capRate: 0.0259,
            cashOnCashReturn: -0.14,
            grm: 16.41,
            expenseRatio: 0.54,
            breakEvenRatio: 1.20,
            debtYield: 0.026,
            ltv: 0.85,
            pricePerUnit: 325_000,
            pricePerSquareFoot: 295.45,
            breakevenOccupancy: 1.20,
            equityPaydown5Year: 12_000,
            irrPlaceholder: nil
        )
        let dealResult = DealScoreResult(
            totalScore: Decimal(28),
            band: .poor,
            components: [],
            wasCappedByConfidence: false,
            explanationSummary: "Risky profile (28/100). DSCR well below 1.0, negative cash flow, thin margin for error."
        )
        let confResult = ConfidenceMeterResult(
            score: Decimal(38),
            band: .low,
            explanation: ConfidenceMeterExplanation(
                supportingFactors: ["Address and unit details are known.", "Rent estimate from listing."],
                limitingFactors: [
                    "HOA and special assessments not fully reflected.",
                    "Single unit; limited comparable data.",
                    "High leverage increases sensitivity to rate and vacancy."
                ],
                summary: "Low confidence; several assumptions or data gaps affect reliability."
            ),
            recommendedActions: ["Get full HOA financials and reserve study.", "Stress-test at 10% vacancy and 0.5% rate increase."]
        )
        let futureValue = FutureValueSummary(
            score: 35,
            bandLabel: "Headwinds",
            oneLiner: "Condo values in this area are rate-sensitive; limited upside without significant rent growth or lower rates."
        )
        return AnalysisDashboardState(
            propertyAddress: address,
            dealScoreResult: dealResult,
            confidenceMeterResult: confResult,
            underwritingOutputs: underwriting,
            futureValueSummary: futureValue,
            risks: [
                AnalysisCallout(title: "DSCR below 1.0", body: "Debt service exceeds NOI; not bankable for most lenders and personal cash flow at risk.", isRisk: true),
                AnalysisCallout(title: "High expense ratio", body: "54% expense ratio leaves little cushion for repairs or vacancy.", isRisk: true),
                AnalysisCallout(title: "Condo / HOA risk", body: "Special assessments and HOA increases can erase already thin margins.", isRisk: true)
            ],
            opportunities: [
                AnalysisCallout(title: "Rate or rent improvement", body: "If rates fall or rent rises 10%, deal could approach break-even.", isRisk: false)
            ]
        )
    }

    // MARK: - Portfolio deals (with full analysis state for dashboard)

    static func dealsForPortfolio() -> [PortfolioDeal] {
        let now = Date()
        let cal = Calendar.current
        let id1 = UUID()
        let id2 = UUID()
        let id3 = UUID()

        let addr1 = "2847 Maple Ridge Dr, Austin, TX 78754"
        let addr2 = "910 Oak Hollow Ln, Round Rock, TX 78664"
        let addr3 = "1200 W Anderson Ln #204, Austin, TX 78757"

        return [
            PortfolioDeal(
                id: id1,
                propertyId: id1,
                propertyAddress: addr1,
                analysisName: "Maple Ridge 4-plex",
                dealScore: 85,
                dealArchetype: .strong,
                confidenceScore: 82,
                confidenceGrade: .high,
                noi: 34_040,
                capRatePercent: 6.55,
                annualCashFlow: 9_140,
                status: .watching,
                updatedAt: cal.date(byAdding: .day, value: -2, to: now) ?? now,
                createdAt: cal.date(byAdding: .day, value: -10, to: now) ?? now,
                fullAnalysisState: analysisStateMultifamilyStrong(address: addr1)
            ),
            PortfolioDeal(
                id: id2,
                propertyId: id2,
                propertyAddress: addr2,
                analysisName: "Oak Hollow value-add",
                dealScore: 58,
                dealArchetype: .stable,
                confidenceScore: 58,
                confidenceGrade: .medium,
                noi: 19_560,
                capRatePercent: 5.08,
                annualCashFlow: -3_340,
                status: .offer,
                updatedAt: cal.date(byAdding: .day, value: -1, to: now) ?? now,
                createdAt: cal.date(byAdding: .day, value: -14, to: now) ?? now,
                fullAnalysisState: analysisStateValueAdd(address: addr2)
            ),
            PortfolioDeal(
                id: id3,
                propertyId: id3,
                propertyAddress: addr3,
                analysisName: "Anderson condo",
                dealScore: 28,
                dealArchetype: .risky,
                confidenceScore: 38,
                confidenceGrade: .low,
                noi: 8_426,
                capRatePercent: 2.59,
                annualCashFlow: -13_674,
                status: .passed,
                updatedAt: cal.date(byAdding: .day, value: -5, to: now) ?? now,
                createdAt: cal.date(byAdding: .day, value: -21, to: now) ?? now,
                fullAnalysisState: analysisStateThinMargin(address: addr3)
            ),
        ]
    }

    // MARK: - Import results (for "Load demo property" in Import flow)

    static func demoImportResult(for demoId: DemoPropertyId) -> PropertyImportResult {
        let id: UUID
        let property: NormalizedProperty
        let rawRecord: RawSourceRecord

        switch demoId {
        case .multifamilyStrong:
            id = UUID()
            property = normalizedPropertyMultifamilyStrong(id: id)
            rawRecord = RawSourceRecord(source: .derived, externalID: DemoPropertyId.multifamilyStrong.rawValue, rawPayload: Data(), fetchedAt: Date())
        case .valueAddRenovation:
            id = UUID()
            property = normalizedPropertyValueAdd(id: id)
            rawRecord = RawSourceRecord(source: .derived, externalID: DemoPropertyId.valueAddRenovation.rawValue, rawPayload: Data(), fetchedAt: Date())
        case .thinMarginRisky:
            id = UUID()
            property = normalizedPropertyThinMargin(id: id)
            rawRecord = RawSourceRecord(source: .derived, externalID: DemoPropertyId.thinMarginRisky.rawValue, rawPayload: Data(), fetchedAt: Date())
        }

        return PropertyImportResult(
            property: property,
            rawRecords: [rawRecord],
            fromCache: false,
            importSource: "demo"
        )
    }

    /// All three demo import results (e.g. for picker or list).
    static func allDemoImportResults() -> [PropertyImportResult] {
        DemoPropertyId.allCases.map { demoImportResult(for: $0) }
    }
}
