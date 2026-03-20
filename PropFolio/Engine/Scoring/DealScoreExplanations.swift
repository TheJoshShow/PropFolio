//
//  DealScoreExplanations.swift
//  PropFolio
//
//  Explanation text for users: why the score is what it is, factor names, and band descriptions.
//

import Foundation

enum DealScoreExplanations {
    /// One line for UI to explain the difference between deal score and confidence (e.g. header or tooltip).
    static func scoreVsConfidenceOneLiner() -> String {
        "Deal score: how the numbers look. Confidence: how much we trust the data."
    }

    /// When we cannot compute a score (missing required data).
    static func insufficientDataReason() -> String {
        "We need at least cap rate or cash flow, DSCR, and data confidence to score this deal. Add or confirm those inputs to see a score."
    }

    /// One-line summary: band, total, and key drivers or cap reason.
    static func summary(components: [DealScoreComponent], totalScore: Decimal, band: DealScoreBand, wasCappedByConfidence: Bool) -> String {
        if wasCappedByConfidence {
            return "Your score is capped at 60 because data confidence is low. Improve data quality to unlock a higher score."
        }
        let top = components.sorted { ($0.contribution as NSDecimalNumber).doubleValue > ($1.contribution as NSDecimalNumber).doubleValue }.prefix(2)
        let names = top.map { factorName($0.id) }.joined(separator: " and ")
        return "\(bandSentence(band)) (\(Int((totalScore as NSDecimalNumber).doubleValue))/100). Strongest drivers: \(names)."
    }

    static func bandSentence(_ band: DealScoreBand) -> String {
        switch band {
        case .exceptional: return "Exceptional deal"
        case .strong: return "Strong deal"
        case .good: return "Good deal"
        case .fair: return "Fair deal"
        case .weak: return "Weak deal"
        case .poor: return "Poor deal"
        case .insufficientData: return "Insufficient data to score"
        }
    }

    static func factorName(_ factor: DealScoreFactor) -> String {
        switch factor {
        case .capRate: return "Cap rate"
        case .monthlyCashFlow: return "Monthly cash flow"
        case .annualCashFlow: return "Annual cash flow"
        case .cashOnCashReturn: return "Cash on cash return"
        case .dscr: return "DSCR"
        case .expenseRatio: return "Expense ratio"
        case .vacancySensitivity: return "Vacancy sensitivity"
        case .renovationBurden: return "Renovation burden"
        case .purchaseDiscount: return "Purchase discount"
        case .rentCoverageStrength: return "Rent coverage"
        case .dataConfidence: return "Data confidence"
        case .marketTailwinds: return "Market tailwinds"
        case .downsideResilience: return "Downside resilience"
        }
    }

    /// Short explanation of what this factor means for the score.
    static func factorExplanation(_ factor: DealScoreFactor) -> String {
        switch factor {
        case .capRate: return "Higher cap rate means more income relative to price; we score up to 10% as strong."
        case .monthlyCashFlow: return "Positive monthly cash flow after debt; more cushion scores higher."
        case .annualCashFlow: return "Annual cash left after debt service; supports returns and resilience."
        case .cashOnCashReturn: return "Return on your cash invested; we reward 5%+ and cap at 10%."
        case .dscr: return "Lenders like 1.25+; we score up to 2× as excellent."
        case .expenseRatio: return "Lower expense ratio leaves more for debt and profit; 30–50% is typical."
        case .vacancySensitivity: return "Lower breakeven occupancy means you can absorb more vacancy and still cover costs."
        case .renovationBurden: return "Less renovation as a share of cost means more cash for the deal and less execution risk."
        case .purchaseDiscount: return "Buying below estimated value can add upside; we reward 10%+ discount."
        case .rentCoverageStrength: return "Gross rent well above debt service gives cushion; 2×+ is strong."
        case .dataConfidence: return "Score is capped when confidence is low so we don’t overstate a deal."
        case .marketTailwinds: return "Positive market outlook can support future value; we add a small weight."
        case .downsideResilience: return "Stress test: 5% rent drop and 2% higher vacancy; stress DSCR = NOI after that ÷ debt service. ≥1.25 is strong. Optional; if not provided, this factor is omitted."
        }
    }

    /// Band description for tooltip or detail.
    static func bandDescription(_ band: DealScoreBand) -> String {
        switch band {
        case .exceptional: return "Exceptional: strong profitability, resilience, and data support."
        case .strong: return "Strong: solid deal with minor gaps."
        case .good: return "Good: reasonable deal with some risk or missing data."
        case .fair: return "Fair: marginal deal with material risks or weak data."
        case .weak: return "Weak: poor economics or resilience."
        case .poor: return "Poor: high risk or insufficient data."
        case .insufficientData: return "We need more data (cap rate or cash flow, DSCR, confidence) to score."
        }
    }
}
