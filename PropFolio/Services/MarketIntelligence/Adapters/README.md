# MarketIntelligence/Adapters

**What belongs here:** All third-party market data integrations (Census, BLS, Realtor.com, etc.).

- Implementations of the market-signal adapter protocol.
- Each adapter returns signals with source, date range, and confidence.
- **Rule:** The rest of the app calls only `MarketIntelligenceService`. This folder is used only by MarketIntelligenceService. No UI or ViewModels should import adapters directly.
