## PropFolio – User‑Facing Claims Inventory

This file catalogs key promises and claims made in‑app and in docs so marketing and product can keep them accurate and non‑misleading.

### 1. Core product promise

- **“Should I buy this property?”**
  - Location: Home screen subtitle, roadmap docs.
  - Meaning: The app helps users evaluate investment properties using standard underwriting metrics, a deal score, and a confidence meter. It does not guarantee outcomes.
- **“Help buyers feel confident they will make money on an investment property.”**
  - Location: `PROPFOLIO-ROADMAP.md` (primary promise).
  - Interpretation: Confidence in the decision‑making process, not a guarantee of profit.

### 2. Scoring and analysis

- **“0–100 deal score plus a confidence score”**
  - Location: Technical overview and scoring docs.
  - Backed by: Deterministic, unit‑tested formulas in underwriting and scoring engines.
  - Guardrails: Confidence caps the deal score when data is thin; docs clearly separate “deal score” from “confidence.”
- **“Deterministic math; no AI used for financial calculations.”**
  - Location: Technical overview, scoring docs, global rules.
  - Backed by: All numeric logic lives in TypeScript underwriting/scoring modules; AI is used only for summaries/explanations via `openai-summarize`.

### 3. Free‑to‑paid and gating

- **“Free users get exactly 2 successful property imports.”**
  - Location: Import screen comments and docs.
  - Backed by: `FREE_IMPORT_LIMIT = 2`, server‑authoritative trigger on `property_imports`, and `record_property_import` RPC.
- **“3rd import blocked and shows paywall.”**
  - Location: Import screen copy and implementation docs.
  - Backed by: `blocked_upgrade_required` status from RPC, Import screen alert + paywall navigation.
- **“Unlimited property imports (Pro)” / “Unlimited property analysis”**
  - Location: Paywall copy benefits and headline.
  - Interpretation: No app‑level hard cap on imports while `entitlement_active` is true; external provider limits and downtime may still apply.

### 4. Efficiency and value messaging

- **“Compare more deals with confidence.”**
  - Location: Paywall benefits.
  - Meaning: Pro removes the 2‑import cap so users can run more analyses using the existing scoring/confidence engines.
- **“Keep your saved analysis in one place.”**
  - Location: Paywall benefits and portfolio docs.
  - Backed by: Portfolio and saved analyses stored in Supabase; user can revisit prior deals and scenarios.

### 5. Future value and market context

- **“Future value predictor” / “Market context”**
  - Location: Roadmap and future‑value spec docs.
  - Status: Implemented as a deterministic engine backed by Census‑style data when configured; does not guarantee appreciation.
  - Softeners: Docs emphasize tailwinds/headwinds and stress scenarios rather than promises of specific price outcomes.

### 6. Subscriptions and billing

- **“Payment will be charged to your Apple ID or Google Play account. Subscriptions renew automatically unless cancelled at least 24 hours before the end of the current period. Manage subscriptions in your device settings.”**
  - Location: Paywall footer.
  - Backed by: Standard store subscription behavior and RevenueCat integration.
- **“You can resubscribe anytime from the paywall or when adding a property.”**
  - Location: Subscription status card copy.
  - Backed by: Paywall entry points from Import/Settings and entitlement check logic.

### 7. Where to review before marketing updates

When changing marketing language or App Store copy, cross‑check against:

- `docs/SCORING-AND-RATINGS-FORMULAS.md`
- `docs/DEAL-SCORING-SPEC.md`
- `docs/CONFIDENCE-METER-UX-COPY-GUIDELINES.md`
- `docs/FREE-TO-PAID-IMPLEMENTATION-SUMMARY.md`
- `docs/AUTH-FREE-TIER-PAYWALL-SUBSCRIPTION-GUIDE.md`

Ensure any new claims:

- Do not promise specific investment returns.
- Do not overstate data coverage or provider availability.
- Align with deterministic scoring and the current free/pro feature set.

