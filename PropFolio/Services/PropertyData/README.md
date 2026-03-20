# Services / PropertyData

**What belongs here:** Property ingestion, normalization, and caching.

- **Parsers:** Zillow URL, Redfin URL → listing ID + optional address.
- **Normalizers:** Address normalization (USPS-style); property field normalization.
- **Adapters:** Wrap external APIs (Zillow, Redfin, etc.); return normalized data with source, timestamp, confidence.
- **PropertyDataService:** Orchestrates fetch → normalize → cache; exposes one API to the app.
- **Caching:** Store normalized property by key; avoid duplicate network calls.

All fetched values must include source, timestamp, and confidence. Support partial-result fallback.
