//
//  UsageEventSchema.swift
//  PropFolio
//
//  Event schema for analytics and usage-based pricing. Aligns with public.usage_events (event_type, resource_type, metadata).
//

import Foundation

/// Canonical event types. Stored in usage_events.event_type.
enum UsageEventType: String, Codable, CaseIterable, Sendable {
    case propertyImport = "property_import"
    case analysisRun = "analysis_run"
    case savedScenario = "saved_scenario"
    case portfolioSave = "portfolio_save"
    case premiumFeatureUsage = "premium_feature_usage"
    case futureValuePredictorCall = "future_value_predictor_call"
}

/// Optional resource classification for filtering/aggregation. Stored in usage_events.resource_type.
enum UsageResourceType: String, Codable, Sendable {
    case property
    case analysis
    case scenario
    case portfolioDeal = "portfolio_deal"
    case premiumFeature = "premium_feature"
    case marketContext = "market_context"
}

// MARK: - Metadata payloads (stored in usage_events.metadata JSONB)

/// property_import: source, from_cache, has_listing_id.
struct PropertyImportMetadata: Codable, Sendable {
    let source: String?
    let fromCache: Bool?
    let hasListingId: Bool?
    enum CodingKeys: String, CodingKey { case source, fromCache = "from_cache", hasListingId = "has_listing_id" }
}

/// analysis_run: property_id, has_score, has_confidence, source (e.g. "dashboard" | "portfolio").
struct AnalysisRunMetadata: Codable, Sendable {
    let propertyId: String?
    let hasScore: Bool?
    let hasConfidence: Bool?
    let source: String?
    enum CodingKeys: String, CodingKey { case propertyId = "property_id", hasScore = "has_score", hasConfidence = "has_confidence", source }
}

/// saved_scenario: scenario_id, name, as_baseline.
struct SavedScenarioMetadata: Codable, Sendable {
    let scenarioId: String?
    let name: String?
    let asBaseline: Bool?
    enum CodingKeys: String, CodingKey { case scenarioId = "scenario_id", name, asBaseline = "as_baseline" }
}

/// portfolio_save: deal_id, property_id, status.
struct PortfolioSaveMetadata: Codable, Sendable {
    let dealId: String?
    let propertyId: String?
    let status: String?
    enum CodingKeys: String, CodingKey { case dealId = "deal_id", propertyId = "property_id", status }
}

/// premium_feature_usage: feature_name, plan_required.
struct PremiumFeatureMetadata: Codable, Sendable {
    let featureName: String
    let planRequired: String?
    enum CodingKeys: String, CodingKey { case featureName = "feature_name", planRequired = "plan_required" }
}

/// future_value_predictor_call: geography (zip/county/state), from_cache.
struct FutureValuePredictorMetadata: Codable, Sendable {
    let geographyZip: String?
    let geographyCountyFips: String?
    let geographyState: String?
    let fromCache: Bool?
    enum CodingKeys: String, CodingKey {
        case geographyZip = "geography_zip", geographyCountyFips = "geography_county_fips",
             geographyState = "geography_state", fromCache = "from_cache"
    }
}

// MARK: - DTO for Supabase insert

/// Payload for public.usage_events insert. Encodable for Supabase client.
struct UsageEventInsert: Encodable, Sendable {
    let user_id: UUID
    let event_type: String
    let resource_type: String?
    let metadata: UsageEventMetadataEncodable?

    init(userId: UUID, eventType: UsageEventType, resourceType: UsageResourceType?, metadata: UsageEventMetadataEncodable?) {
        self.user_id = userId
        self.event_type = eventType.rawValue
        self.resource_type = resourceType?.rawValue
        self.metadata = metadata
    }
}

/// Encodable union of metadata types for usage_events.metadata JSONB.
enum UsageEventMetadataEncodable: Encodable, Sendable {
    case propertyImport(PropertyImportMetadata)
    case analysisRun(AnalysisRunMetadata)
    case savedScenario(SavedScenarioMetadata)
    case portfolioSave(PortfolioSaveMetadata)
    case premiumFeature(PremiumFeatureMetadata)
    case futureValuePredictor(FutureValuePredictorMetadata)

    func encode(to coder: Encoder) throws {
        switch self {
        case .propertyImport(let m): try m.encode(to: coder)
        case .analysisRun(let m): try m.encode(to: coder)
        case .savedScenario(let m): try m.encode(to: coder)
        case .portfolioSave(let m): try m.encode(to: coder)
        case .premiumFeature(let m): try m.encode(to: coder)
        case .futureValuePredictor(let m): try m.encode(to: coder)
        }
    }
}
