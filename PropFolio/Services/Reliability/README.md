# Reliability

Production reliability for import and analysis: logging, retry, rate limiting.

- **StructuredLogger** — `ImportLogger`, `AnalysisLogger` (OSLog; filter Console by subsystem `com.propfolio`).
- **RetryPolicy** — Configurable retries with backoff; use `execute` or `executeAdapter` for provider calls.
- **RequestCoordinator** — Actor; call `throttle(category:work:)` before expensive provider calls to respect min interval.

See **docs/RELIABILITY-AND-COST.md** for how this reduces API cost and token spend.
