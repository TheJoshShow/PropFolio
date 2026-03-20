//
//  ScenarioComparison+Display.swift
//  PropFolio
//
//  Display labels and formatting for comparison metrics (deltas, values).
//

import Foundation

extension ComparisonMetric {
    var displayLabel: String {
        switch self {
        case .noi: return "NOI"
        case .capRate: return "Cap rate"
        case .monthlyCashFlow: return "Monthly cash flow"
        case .annualCashFlow: return "Annual cash flow"
        case .dscr: return "DSCR"
        case .cashOnCashReturn: return "Cash on cash"
        case .totalCashToClose: return "Total cash to close"
        case .equityInvested: return "Equity invested"
        }
    }

    var isPercent: Bool {
        switch self {
        case .capRate, .cashOnCashReturn: return true
        default: return false
        }
    }
}

enum SimulatorFormatters {
    static func currency(_ value: Decimal) -> String {
        let n = value as NSDecimalNumber
        let f = NumberFormatter()
        f.numberStyle = .currency
        f.currencyCode = "USD"
        f.maximumFractionDigits = 0
        f.minimumFractionDigits = 0
        return f.string(from: n) ?? "—"
    }

    static func currencyOptional(_ value: Decimal?) -> String {
        guard let v = value else { return "—" }
        return currency(v)
    }

    static func percent(_ value: Decimal) -> String {
        let pct = (value as NSDecimalNumber).doubleValue * 100
        let f = NumberFormatter()
        f.numberStyle = .decimal
        f.minimumFractionDigits = 1
        f.maximumFractionDigits = 1
        return (f.string(from: NSNumber(value: pct)) ?? "0") + "%"
    }

    static func percentOptional(_ value: Decimal?) -> String {
        guard let v = value else { return "—" }
        return percent(v)
    }

    static func decimal2(_ value: Decimal) -> String {
        let f = NumberFormatter()
        f.numberStyle = .decimal
        f.minimumFractionDigits = 1
        f.maximumFractionDigits = 2
        return f.string(from: value as NSDecimalNumber) ?? "—"
    }

    static func deltaString(metric: ComparisonMetric, delta: Decimal) -> String {
        let n = (delta as NSDecimalNumber).doubleValue
        if n == 0 { return "—" }
        let sign = n > 0 ? "+" : ""
        if metric.isPercent {
            let pct = n * 100
            return "\(sign)\(String(format: "%.1f", pct)) pt"
        }
        let f = NumberFormatter()
        f.numberStyle = .currency
        f.currencyCode = "USD"
        f.maximumFractionDigits = 0
        f.positivePrefix = "+$"
        f.negativePrefix = "-$"
        return f.string(from: NSNumber(value: n)) ?? "—"
    }
}
