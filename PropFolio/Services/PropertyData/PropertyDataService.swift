//
//  PropertyDataService.swift
//  PropFolio
//
//  Orchestrates: parse → cache (idempotent) → throttle → retry → fetch → normalize.
//  Cache + idempotency: same URL or same normalized address within TTL returns cached result (no duplicate provider call).
//

import Foundation

/// High-level errors for the import flow.
enum PropertyImportError: Error, Sendable {
    case parseFailed(URLParseError)
    case fetchFailed(AdapterError)
    case noAdapterAvailable
}

/// Single entry point for property import. Cache-first, rate-limit aware, retry and fallback.
struct PropertyDataService: Sendable {
    private let inputParser = ImportInputParser()
    private let addressNormalizer = AddressNormalizer()
    private let propertyNormalizer = PropertyNormalizer()
    private let cache: PropertyImportCache
    private let adapters: [PropertyDataAdapter]
    private let fallbackAdapter: PropertyDataAdapter?
    private let requestCoordinator: RequestCoordinator?
    private let retryPolicy: RetryPolicy

    init(
        cache: PropertyImportCache = InMemoryPropertyImportCache(),
        zillow: PropertyDataAdapter,
        redfin: PropertyDataAdapter,
        fallbackAdapter: PropertyDataAdapter? = MockPropertyAdapter(),
        requestCoordinator: RequestCoordinator? = nil,
        retryPolicy: RetryPolicy = .default
    ) {
        self.cache = cache
        self.adapters = [zillow, redfin]
        self.fallbackAdapter = fallbackAdapter
        self.requestCoordinator = requestCoordinator
        self.retryPolicy = retryPolicy
    }

    /// Shared cache so all import paths (flow VM, address VM, etc.) share the same cache and avoid duplicate fetches.
    private static let sharedImportCache: PropertyImportCache = InMemoryPropertyImportCache()

    /// Build service with app config; uses **shared** cache, shared coordinator, and default retry. Same cache across all callers.
    static func withAppConfiguration(
        cache: PropertyImportCache? = nil,
        requestCoordinator: RequestCoordinator? = RequestCoordinator.shared,
        retryPolicy: RetryPolicy = .default
    ) -> PropertyDataService {
        let zillow = ZillowAdapter(apiKey: AppConfiguration.zillowAPIKey)
        let redfin = RedfinAdapter(configured: AppConfiguration.isRedfinConfigured)
        return PropertyDataService(
            cache: cache ?? sharedImportCache,
            zillow: zillow,
            redfin: redfin,
            fallbackAdapter: MockPropertyAdapter(),
            requestCoordinator: requestCoordinator,
            retryPolicy: retryPolicy
        )
    }

    /// 1. Parse. 2. Cache lookup (idempotent: same key → return cached). 3. Throttle + retry + fetch. 4. Normalize.
    func importProperty(from input: String) async -> Result<PropertyImportResult, PropertyImportError> {
        switch inputParser.parse(input) {
        case .failure(let e):
            ImportLogger.parseFailed(input: input, error: e)
            return .failure(.parseFailed(e))
        case .success(let parsed):
            return await fetchAndNormalize(parsed)
        }
    }

    /// Autocomplete: return suggestions. Does not fetch full property.
    func suggestAddresses(query: String, provider: AddressAutocompleteProvider) async -> Result<[AddressSuggestion], AdapterError> {
        provider.suggest(query: query)
    }

    private func fetchAndNormalize(_ parsed: ParsedImportInput) async -> Result<PropertyImportResult, PropertyImportError> {
        switch parsed {
        case .listing(let parsedURL):
            let cacheKey = PropertyCacheKey.listing(source: parsedURL.source, id: parsedURL.listingID)
            if let cached = cache.get(cacheKey) {
                ImportLogger.cacheHit(key: cacheKey.logDescription)
                let withMeta = PropertyImportResult(property: cached.property, rawRecords: cached.rawRecords, fromCache: true, importSource: parsedURL.source.rawValue)
                ImportLogger.importSucceeded(source: parsedURL.source.rawValue, key: cacheKey.logDescription, fromCache: true)
                return .success(withMeta)
            }
            ImportLogger.cacheMiss(key: cacheKey.logDescription)
            let result = await doThrottledAndRetry(category: .propertyFetch) {
                await fetchByListing(parsedURL)
            }
            if case .success(var r) = result {
                r.fromCache = false
                r.importSource = parsedURL.source.rawValue
                cache.set(cacheKey, value: r)
                ImportLogger.importSucceeded(source: parsedURL.source.rawValue, key: cacheKey.logDescription, fromCache: false)
                return .success(r)
            }
            ImportLogger.importFailedFinal(key: cacheKey.logDescription, reason: String(describing: result))
            return result

        case .address(let partial, _):
            let normalized = addressNormalizer.normalize(partial)
            let cacheKey = PropertyCacheKey.address(addressNormalizer.cacheKey(for: normalized))
            if let cached = cache.get(cacheKey) {
                ImportLogger.cacheHit(key: cacheKey.logDescription)
                let withMeta = PropertyImportResult(property: cached.property, rawRecords: cached.rawRecords, fromCache: true, importSource: "address")
                ImportLogger.importSucceeded(source: "address", key: cacheKey.logDescription, fromCache: true)
                return .success(withMeta)
            }
            ImportLogger.cacheMiss(key: cacheKey.logDescription)
            let result = await doThrottledAndRetry(category: .propertyFetch) {
                await fetchByAddress(normalized, source: .manual)
            }
            if case .success(var r) = result {
                r.fromCache = false
                r.importSource = "address"
                cache.set(cacheKey, value: r)
                ImportLogger.importSucceeded(source: "address", key: cacheKey.logDescription, fromCache: false)
                return .success(r)
            }
            ImportLogger.importFailedFinal(key: cacheKey.logDescription, reason: String(describing: result))
            return result
        }
    }

    private func doThrottledAndRetry(category: RequestCategory, work: @escaping () async -> Result<PropertyImportResult, PropertyImportError>) async -> Result<PropertyImportResult, PropertyImportError> {
        let run: () async -> Result<PropertyImportResult, PropertyImportError> = {
            await work()
        }
        if let coordinator = requestCoordinator {
            return await coordinator.throttle(category: category) {
                await self.runWithRetry(run)
            }
        }
        return await runWithRetry(run)
    }

    private func runWithRetry(_ work: @escaping () async -> Result<PropertyImportResult, PropertyImportError>) async -> Result<PropertyImportResult, PropertyImportError> {
        await retryPolicy.execute(
            operation: "import",
            isRetryable: { err in
                if case .fetchFailed(let e) = err { return RetryPolicy.isRetryable(e) }
                return false
            },
            retryAfter: { err in
                if case .fetchFailed(let e) = err { return RetryPolicy.retryAfter(from: e) }
                return nil
            },
            logger: { attempt, maxAttempts, err in
                ImportLogger.retry(attempt: attempt, maxAttempts: maxAttempts, source: "property", error: err)
            },
            work: work
        )
    }

    private func fetchByListing(_ parsed: ParsedListingURL) async -> Result<PropertyImportResult, PropertyImportError> {
        let primary = adapters.first { $0.source == parsed.source && $0.isAvailable }
        var lastError: AdapterError = .providerUnavailable
        if let adapter = primary {
            let result = await adapter.fetchProperty(id: parsed.listingID)
            if case .success(let raw) = result { return .success(toResult(raw)) }
            if case .failure(let e) = result {
                lastError = e
                if case .rateLimited = e { ImportLogger.rateLimited(source: adapter.source.rawValue, retryAfter: RetryPolicy.retryAfter(from: e)) }
                ImportLogger.fetchFailed(source: adapter.source.rawValue, error: e)
            }
        }
        if let fallback = fallbackAdapter {
            ImportLogger.fallbackUsed(primary: parsed.source.rawValue, fallback: fallback.source.rawValue)
            let result = await fallback.fetchProperty(id: parsed.listingID)
            if case .success(let raw) = result { return .success(toResult(raw)) }
        }
        return .failure(.fetchFailed(lastError))
    }

    private func fetchByAddress(_ address: NormalizedAddress, source: DataSource) async -> Result<PropertyImportResult, PropertyImportError> {
        for adapter in adapters where adapter.isAvailable {
            let result = await adapter.fetchByAddress(address)
            if case .success(let raw) = result { return .success(toResult(raw)) }
            if case .failure(let e) = result {
                if case .rateLimited = e { ImportLogger.rateLimited(source: adapter.source.rawValue, retryAfter: RetryPolicy.retryAfter(from: e)) }
                ImportLogger.fetchFailed(source: adapter.source.rawValue, error: e)
            }
        }
        if let fallback = fallbackAdapter {
            ImportLogger.fallbackUsed(primary: "address_adapters", fallback: fallback.source.rawValue)
            let result = await fallback.fetchByAddress(address)
            if case .success(let raw) = result { return .success(toResult(raw)) }
        }
        ImportLogger.noAdapterAvailable()
        return .failure(.noAdapterAvailable)
    }

    private func toResult(_ raw: RawPropertyData) -> PropertyImportResult {
        let property = propertyNormalizer.normalize(raw)
        let record = RawSourceRecord(
            source: raw.source,
            externalID: raw.externalID,
            rawPayload: raw.rawPayload,
            fetchedAt: raw.fetchedAt
        )
        return PropertyImportResult(property: property, rawRecords: [record], fromCache: nil, importSource: raw.source.rawValue)
    }
}
