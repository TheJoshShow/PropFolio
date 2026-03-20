# Property Detail & Portfolio — Analytics Event Map

Events are sent to `usage_events` (Supabase) via `trackEvent()` when the user is authenticated. All event names and optional metadata are defined here for consistency.

## Events

| Event name | When fired | Optional metadata | Notes |
|------------|------------|-------------------|--------|
| **portfolio_list_viewed** | User sees the portfolio list (tab loaded, list rendered after load). | `listCount: number` | Fire once when loading is false and list is shown (including empty). |
| **property_detail_viewed** | User lands on a property detail screen. | `propertyId: string` (optional; avoid PII in logs) | Fire once on mount when analysis is available. |
| **score_explanation_opened** | User expands the "Factor breakdown" section. | — | Fire when `expandedDealBreakdown` becomes true (first expand). |
| **confidence_explanation_opened** | User expands the "Confidence explained" / "What confidence means" section. | — | Fire when user opens the expandable confidence block. |
| **low_confidence_warning_shown** | Property detail is shown and confidence band is medium, low, or veryLow (so "Recommended next steps" is visible). | `confidenceBand: string` | Fire once when detail is rendered with low confidence. |
| **premium_lock_viewed** | User taps a gated section (factor breakdown or "About these scores" accordion) and does not have Pro; we show paywall or lock CTA. | `section: 'factor_breakdown' \| 'about_scores_accordion'` | Do not log user id or PII. |

## Implementation notes

- **portfolio_list_viewed**: In portfolio list screen, `useEffect` when `!loading` (and optionally when list is displayed). Include `listCount` in metadata for usage.
- **property_detail_viewed**: In property detail screen, `useEffect` once when `analysisResult` is set (success path). Can omit `propertyId` from metadata if policy is to avoid storing property ids in events; otherwise use `resourceType: 'property'` and `metadata: { propertyId: id }` for server-side only.
- **score_explanation_opened**: When toggling factor breakdown from collapsed to expanded; track once per open (or per session, product choice).
- **confidence_explanation_opened**: When user expands the confidence explanation block (if implemented as expandable).
- **low_confidence_warning_shown**: When rendering property detail and `showRecommendedActionsForConfidence(confidenceBand)` is true; fire once per detail view.
- **premium_lock_viewed**: When a free user taps a premium-gated section and the app navigates to paywall (or shows a lock modal). Preserve import resume and post-purchase resume: opening paywall from detail uses `router.push('/paywall')`; on purchase success paywall calls `router.back()` so user returns to detail. Do not set `pendingImport` when opening from detail.

## Safe metadata keys (dev logs)

For `[Analytics]` dev logs, only these metadata keys are allowed (no PII): `source`, `planId`, `packageIdentifier`, `outcome`, `resumed`, `blocked`, `planType`, `section`, `listCount`, `confidenceBand`.
