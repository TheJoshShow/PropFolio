//
//  TrackedValue.swift
//  PropFolio
//
//  Value wrapper with full provenance (source, timestamp, confidence).
//

import Foundation

/// A value with import provenance. Use for every normalized property field.
struct TrackedValue<T: Codable>: Codable, Sendable where T: Sendable {
    let value: T
    let metadata: ImportMetadata

    init(value: T, metadata: ImportMetadata) {
        self.value = value
        self.metadata = metadata
    }
}
