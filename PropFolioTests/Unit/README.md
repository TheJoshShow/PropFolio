# Unit Tests

**What belongs here:** Unit tests for Engine, Services, and ViewModels. **Folder names mirror source:** Unit/Engine/, Unit/Services/.

- **Unit/Engine/:** UnderwritingTests — golden master and edge-case tests for every calculator (NOI, cap rate, etc.); rounding tests.
- **Unit/Services/:** PropertyDataTests, MarketIntelligenceTests — parser tests (URLs), normalizer tests, adapter behavior (with mocks).
- **ViewModel tests:** State changes and service calls (mock services); can live in Unit/ or a ViewModels/ subfolder.

Tests must be deterministic and fast. Use mocks from Mocks/ for services.
