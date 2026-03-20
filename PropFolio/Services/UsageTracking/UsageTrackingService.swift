//
//  UsageTrackingService.swift
//  PropFolio
//
//  Records usage events for analytics and usage-based pricing. Sends to Supabase when authenticated.
//

import Foundation

/// Records usage events. When Supabase is configured and user is signed in, events are inserted into public.usage_events.
protocol UsageTrackingProviding: Sendable {
    func trackPropertyImport(source: String?, fromCache: Bool, hasListingId: Bool) async
    func trackAnalysisRun(propertyId: UUID?, hasScore: Bool, hasConfidence: Bool, source: String) async
    func trackSavedScenario(scenarioId: UUID?, name: String?, asBaseline: Bool) async
    func trackPortfolioSave(dealId: UUID?, propertyId: UUID?, status: String?) async
    func trackPremiumFeature(featureName: String, planRequired: String?) async
    func trackFutureValuePredictorCall(geographyZip: String?, geographyCountyFips: String?, geographyState: String?, fromCache: Bool) async
}

/// Default implementation: resolves user from auth, inserts into usage_events. No-op when not signed in or Supabase not configured.
final class UsageTrackingService: UsageTrackingProviding, @unchecked Sendable {
    private let auth: SupabaseAuthProviding
    private let getSupabaseClient: () -> SupabaseClient?

    init(auth: SupabaseAuthProviding = SupabaseAuthProviding(), getSupabaseClient: @escaping () -> SupabaseClient? = { SupabaseClient.instance }) {
        self.auth = auth
        self.getSupabaseClient = getSupabaseClient
    }

    func trackPropertyImport(source: String?, fromCache: Bool, hasListingId: Bool) async {
        await send(
            eventType: .propertyImport,
            resourceType: .property,
            metadata: .propertyImport(PropertyImportMetadata(source: source, fromCache: fromCache, hasListingId: hasListingId))
        )
    }

    func trackAnalysisRun(propertyId: UUID?, hasScore: Bool, hasConfidence: Bool, source: String) async {
        await send(
            eventType: .analysisRun,
            resourceType: .analysis,
            metadata: .analysisRun(AnalysisRunMetadata(
                propertyId: propertyId?.uuidString,
                hasScore: hasScore,
                hasConfidence: hasConfidence,
                source: source
            ))
        )
    }

    func trackSavedScenario(scenarioId: UUID?, name: String?, asBaseline: Bool) async {
        await send(
            eventType: .savedScenario,
            resourceType: .scenario,
            metadata: .savedScenario(SavedScenarioMetadata(
                scenarioId: scenarioId?.uuidString,
                name: name,
                asBaseline: asBaseline
            ))
        )
    }

    func trackPortfolioSave(dealId: UUID?, propertyId: UUID?, status: String?) async {
        await send(
            eventType: .portfolioSave,
            resourceType: .portfolioDeal,
            metadata: .portfolioSave(PortfolioSaveMetadata(
                dealId: dealId?.uuidString,
                propertyId: propertyId?.uuidString,
                status: status
            ))
        )
    }

    func trackPremiumFeature(featureName: String, planRequired: String?) async {
        await send(
            eventType: .premiumFeatureUsage,
            resourceType: .premiumFeature,
            metadata: .premiumFeature(PremiumFeatureMetadata(featureName: featureName, planRequired: planRequired))
        )
    }

    func trackFutureValuePredictorCall(geographyZip: String?, geographyCountyFips: String?, geographyState: String?, fromCache: Bool) async {
        await send(
            eventType: .futureValuePredictorCall,
            resourceType: .marketContext,
            metadata: .futureValuePredictor(FutureValuePredictorMetadata(
                geographyZip: geographyZip,
                geographyCountyFips: geographyCountyFips,
                geographyState: geographyState,
                fromCache: fromCache
            ))
        )
    }

    private func send(
        eventType: UsageEventType,
        resourceType: UsageResourceType?,
        metadata: UsageEventMetadataEncodable?
    ) async {
        guard let userId = await currentUserId() else { return }
        guard let supabase = getSupabaseClient()?.client else { return }
        let row = UsageEventInsert(userId: userId, eventType: eventType, resourceType: resourceType, metadata: metadata)
        do {
            try await supabase.from("usage_events").insert(row).execute()
        } catch {
            // Fire-and-forget; do not block UI. Optionally log to ImportLogger or OSLog.
            os_log(.default, log: OSLog(subsystem: "com.propfolio", category: "usage"), "usage_event insert failed: %{public}@", String(describing: error))
        }
    }

    private func currentUserId() async -> UUID? {
        guard let session = await auth.currentSession else { return nil }
        return session.user.id
    }
}

import os.log

// MARK: - No-op and shared

/// No-op implementation for tests or when tracking is disabled.
struct NoOpUsageTracker: UsageTrackingProviding, Sendable {
    func trackPropertyImport(source: String?, fromCache: Bool, hasListingId: Bool) async {}
    func trackAnalysisRun(propertyId: UUID?, hasScore: Bool, hasConfidence: Bool, source: String) async {}
    func trackSavedScenario(scenarioId: UUID?, name: String?, asBaseline: Bool) async {}
    func trackPortfolioSave(dealId: UUID?, propertyId: UUID?, status: String?) async {}
    func trackPremiumFeature(featureName: String, planRequired: String?) async {}
    func trackFutureValuePredictorCall(geographyZip: String?, geographyCountyFips: String?, geographyState: String?, fromCache: Bool) async {}
}

extension UsageTrackingService {
    /// Shared instance. Use for app-wide tracking; replace with NoOpUsageTracker in tests.
    static let shared: UsageTrackingProviding = UsageTrackingService()
}
