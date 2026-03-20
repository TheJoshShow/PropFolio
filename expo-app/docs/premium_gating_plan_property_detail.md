# Premium Gating Plan — Property Detail

## Principle

- **Free:** Enough to answer "Should I look at this property?" — basic score, band, and key metrics.
- **Premium:** Deeper explanation, comparison tools, and advanced scenarios (future).

## Free (visible to all)

- **Hero:** Address, short deal summary sentence, deal/confidence badges.
- **Score cards:** Overall deal score (0–100 or —), deal band label; overall confidence score, confidence band label.
- **Cap note:** When score is capped by confidence (one-line explanation).
- **Score disclaimer:** One-line "indicative only" disclaimer.
- **Deal summary line:** Single-sentence deal summary under the cards.
- **Key metrics grid:** Purchase price, est. rent, monthly cash flow, cap rate, cash-on-cash, DSCR.
- **Strengths:** Top strengths (e.g. first 3).
- **Risks & watch items:** Top risks (e.g. first 3).
- **Assumptions:** List with (estimated) / (default) labels.
- **Footer:** General disclaimer and last updated.

Free users can see the score and band and key numbers; they do not get the full factor breakdown or the "About these scores" accordion unless they unlock.

## Premium (Pro only)

- **Factor breakdown:** The expandable "Factor breakdown" section (intro + per-factor explanations). Free users see the section header; tap opens paywall (or lock CTA then paywall).
- **About these scores accordion:** The three expandable items ("How the score is calculated", "Which fields are estimated", "Why the score may be capped"). Free users see the section title and item headers; tap opens paywall (or lock CTA then paywall).

Optional future (not in scope for this implementation):

- Compare tools (e.g. compare two properties).
- Advanced scenarios (e.g. multiple financing or rent scenarios).

## Implementation

- Use `useSubscription().hasProAccess` to decide whether to expand content or show paywall.
- When a free user taps a premium section (factor breakdown header or any accordion header): track `premium_lock_viewed` with `metadata: { section: 'factor_breakdown' | 'about_scores_accordion' }`, then `router.push('/paywall')`. On purchase or restore success, paywall calls `router.back()` so the user returns to the same property detail screen.
- Do not set `pendingImport` when opening paywall from property detail; import resume flow is only for the import screen.

## Preserved flows

- **Import resume:** When user hits import limit, import screen sets `pendingImport` and opens paywall. After purchase, import screen runs the pending import and clears it. Opening paywall from property detail does not touch `pendingImport`.
- **Post-purchase resume:** After purchase (or restore), paywall screen calls `router.back()`. User returns to the previous screen (property detail or import). No change to this behavior.
