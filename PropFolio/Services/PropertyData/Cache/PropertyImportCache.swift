//
//  PropertyImportCache.swift
//  PropFolio
//
//  Cache normalized properties and raw payloads to reduce API cost and token use.
//

import Foundation

/// Cache key: either listing (source:id) or address key from AddressNormalizer.
/// Same key on re-import (same URL or same normalized address) → cache hit → idempotent; no duplicate provider call.
enum PropertyCacheKey: Sendable, Hashable {
    case listing(source: DataSource, id: String)
    case address(String)

    /// For structured logging.
    var logDescription: String {
        switch self {
        case .listing(let source, let id): return "listing:\(source.rawValue):\(id.prefix(20))"
        case .address(let a): return "address:\(a.prefix(40))"
        }
    }
}

/// Result of import: normalized property plus raw records to store in imported_source_records.
struct PropertyImportResult: Sendable {
    let property: NormalizedProperty
    let rawRecords: [RawSourceRecord]
    /// True when returned from cache (idempotent re-import). Nil when unknown.
    var fromCache: Bool?
    /// Source of the import for usage tracking (e.g. "zillow", "address"). Nil when unknown.
    var importSource: String?

    init(property: NormalizedProperty, rawRecords: [RawSourceRecord], fromCache: Bool? = nil, importSource: String? = nil) {
        self.property = property
        self.rawRecords = rawRecords
        self.fromCache = fromCache
        self.importSource = importSource
    }
}

/// One raw record to persist (property_id filled by backend when saving).
struct RawSourceRecord: Sendable {
    let source: DataSource
    let externalID: String
    let rawPayload: Data
    let fetchedAt: Date
}

/// Cache for normalized property and optional raw payload.
/// Freshness: implementation-defined TTL (e.g. listing 24h, address 1h). Within TTL, same key returns cached result (idempotent import).
protocol PropertyImportCache: Sendable {
    func get(_ key: PropertyCacheKey) -> PropertyImportResult?
    func set(_ key: PropertyCacheKey, value: PropertyImportResult)
    func remove(_ key: PropertyCacheKey)
}

/// In-memory cache with TTL and max size to avoid unbounded growth. Default 24h listing, 1h address.
final class InMemoryPropertyImportCache: PropertyImportCache, @unchecked Sendable {
    private var store: [PropertyCacheKey: (result: PropertyImportResult, expires: Date)] = [:]
    private var insertionOrder: [PropertyCacheKey] = []
    private let lock = NSLock()
    private let listingTTL: TimeInterval
    private let addressTTL: TimeInterval
    private let maxEntries: Int

    init(listingTTL: TimeInterval = 24 * 3600, addressTTL: TimeInterval = 3600, maxEntries: Int = 100) {
        self.listingTTL = listingTTL
        self.addressTTL = addressTTL
        self.maxEntries = max(1, maxEntries)
    }

    func get(_ key: PropertyCacheKey) -> PropertyImportResult? {
        lock.lock()
        defer { lock.unlock() }
        guard let entry = store[key], entry.expires > Date() else {
            store[key] = nil
            insertionOrder.removeAll { $0 == key }
            return nil
        }
        return entry.result
    }

    func set(_ key: PropertyCacheKey, value: PropertyImportResult) {
        lock.lock()
        defer { lock.unlock() }
        if store[key] == nil {
            insertionOrder.append(key)
            while insertionOrder.count > maxEntries {
                let oldest = insertionOrder.removeFirst()
                store[oldest] = nil
            }
        }
        let ttl = key.isAddress ? addressTTL : listingTTL
        store[key] = (value, Date().addingTimeInterval(ttl))
    }

    func remove(_ key: PropertyCacheKey) {
        lock.lock()
        defer { lock.unlock() }
        store[key] = nil
    }
}

private extension PropertyCacheKey {
    var isAddress: Bool {
        if case .address = self { return true }
        return false
    }
}
