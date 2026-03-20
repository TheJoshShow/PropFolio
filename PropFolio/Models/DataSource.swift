//
//  DataSource.swift
//  PropFolio
//
//  Provenance: which system supplied a value. Matches backend imported_source_records.source.
//

import Foundation

/// Source of property data. Used for provenance and raw record storage.
enum DataSource: String, Codable, CaseIterable, Sendable {
    case zillow
    case redfin
    case rentcast
    case manual
    case derived
    case other
    case googlePlaces
    case attom
    case publicMarket

    /// Value to store in backend imported_source_records (schema allows zillow, redfin, rentcast, manual, other).
    var storageValue: String {
        switch self {
        case .zillow: return "zillow"
        case .redfin: return "redfin"
        case .rentcast: return "rentcast"
        case .manual: return "manual"
        case .derived, .other, .googlePlaces, .attom, .publicMarket: return "other"
        }
    }
}
