//
//  ConfidenceMeterBand+ConfidenceGrade.swift
//  PropFolio
//
//  Map Confidence Meter band to Dashboard ConfidenceGrade for teaser and chips.
//

import Foundation

extension ConfidenceMeterBand {
    /// Use when feeding ConfidenceMeterTeaser or analysis confidence grade.
    var confidenceGrade: ConfidenceGrade {
        switch self {
        case .high: return .high
        case .medium: return .medium
        case .low: return .low
        case .veryLow: return .veryLow
        }
    }
}

extension ConfidenceGrade {
    /// Use when building ConfidenceMeterResult from a stored grade (e.g. portfolio deal).
    var confidenceMeterBand: ConfidenceMeterBand {
        switch self {
        case .high: return .high
        case .medium: return .medium
        case .low: return .low
        case .veryLow: return .veryLow
        }
    }
}
