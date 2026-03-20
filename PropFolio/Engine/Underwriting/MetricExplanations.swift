//
//  MetricExplanations.swift
//  PropFolio
//
//  Human-readable names and explanation strings for underwriting metrics (UI tooltips, detail screens).
//

import Foundation

enum MetricExplanations {
    static func name(for metric: UnderwritingMetric) -> String {
        switch metric {
        case .grossScheduledRent: return "Gross Scheduled Rent"
        case .vacancyAdjustedGrossIncome: return "Vacancy-Adjusted Gross Income"
        case .otherIncome: return "Other Income"
        case .effectiveGrossIncome: return "Effective Gross Income"
        case .operatingExpenses: return "Operating Expenses"
        case .noi: return "Net Operating Income"
        case .annualDebtService: return "Annual Debt Service"
        case .monthlyCashFlow: return "Monthly Cash Flow"
        case .annualCashFlow: return "Annual Cash Flow"
        case .dscr: return "Debt Service Coverage Ratio"
        case .capRate: return "Cap Rate"
        case .cashOnCashReturn: return "Cash on Cash Return"
        case .grm: return "Gross Rent Multiplier"
        case .expenseRatio: return "Expense Ratio"
        case .breakEvenRatio: return "Break-Even Ratio"
        case .debtYield: return "Debt Yield"
        case .ltv: return "Loan to Value"
        case .pricePerUnit: return "Price per Unit"
        case .pricePerSquareFoot: return "Price per Square Foot"
        case .breakevenOccupancy: return "Breakeven Occupancy"
        case .equityPaydown5Year: return "5-Year Equity Paydown"
        case .irr: return "IRR"
        }
    }

    static func formula(for metric: UnderwritingMetric) -> String {
        switch metric {
        case .grossScheduledRent: return "Monthly rent × 12 (or annual GSR input)."
        case .vacancyAdjustedGrossIncome: return "GSR × (1 − vacancy %)."
        case .otherIncome: return "Laundry, parking, etc. (annual)."
        case .effectiveGrossIncome: return "Vacancy-adjusted gross income + other income."
        case .operatingExpenses: return "Input: total operating expenses per year."
        case .noi: return "Effective gross income − operating expenses."
        case .annualDebtService: return "Annual principal + interest (input or from loan/rate/term)."
        case .monthlyCashFlow: return "(NOI − annual debt service) ÷ 12."
        case .annualCashFlow: return "NOI − annual debt service."
        case .dscr: return "NOI ÷ annual debt service."
        case .capRate: return "NOI ÷ purchase price."
        case .cashOnCashReturn: return "Annual cash flow ÷ equity invested."
        case .grm: return "Purchase price ÷ gross scheduled rent (annual)."
        case .expenseRatio: return "Operating expenses ÷ effective gross income."
        case .breakEvenRatio: return "(Operating expenses + debt service) ÷ effective gross income."
        case .debtYield: return "NOI ÷ loan amount."
        case .ltv: return "Loan amount ÷ purchase price."
        case .pricePerUnit: return "Purchase price ÷ number of units."
        case .pricePerSquareFoot: return "Purchase price ÷ square footage."
        case .breakevenOccupancy: return "(Operating expenses + debt service) ÷ (GSR + other income); capped at 100%."
        case .equityPaydown5Year: return "Loan balance paid down over 5 years (amortization)."
        case .irr: return "IRR requires an explicit cash flow schedule (dates and amounts)."
        }
    }

    static func interpretation(for metric: UnderwritingMetric) -> String {
        switch metric {
        case .grossScheduledRent: return "Total rent if fully occupied for the year."
        case .vacancyAdjustedGrossIncome: return "Expected rent after vacancy loss."
        case .otherIncome: return "Income from parking, laundry, fees, etc."
        case .effectiveGrossIncome: return "Total income before operating expenses."
        case .operatingExpenses: return "Taxes, insurance, maintenance, utilities, management, etc."
        case .noi: return "Income after expenses, before debt; key for value and cap rate."
        case .annualDebtService: return "Annual mortgage principal and interest."
        case .monthlyCashFlow: return "Cash left after debt service each month."
        case .annualCashFlow: return "Annual cash after debt service."
        case .dscr: return "Lenders often require ≥ 1.25; higher is safer."
        case .capRate: return "Return on purchase price if paid all cash; compare to market."
        case .cashOnCashReturn: return "Return on your down payment from cash flow."
        case .grm: return "Years of gross rent to equal purchase price; lower can mean better value."
        case .expenseRatio: return "Share of income spent on expenses; typical range 35–50%."
        case .breakEvenRatio: return "Occupancy needed to cover expenses and debt; lower leaves more cushion."
        case .debtYield: return "NOI as % of loan; used by some lenders."
        case .ltv: return "Loan as % of purchase price; lower means more equity."
        case .pricePerUnit: return "Cost per unit; useful to compare multi-family deals."
        case .pricePerSquareFoot: return "Cost per sq ft; compare to local comps."
        case .breakevenOccupancy: return "Minimum occupancy to cover all costs; 100% means no cushion."
        case .equityPaydown5Year: return "How much loan principal is paid off in 5 years."
        case .irr: return "Time-weighted return; needs full cash flow schedule to compute."
        }
    }

    /// Unit label for display (e.g. "/year", "%", "×").
    static func unitLabel(for metric: UnderwritingMetric) -> String {
        switch metric {
        case .grossScheduledRent, .vacancyAdjustedGrossIncome, .otherIncome, .effectiveGrossIncome,
             .operatingExpenses, .noi, .annualDebtService, .annualCashFlow, .equityPaydown5Year:
            return "/year"
        case .monthlyCashFlow: return "/month"
        case .dscr, .grm, .expenseRatio, .breakEvenRatio: return "×"
        case .capRate, .cashOnCashReturn, .debtYield, .ltv, .breakevenOccupancy: return "%"
        case .pricePerUnit: return "/unit"
        case .pricePerSquareFoot: return "/sq ft"
        case .irr: return "%"
        }
    }
}

/// Enum of all underwriting metrics for lookup (names, formulas, interpretations).
enum UnderwritingMetric: String, CaseIterable, Sendable {
    case grossScheduledRent
    case vacancyAdjustedGrossIncome
    case otherIncome
    case effectiveGrossIncome
    case operatingExpenses
    case noi
    case annualDebtService
    case monthlyCashFlow
    case annualCashFlow
    case dscr
    case capRate
    case cashOnCashReturn
    case grm
    case expenseRatio
    case breakEvenRatio
    case debtYield
    case ltv
    case pricePerUnit
    case pricePerSquareFoot
    case breakevenOccupancy
    case equityPaydown5Year
    case irr
}
