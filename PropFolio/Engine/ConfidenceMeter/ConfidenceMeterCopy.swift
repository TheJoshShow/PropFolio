//
//  ConfidenceMeterCopy.swift
//  PropFolio
//
//  User-facing copy: explanation text, band labels, recommended actions.
//

import Foundation

enum ConfidenceMeterCopy {
    // MARK: - Band labels

    static func bandLabel(_ band: ConfidenceMeterBand) -> String {
        switch band {
        case .high: return "High"
        case .medium: return "Medium"
        case .low: return "Low"
        case .veryLow: return "Very low"
        }
    }

    static func bandDescription(_ band: ConfidenceMeterBand) -> String {
        switch band {
        case .high: return "Analysis is well grounded in data and assumptions you can rely on."
        case .medium: return "Analysis is reasonably grounded; a few gaps or overrides remain."
        case .low: return "Analysis depends on several assumptions or missing data; verify key inputs."
        case .veryLow: return "Limited data or many overrides; add sources and confirm assumptions to improve confidence."
        }
    }

    // MARK: - What's helping (supporting)

    static func factorSupporting(_ factor: ConfidenceMeterFactor, value: Decimal) -> String {
        switch factor {
        case .propertyDataCompleteness: return "Property data is largely complete."
        case .rentEstimateConfidence: return "Rent estimate is from a reliable or recent source."
        case .expenseAssumptionsConfidence: return "Expense assumptions are well supported."
        case .renovationBudgetCertainty: return "Renovation budget has clear scope or quotes."
        case .financingAssumptionsStability: return "Financing assumptions are stable or locked."
        case .marketDataReliabilityFreshness: return "Market data is reliable and up to date."
        case .manualOverrideImpact: return "Few or no manual overrides; using PropFolio’s defaults."
        }
    }

    // MARK: - What's hurting (limiting)

    static func factorLimiting(_ factor: ConfidenceMeterFactor, value: Decimal) -> String {
        switch factor {
        case .propertyDataCompleteness: return "Property data is incomplete (e.g. missing units or sq ft)."
        case .rentEstimateConfidence: return "Rent estimate is missing or from a weak source."
        case .expenseAssumptionsConfidence: return "Expense assumptions are rough or unsupported."
        case .renovationBudgetCertainty: return "Renovation budget is uncertain or not yet scoped."
        case .financingAssumptionsStability: return "Financing assumptions may change (e.g. rate not locked)."
        case .marketDataReliabilityFreshness: return "Market data is limited or outdated."
        case .manualOverrideImpact: return "Several inputs were manually overridden."
        }
    }

    static func manualOverrideLimiting(count: Int) -> String {
        if count >= 5 { return "Many manual overrides (\(count)); analysis reflects your inputs more than PropFolio data." }
        if count >= 1 { return "Some manual overrides (\(count)); double-check overridden values." }
        return "Several inputs were manually overridden."
    }

    // MARK: - Summary line

    static func explanationSummary(score: Decimal, supportingCount: Int, limitingCount: Int) -> String {
        let s = (score as NSDecimalNumber).doubleValue
        if limitingCount == 0 && supportingCount > 0 {
            return "Your analysis is well supported by the data and assumptions in this deal."
        }
        if limitingCount > 0 && supportingCount > 0 {
            return "\(supportingCount) area\(supportingCount == 1 ? "" : "s") support this analysis; \(limitingCount) \(limitingCount == 1 ? "area is" : "areas are") reducing confidence."
        }
        if limitingCount > 0 {
            return "Adding or confirming data in key areas will improve how dependable this analysis is."
        }
        if s < 30 {
            return "Complete property, rent, and expense data to build a more dependable analysis."
        }
        return "Confidence reflects how grounded this analysis is in data and stable assumptions."
    }

    // MARK: - Recommended actions

    static func recommendedAction(for factor: ConfidenceMeterFactor) -> String? {
        switch factor {
        case .propertyDataCompleteness: return "Complete property details (units, sq ft, year built) from listing or records."
        case .rentEstimateConfidence: return "Add a rent estimate from a listing, appraisal, or rent comp source."
        case .expenseAssumptionsConfidence: return "Confirm or add expense assumptions (taxes, insurance, maintenance)."
        case .renovationBudgetCertainty: return "Define renovation scope or add quotes to improve budget certainty."
        case .financingAssumptionsStability: return "Lock or confirm financing terms if possible."
        case .marketDataReliabilityFreshness: return "Refresh or add local market data for better context."
        case .manualOverrideImpact: return "Review overridden inputs to ensure they’re accurate."
        }
    }

    static func recommendedActionForOverrides(count: Int) -> String {
        "Review your \(count) manual overrides to make sure they reflect current, accurate numbers."
    }

    // MARK: - Teaser / short copy

    static func teaserSubtitle(score: Decimal, band: ConfidenceMeterBand) -> String {
        switch band {
        case .high: return "Analysis is well grounded"
        case .medium: return "Reasonably grounded; a few gaps"
        case .low: return "Verify key inputs"
        case .veryLow: return "Add data to improve confidence"
        }
    }
}
