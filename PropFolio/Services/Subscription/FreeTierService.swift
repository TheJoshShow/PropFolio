//
//  FreeTierService.swift
//  PropFolio
//
//  Fetches import count and entitlement so the app can gate the 2-import limit and show paywall.
//  Server still enforces via check_property_import_limit() on property_imports INSERT.
//

import Foundation

/// Result of free-tier state: import count and whether user can import more (under 2 or has entitlement).
struct FreeTierState: Sendable {
    var importCount: Int
    var entitlementActive: Bool
    /// True when user may add another import (count < 2 or entitlement_active).
    var canImportMore: Bool {
        importCount < 2 || entitlementActive
    }
}

/// Provides current user's free-tier state (import count + subscription_status).
protocol FreeTierProviding: Sendable {
    func fetchFreeTierState() async -> FreeTierState?
}

/// Fetches from Supabase: property_imports count and subscription_status.entitlement_active for current user.
final class FreeTierService: FreeTierProviding, @unchecked Sendable {
    private let auth: SupabaseAuthProviding
    private let getClient: () -> SupabaseClient?

    init(auth: SupabaseAuthProviding = SupabaseAuthProviding(), getClient: @escaping () -> SupabaseClient? = { SupabaseClient.instance }) {
        self.auth = auth
        self.getClient = getClient
    }

    func fetchFreeTierState() async -> FreeTierState? {
        guard let userId = await currentUserId() else { return nil }
        guard let client = getClient()?.client else { return nil }

        async let countTask = fetchImportCount(client: client, userId: userId)
        async let entitlementTask = fetchEntitlementActive(client: client, userId: userId)

        let (count, entitlement) = await (countTask, entitlementTask)
        return FreeTierState(importCount: count ?? 0, entitlementActive: entitlement ?? false)
    }

    private func currentUserId() async -> UUID? {
        guard let session = await auth.currentSession else { return nil }
        return session.user.id
    }

    private func fetchImportCount(client: Supabase.SupabaseClient, userId: UUID) async -> Int? {
        do {
            let rows: [DecodableIdRow] = try await client.from("property_imports")
                .select("id")
                .eq("user_id", value: userId.uuidString)
                .execute()
                .value
            return rows.count
        } catch {
            return nil
        }
    }

    private func fetchEntitlementActive(client: Supabase.SupabaseClient, userId: UUID) async -> Bool? {
        do {
            let rows: [SubscriptionStatusRow] = try await client.from("subscription_status")
                .select()
                .eq("user_id", value: userId.uuidString)
                .limit(1)
                .execute()
                .value
            return rows.first?.entitlement_active ?? false
        } catch {
            return false
        }
    }
}

private struct DecodableIdRow: Decodable { var id: UUID? }
