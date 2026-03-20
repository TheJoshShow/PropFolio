//
//  SubscriptionStatus.swift
//  PropFolio
//
//  Mirrors public.subscription_status (RevenueCat webhook sync). Used for paywall and import limit.
//

import Foundation

/// One row per user. entitlement_active allows imports beyond the free-tier limit.
struct SubscriptionStatusRow: Decodable, Sendable {
    var user_id: UUID
    var entitlement_active: Bool
    var product_id: String?
    var store: String?
    var expires_at: Date?
    var last_synced_at: Date?
    var updated_at: Date

    enum CodingKeys: String, CodingKey {
        case user_id
        case entitlement_active
        case product_id
        case store
        case expires_at
        case last_synced_at
        case updated_at
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        user_id = try c.decode(UUID.self, forKey: .user_id)
        entitlement_active = try c.decode(Bool.self, forKey: .entitlement_active)
        product_id = try c.decodeIfPresent(String.self, forKey: .product_id)
        store = try c.decodeIfPresent(String.self, forKey: .store)
        expires_at = try c.decodeIfPresent(ISO8601Date.self, forKey: .expires_at).map(\.date)
        last_synced_at = try c.decodeIfPresent(ISO8601Date.self, forKey: .last_synced_at).map(\.date)
        updated_at = try c.decode(ISO8601Date.self, forKey: .updated_at).date
    }
}

/// Decodes ISO8601 date strings from Supabase (timestamptz).
private enum ISO8601Date: Decodable {
    case value(Date)
    var date: Date {
        switch self { case .value(let d): return d }
    }
    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        let s = try c.decode(String.self)
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        if let d = formatter.date(from: s) {
            self = .value(d)
            return
        }
        formatter.formatOptions = [.withInternetDateTime]
        if let d = formatter.date(from: s) {
            self = .value(d)
            return
        }
        throw DecodingError.dataCorruptedError(in: c, debugDescription: "Invalid ISO8601: \(s)")
    }
}
