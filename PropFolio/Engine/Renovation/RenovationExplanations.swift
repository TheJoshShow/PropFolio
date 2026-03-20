//
//  RenovationExplanations.swift
//  PropFolio
//
//  Human-readable explanation text for novice users (UI tooltips, help).
//

import Foundation

enum RenovationExplanations {
    /// Short explanation of what this category covers and why it matters.
    static func categoryExplanation(_ category: RenovationCategory) -> String {
        switch category {
        case .roof:
            return "Roof replacement or major repair. A solid roof protects everything else; lenders and insurers often require a certain remaining life."
        case .windows:
            return "Window replacement or repair. New windows improve energy efficiency and curb appeal; costs vary by count, size, and quality."
        case .electrical:
            return "Electrical upgrades (panel, wiring, outlets). Older homes may need this for safety and to support modern loads."
        case .plumbing:
            return "Plumbing repairs or repipes. Fixing leaks and updating pipes reduces water damage risk and can lower insurance."
        case .hvac:
            return "Heating, ventilation, and air conditioning. A working HVAC is expected by tenants and affects rent and occupancy."
        case .foundationStructural:
            return "Foundation and structural repairs. Address these early; they can be costly and affect financing and resale."
        case .flooring:
            return "Flooring (hardwood, LVP, tile, carpet). Durable, easy-to-clean flooring holds up better in rentals."
        case .kitchens:
            return "Kitchen updates: cabinets, counters, appliances. Kitchens have a big impact on rent and appeal; scope can range from cosmetic to full remodel."
        case .bathrooms:
            return "Bathroom updates: fixtures, tile, vanities. Bath condition is a top concern for renters and buyers."
        case .paint:
            return "Interior and/or exterior paint. Fresh paint is one of the most cost-effective ways to improve appearance."
        case .exteriorEnvelope:
            return "Siding, stucco, trim, and weather sealing. The envelope keeps weather out and affects energy and durability."
        case .landscapingSiteWork:
            return "Landscaping, grading, drainage, and site work. Improves curb appeal and can prevent water intrusion."
        case .permitsContingency:
            return "Permits, fees, and a contingency buffer. Unforeseen issues are common; 10–15% contingency is typical."
        case .generalLaborDemo:
            return "General labor, demolition, and debris removal. Often needed before or during other trades."
        }
    }

    /// One-line tip for the estimate tier.
    static func tierTip(_ tier: RenovationEstimateTier) -> String {
        switch tier {
        case .low: return "Low = minimal scope or DIY-friendly assumptions; good for a best-case budget."
        case .base: return "Base = typical mid-range scope and quality; use for your main projection."
        case .high: return "High = premium materials or complex conditions; use for a conservative budget."
        }
    }

    static func regionMultiplierExplanation() -> String {
        "Adjust for your area. 1.0 is national average; e.g. 1.15 means costs run about 15% higher locally. Replace with real local data when available."
    }

    static func contingencyExplanation() -> String {
        "Contingency is extra budget for unknowns (hidden damage, permit changes, etc.). Often 10–15% of the line-item total."
    }
}
