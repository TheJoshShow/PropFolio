//
//  ImportMetadata.swift
//  PropFolio
//
//  Metadata attached to every imported value: source, timestamp, confidence.
//

import Foundation

/// Metadata for a single imported value. Required for every field from external or user input.
struct ImportMetadata: Codable, Sendable {
    let source: DataSource
    let fetchedAt: Date
    let confidence: ImportConfidence
    let rawValue: String?

    init(source: DataSource, fetchedAt: Date = Date(), confidence: ImportConfidence, rawValue: String? = nil) {
        self.source = source
        self.fetchedAt = fetchedAt
        self.confidence = confidence
        self.rawValue = rawValue
    }
}
