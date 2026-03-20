//
//  RenovationCategory.swift
//  PropFolio
//
//  Major line-item categories for renovation planning.
//

import Foundation

/// Major renovation categories. Used for line items and default templates.
enum RenovationCategory: String, CaseIterable, Codable, Sendable {
    case roof
    case windows
    case electrical
    case plumbing
    case hvac
    case foundationStructural = "foundation_structural"
    case flooring
    case kitchens
    case bathrooms
    case paint
    case exteriorEnvelope = "exterior_envelope"
    case landscapingSiteWork = "landscaping_site_work"
    case permitsContingency = "permits_contingency"
    case generalLaborDemo = "general_labor_demo"

    var displayName: String {
        switch self {
        case .roof: return "Roof"
        case .windows: return "Windows"
        case .electrical: return "Electrical"
        case .plumbing: return "Plumbing"
        case .hvac: return "HVAC"
        case .foundationStructural: return "Foundation / Structural"
        case .flooring: return "Flooring"
        case .kitchens: return "Kitchens"
        case .bathrooms: return "Bathrooms"
        case .paint: return "Paint"
        case .exteriorEnvelope: return "Exterior Envelope"
        case .landscapingSiteWork: return "Landscaping / Site Work"
        case .permitsContingency: return "Permits / Contingency"
        case .generalLaborDemo: return "General Labor / Demo"
        }
    }
}
