//
//  RetryPolicy.swift
//  PropFolio
//
//  Simple retry with exponential backoff for transient failures. Use for provider calls.
//  Reduces unnecessary "user retry" and API cost from single transient blips.
//

import Foundation

/// Configurable retry for async operations that may fail transiently.
struct RetryPolicy: Sendable {
    let maxAttempts: Int
    let baseDelay: TimeInterval
    let maxDelay: TimeInterval
    let jitter: Bool

    /// Default: 3 attempts, 1s base, 30s cap, with jitter.
    static let `default` = RetryPolicy(maxAttempts: 3, baseDelay: 1, maxDelay: 30, jitter: true)

    /// Whether the error is worth retrying (network, 5xx, 429).
    static func isRetryable(_ error: AdapterError) -> Bool {
        switch error {
        case .networkError: return true
        case .rateLimited: return true
        case .invalidResponse: return false
        case .notFound, .authenticationFailed, .providerUnavailable: return false
        case .partialData: return false
        }
    }

    /// Optional retry-after from 429 (seconds).
    static func retryAfter(from error: AdapterError) -> TimeInterval? {
        if case .rateLimited(let after) = error { return after }
        return nil
    }

    /// Execute the operation with retries. Returns first success or last failure.
    func execute<T, E: Error>(
        operation: String,
        isRetryable: (E) -> Bool = { _ in true },
        retryAfter: ((E) -> TimeInterval?)? = nil,
        logger: ((Int, Int, String) -> Void)? = nil,
        work: () async -> Result<T, E>
    ) async -> Result<T, E> {
        var lastError: E?
        for attempt in 1...maxAttempts {
            let result = await work()
            switch result {
            case .success(let value):
                return .success(value)
            case .failure(let error):
                lastError = error
                if !isRetryable(error) || attempt == maxAttempts {
                    return .failure(error)
                }
                let override = retryAfter?(error)
                let delay = delayBeforeAttempt(attempt, rateLimitOverride: override)
                logger?(attempt, maxAttempts, String(describing: error))
                try? await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
            }
        }
        if let e = lastError { return .failure(e) }
        fatalError("RetryPolicy.execute invariant")
    }

    /// Execute with AdapterError (convenience for provider calls).
    func executeAdapter<T>(
        operation: String,
        logger: ((Int, Int, String) -> Void)? = nil,
        work: () async -> Result<T, AdapterError>
    ) async -> Result<T, AdapterError> {
        await execute(
            operation: operation,
            isRetryable: Self.isRetryable,
            retryAfter: Self.retryAfter,
            logger: logger,
            work: work
        )
    }

    private func delayBeforeAttempt(_ attempt: Int, rateLimitOverride: TimeInterval?) -> TimeInterval {
        if let override = rateLimitOverride, override > 0 { return min(override, maxDelay) }
        let exp = baseDelay * pow(2.0, Double(attempt - 1))
        var d = min(exp, maxDelay)
        if jitter { d *= (0.8 + Double.random(in: 0...0.2)) }
        return d
    }
}
