//
//  PropertyType.swift
//  PropFolio
//
//  Canonical property type for normalized records.
//

import Foundation

enum PropertyType: String, Codable, CaseIterable, Sendable {
    case singleFamily = "single_family"
    case multiFamily = "multi_family"
    case condo = "condo"
    case townhouse = "townhouse"
    case other = "other"
}
