# Mocks

**What belongs here:** Test doubles for services and dependencies.

- **MockPropertyDataService:** Returns fixed NormalizedProperty or error for testing.
- **MockMarketIntelligenceService:** Returns fixed signals / future value for testing.
- **MockSyncService:** No network; returns in-memory portfolio for testing.
- **MockUnderwritingEngine:** Optional; or use real engine in tests (preferred for formulas).

Use in unit tests and previews. Keep mocks in sync with service protocols.
