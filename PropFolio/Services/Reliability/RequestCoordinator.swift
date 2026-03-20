//
//  RequestCoordinator.swift
//  PropFolio
//
//  Rate-limit aware request orchestration: min interval between calls and optional max concurrency.
//  Reduces 429s and duplicate expensive provider calls.
//

import Foundation

/// Category for rate limiting (e.g. one limit for property fetch, one for autocomplete).
enum RequestCategory: String, Sendable, CaseIterable {
    case propertyFetch = "property_fetch"
    case autocomplete = "autocomplete"
    case marketData = "market_data"
    case rentEstimate = "rent_estimate"
}

/// Coordinates outgoing requests so we don't burst past provider limits.
actor RequestCoordinator {
    private var lastRequestTime: [RequestCategory: Date] = [:]
    private var minInterval: [RequestCategory: TimeInterval]

    static let shared = RequestCoordinator(minIntervals: defaultMinIntervals)

    init(minIntervals: [RequestCategory: TimeInterval] = RequestCoordinator.defaultMinIntervals) {
        self.minInterval = minIntervals
    }

    static var defaultMinIntervals: [RequestCategory: TimeInterval] {
        [
            .propertyFetch: 0.5,
            .autocomplete: 0.3,
            .marketData: 1.0,
            .rentEstimate: 0.5,
        ]
    }

    /// Wait if needed to respect min interval, then run the task. Call this before each provider call.
    func throttle<T>(category: RequestCategory, work: () async throws -> T) async rethrows -> T {
        await waitIfNeeded(category: category)
        let result = try await work()
        recordRequest(category: category)
        return result
    }

    private func waitIfNeeded(category: RequestCategory) async {
        let interval = minInterval[category] ?? 0.5
        let last = lastRequestTime[category]
        if let last = last {
            let elapsed = Date().timeIntervalSince(last)
            if elapsed < interval {
                try? await Task.sleep(nanoseconds: UInt64((interval - elapsed) * 1_000_000_000))
            }
        }
    }

    private func recordRequest(category: RequestCategory) {
        lastRequestTime[category] = Date()
    }
}
