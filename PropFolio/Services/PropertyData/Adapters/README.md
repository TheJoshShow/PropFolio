# PropertyData/Adapters

**What belongs here:** All third-party property data integrations. No API calls to Zillow, Redfin, or similar outside this folder.

- Implementations of the property-data adapter protocol (e.g. ZillowAdapter, RedfinAdapter).
- Each adapter returns normalized data with source, timestamp, and confidence.
- **Rule:** The rest of the app calls only `PropertyDataService`. This folder is used only by PropertyDataService (or its internals). No UI or ViewModels should import adapters directly.
