# Portfolio Data Contract

**Purpose:** Contract for portfolio list data: Supabase row shape and list item shape for the UI.  
**Date:** 2026-03-18

---

## 1. Supabase: Property Row (API)

Properties are stored in the `properties` table. Client selects by `portfolio_id` (user's default portfolio).

| Field | Type | Source | Notes |
|-------|------|--------|--------|
| id | string (uuid) | DB | Primary key |
| portfolio_id | string (uuid) | DB | FK to portfolios |
| street_address | string | Import | |
| unit | string \| null | Import | |
| city | string | Import | |
| state | string | 2 chars | |
| postal_code | string | 5–10 chars | |
| country_code | string | Default 'US' | |
| list_price | number \| null | Import | |
| bedrooms | number \| null | Import | |
| bathrooms | number \| null | Import | |
| sqft | number \| null | Import | |
| data_source | string | e.g. 'manual' | |
| fetched_at | string (ISO) | Insert time | Use for "updated" if updated_at absent |
| created_at | string \| null | Supabase | If present |
| updated_at | string \| null | Supabase | If present |

| rent | number \| null | Import / user | Monthly rent (nullable). Stored on `properties` so list/detail can show and analyze. |

---

## 2. List Item (for UI)

Each list item is the property row plus client-computed analysis for badges and metrics.

| Field | Type | Source |
|-------|------|--------|
| id | string | property.id |
| streetAddress | string | property.street_address |
| unit | string \| null | property.unit |
| city | string | property.city |
| state | string | property.state |
| postalCode | string | property.postal_code |
| listPrice | number \| null | property.list_price |
| rent | number \| null | property.rent or null |
| bedrooms | number \| null | property.bedrooms |
| bathrooms | number \| null | property.bathrooms |
| sqft | number \| null | property.sqft |
| fetchedAt | string | property.fetched_at |
| updatedAt | string | property.updated_at ?? property.fetched_at |
| **displayedDealScore** | number \| null | From `runPropertyDetailAnalysis().dealScore.totalScore` |
| **dealBand** | DealScoreBand | From `runPropertyDetailAnalysis().dealScore.band` |
| **confidenceScore** | number | From `runPropertyDetailAnalysis().confidence.score` |
| **confidenceBand** | ConfidenceMeterBand | From `runPropertyDetailAnalysis().confidence.band` |
| **monthlyCashFlow** | number \| null | From `runPropertyDetailAnalysis().keyMetrics.monthlyCashFlow` |
| **estimatedRent** | number \| null | property.rent or null (show "—" when null) |

---

## 3. Property Detail Route

- **Route:** `/(tabs)/portfolio/[id]`
- **Input:** Property id (uuid) from list tap.
- **Data:** Fetch single property by id (and ensure portfolio belongs to user) or pass list item; run `runPropertyDetailAnalysis` (simulation → confidence → deal score) for full result (score breakdown, confidence explanation, metrics, flags, assumptions).

---

## 4. Error and Empty Semantics

| Case | List | Detail |
|------|------|--------|
| No portfolio | Empty list (0 properties) | N/A |
| No properties | Empty state: "No properties yet" + Add property | N/A |
| API error (network, 5xx) | Error message + Retry | Error message + Back |
| Offline | "You're offline" + Retry | "You're offline" + Back |
| Property not found (detail) | N/A | "Property not found" + Back |
| Missing images | No thumbnail; placeholder or icon | No hero image; placeholder or skip |
