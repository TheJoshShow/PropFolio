//
//  ProviderResponseCache.swift
//  PropFolio
//
//  Generic cache for provider API responses. Reduces cost by avoiding duplicate calls.
//

import Foundation

/// Cache for provider API responses by string key. TTL per set(). Use for autocomplete, validation, rent, parcel, market.
protocol ProviderResponseCache: Sendable {
    func get(_ key: String) -> Data?
    func set(_ key: String, data: Data, ttl: TimeInterval)
    func remove(_ key: String)
}

/// In-memory cache with per-entry TTL. Thread-safe.
final class InMemoryProviderResponseCache: ProviderResponseCache, @unchecked Sendable {
    private var store: [String: (data: Data, expires: Date)] = [:]
    private let lock = NSLock()

    func get(_ key: String) -> Data? {
        lock.lock()
        defer { lock.unlock() }
        guard let entry = store[key], entry.expires > Date() else {
            store[key] = nil
            return nil
        }
        return entry.data
    }

    func set(_ key: String, data: Data, ttl: TimeInterval = 3600) {
        lock.lock()
        defer { lock.unlock() }
        store[key] = (data, Date().addingTimeInterval(ttl))
    }

    func remove(_ key: String) {
        lock.lock()
        defer { lock.unlock() }
        store[key] = nil
    }
}
