//
//  ImportConfidence.swift
//  PropFolio
//
//  Confidence scoring for imported data. 0.0–1.0; factors explain the score.
//

import Foundation

/// Confidence for a single imported value. All fetched values must include this.
struct ImportConfidence: Codable, Sendable {
    let score: Double
    let factors: [ConfidenceFactor]

    init(score: Double, factors: [ConfidenceFactor] = []) {
        self.score = min(1.0, max(0.0, score))
        self.factors = factors
    }

    static let high = ImportConfidence(score: 0.9, factors: [.verifiedSource, .recentData])
    static let medium = ImportConfidence(score: 0.7, factors: [.verifiedSource])
    static let mediumStale = ImportConfidence(score: 0.65, factors: [.verifiedSource, .staleData])
    static let low = ImportConfidence(score: 0.4, factors: [.singleSource])
    static let userInput = ImportConfidence(score: 0.4, factors: [.userOverride, .singleSource])
    static let derived = ImportConfidence(score: 0.3, factors: [.derived])
    static let unknown = ImportConfidence(score: 0.0, factors: [.missingSource])
}

/// Reasons that contribute to a confidence score.
enum ConfidenceFactor: String, Codable, Sendable {
    case verifiedSource
    case recentData
    case multipleSourcesAgree
    case partialData
    case staleData
    case singleSource
    case missingSource
    case userOverride
    case derived
}
