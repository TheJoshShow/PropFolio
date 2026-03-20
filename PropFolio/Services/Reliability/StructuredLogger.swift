//
//  StructuredLogger.swift
//  PropFolio
//
//  Structured logging for import and analysis. Use for failures, cache hits, retries, fallbacks.
//  Reduces blind retries and token spend by making issues visible in Console.
//

import Foundation
import os.log

/// Log subsystem for PropFolio (Console filter: subsystem:com.propfolio).
private let subsystem = "com.propfolio"

/// Import flow: parse, fetch, cache, fallback, rate limit, retry.
enum ImportLogger {
    private static let log = OSLog(subsystem: subsystem, category: "import")

    static func parseFailed(input: String, error: URLParseError) {
        os_log(.error, log: log, "parse_failed input_length=%{public}d error=%{public}@", input.count, String(describing: error))
    }

    static func cacheHit(key: String) {
        os_log(.info, log: log, "cache_hit key=%{public}@", key)
    }

    static func cacheMiss(key: String) {
        os_log(.debug, log: log, "cache_miss key=%{public}@", key)
    }

    static func fetchFailed(source: String, error: AdapterError) {
        os_log(.error, log: log, "fetch_failed source=%{public}@ error=%{public}@", source, String(describing: error))
    }

    static func fallbackUsed(primary: String, fallback: String) {
        os_log(.info, log: log, "fallback_used primary=%{public}@ fallback=%{public}@", primary, fallback)
    }

    static func rateLimited(source: String, retryAfter: TimeInterval?) {
        os_log(.default, log: log, "rate_limited source=%{public}@ retry_after=%{public}@", source, retryAfter.map { "\($0)s" } ?? "nil")
    }

    static func retry(attempt: Int, maxAttempts: Int, source: String, error: String) {
        os_log(.default, log: log, "retry attempt=%d max=%d source=%{public}@ error=%{public}@", attempt, maxAttempts, source, error)
    }

    static func importSucceeded(source: String, key: String, fromCache: Bool) {
        os_log(.info, log: log, "import_succeeded source=%{public}@ key=%{public}@ from_cache=%{public}@", source, key, fromCache ? "true" : "false")
    }

    static func noAdapterAvailable() {
        os_log(.error, log: log, "no_adapter_available")
    }

    /// After all retries exhausted; reason is the final error description.
    static func importFailedFinal(key: String, reason: String) {
        os_log(.error, log: log, "import_failed_final key=%{public}@ reason=%{public}@", key, reason)
    }
}

/// Analysis pipeline: insufficient data, engine failure, future backend errors.
enum AnalysisLogger {
    private static let log = OSLog(subsystem: subsystem, category: "analysis")

    static func insufficientData(reason: String, propertyId: String?) {
        os_log(.default, log: log, "insufficient_data reason=%{public}@ property_id=%{public}@", reason, propertyId ?? "nil")
    }

    static func engineFailed(engine: String, error: String) {
        os_log(.error, log: log, "engine_failed engine=%{public}@ error=%{public}@", engine, error)
    }

    static func analysisCompleted(propertyId: String?, hasScore: Bool, hasConfidence: Bool) {
        os_log(.info, log: log, "analysis_completed property_id=%{public}@ has_score=%{public}@ has_confidence=%{public}@", propertyId ?? "nil", hasScore ? "true" : "false", hasConfidence ? "true" : "false")
    }
}
