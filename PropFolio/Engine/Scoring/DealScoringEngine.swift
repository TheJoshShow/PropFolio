//
//  DealScoringEngine.swift
//  PropFolio
//
//  Deal score 0–100 from underwriting/simulation inputs. Sub-scores, weights, guardrails per DEAL-SCORING-SPEC.
//

import Foundation

enum DealScoringEngine {
    /// Weights (sum 1.0). Cash flow is a single factor (monthly or annual, not both) to avoid double-counting.
    private static let weights: [DealScoreFactor: Decimal] = [
        .capRate: 0.12,
        .monthlyCashFlow: 0.18,  // used only when annual absent; else annual gets 0.18
        .annualCashFlow: 0.18,
        .cashOnCashReturn: 0.10,
        .dscr: 0.12,
        .expenseRatio: 0.06,
        .vacancySensitivity: 0.06,
        .renovationBurden: 0.06,
        .purchaseDiscount: 0.05,
        .rentCoverageStrength: 0.05,
        .dataConfidence: 0.12,
        .marketTailwinds: 0.04,
        .downsideResilience: 0.04
    ]

    /// Compute deal score from inputs. Returns result with total (or nil), band, components, and explanation.
    static func score(_ inputs: DealScoreInputs) -> DealScoreResult {
        var components: [DealScoreComponent] = []

        func add(_ factor: DealScoreFactor, raw: String?, sub: Decimal?) {
            guard let s = sub, let w = weights[factor] else { return }
            components.append(DealScoreComponent(id: factor, rawValue: raw, subScore: s, weight: w, contribution: s * w))
        }

        // Cap rate: 0–10% → 0–100
        if let cap = inputs.capRate, cap >= 0 {
            let sub = min(100, max(0, cap * 10)) // 0.05→50, 0.10→100
            add(.capRate, raw: "\(formatPercent(cap))", sub: sub)
        }

        // Cash flow: single factor to avoid double-counting (monthly and annual are same signal). Prefer annual if both present.
        if let cf = inputs.annualCashFlow {
            let sub: Decimal = cf <= 0 ? 0 : min(100, (cf / 30000) * 80)
            add(.annualCashFlow, raw: formatCurrency(cf), sub: sub)
        } else if let cf = inputs.monthlyCashFlow {
            let sub: Decimal = cf <= 0 ? 0 : min(100, (cf / 1500) * 80)
            add(.monthlyCashFlow, raw: formatCurrency(cf), sub: sub)
        }

        // Cash on cash: 0–10% → 0–100
        if let coc = inputs.cashOnCashReturn, coc >= 0 {
            let sub = min(100, max(0, coc * 10))
            add(.cashOnCashReturn, raw: "\(formatPercent(coc))", sub: sub)
        }

        // DSCR: <1→0, 1→20, 1.25→50, 1.5→75, 2+→100 (Decimal thresholds)
        if let d = inputs.dscr {
            let one: Decimal = 1
            let one25: Decimal = 1.25
            let one5: Decimal = 1.5
            let two: Decimal = 2
            let sub: Decimal = d < one ? 0 : (d >= two ? 100 : (d <= one25 ? 20 + (d - one) * 120 : (d <= one5 ? 50 + (d - one25) * 100 : 75 + (d - one5) * 100)))
            add(.dscr, raw: String(format: "%.2f×", d as NSDecimalNumber).replacingOccurrences(of: ".00×", with: "×"), sub: min(100, max(0, sub)))
        }

        // Expense ratio: 30%→100, 70%→0 (lower is better)
        if let e = inputs.expenseRatio, e >= 0 {
            let low: Decimal = 0.30
            let high: Decimal = 0.70
            let sub = e <= low ? 100 : (e >= high ? 0 : 100 - (e - low) / 0.40 * 100)
            add(.expenseRatio, raw: "\(formatPercent(e))", sub: min(100, max(0, sub)))
        }

        // Vacancy sensitivity (breakeven occ): 1.0→0, 0.6→100 (lower breakeven = better)
        if let b = inputs.breakevenOccupancy, b >= 0 {
            let sub = b >= 1 ? 0 : (b <= 0.6 ? 100 : (1 - b) / 0.4 * 100)
            add(.vacancySensitivity, raw: "\(formatPercent(b))", sub: min(100, max(0, sub)))
        }

        // Renovation burden: 0→100, 20%→0
        if let r = inputs.renovationBurdenRatio, r >= 0 {
            let cap: Decimal = 0.20
            let sub = r <= 0 ? 100 : (r >= cap ? 0 : 100 - r / cap * 100)
            add(.renovationBurden, raw: "\(formatPercent(r))", sub: min(100, max(0, sub)))
        }

        // Purchase discount: 0→0, 20%→100
        if let d = inputs.purchaseDiscountVsValue, d >= 0 {
            let sub = min(100, d / 0.20 * 100)
            add(.purchaseDiscount, raw: "\(formatPercent(d))", sub: sub)
        }

        // Rent coverage GSR/ADS: 1→0, 2+→100
        if let rc = inputs.rentCoverageStrength, rc >= 0 {
            let sub = rc <= 1 ? 0 : (rc >= 2 ? 100 : (rc - 1) * 100)
            add(.rentCoverageStrength, raw: String(format: "%.2f×", rc as NSDecimalNumber), sub: min(100, max(0, sub)))
        }

        // Data confidence: 0–1 → 0–100
        if let c = inputs.dataConfidence, c >= 0 {
            let sub = min(100, max(0, c * 100))
            add(.dataConfidence, raw: "\(formatPercent(c))", sub: sub)
        }

        // Market tailwinds: 0–1 or 0–100
        if let t = inputs.marketTailwinds, t >= 0 {
            let sub = t <= 1 ? t * 100 : min(100, t)
            add(.marketTailwinds, raw: "\(Int((sub as NSDecimalNumber).doubleValue))", sub: sub)
        }

        // Downside resilience: stress DSCR <1→0, 1→50, ≥1.25→100
        if let s = inputs.stressDSCR, s >= 0 {
            let one: Decimal = 1
            let one25: Decimal = 1.25
            let sub = s < one ? 0 : (s >= one25 ? 100 : 50 + (s - one) * 200)
            add(.downsideResilience, raw: String(format: "%.2f×", s as NSDecimalNumber), sub: min(100, max(0, sub)))
        }

        // Required for valid score: DSCR + data confidence + (cap rate OR cash flow)
        let hasProfitability = inputs.capRate != nil || inputs.monthlyCashFlow != nil || inputs.annualCashFlow != nil
        let hasRequired = inputs.dscr != nil && inputs.dataConfidence != nil && hasProfitability

        if !hasRequired {
            return DealScoreResult(
                totalScore: nil,
                band: .insufficientData,
                components: components,
                wasCappedByConfidence: false,
                explanationSummary: DealScoreExplanations.insufficientDataReason()
            )
        }

        let totalWeight = components.map(\.weight).reduce(0, +)
        guard totalWeight > 0 else {
            return DealScoreResult(totalScore: nil, band: .insufficientData, components: components, wasCappedByConfidence: false, explanationSummary: DealScoreExplanations.insufficientDataReason())
        }

        var rawTotal = components.map(\.contribution).reduce(0, +) / totalWeight
        let confidenceSub = components.first { $0.id == .dataConfidence }?.subScore ?? 0
        var wasCapped = false
        if confidenceSub < 50 && rawTotal > 60 {
            rawTotal = 60
            wasCapped = true
        }

        let totalScore = min(100, max(0, rawTotal))
        let band = bandForScore(totalScore)

        return DealScoreResult(
            totalScore: totalScore,
            band: band,
            components: components,
            wasCappedByConfidence: wasCapped,
            explanationSummary: DealScoreExplanations.summary(components: components, totalScore: totalScore, band: band, wasCappedByConfidence: wasCapped)
        )
    }

    private static func bandForScore(_ score: Decimal) -> DealScoreBand {
        let s = (score as NSDecimalNumber).doubleValue
        if s >= 90 { return .exceptional }
        if s >= 75 { return .strong }
        if s >= 60 { return .good }
        if s >= 45 { return .fair }
        if s >= 30 { return .weak }
        return .poor
    }

    private static func formatPercent(_ d: Decimal) -> String {
        let n = (d * 100 as NSDecimalNumber).doubleValue
        return String(format: "%.1f%%", n)
    }

    private static func formatCurrency(_ d: Decimal) -> String {
        let n = (d as NSDecimalNumber).doubleValue
        return String(format: "$%.0f", n)
    }
}
