# Usage tracking

Events for analytics and usage-based pricing. Stored in `public.usage_events` (Supabase).

- **UsageEventSchema.swift** — Event types, resource types, metadata structs, and `UsageEventInsert` DTO.
- **UsageTrackingService.swift** — `UsageTrackingProviding` implementation; sends when authenticated. `UsageTrackingService.shared` for app; `NoOpUsageTracker()` for tests.

See **docs/USAGE-EVENTS-AND-MONETIZATION.md** for full schema, instrumentation map, and pricing-plan notes.
