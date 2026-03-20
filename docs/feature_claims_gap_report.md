# PropFolio — Feature Claims vs. Shipped Experience Gap Report

**Source of truth:** release_blocker_report.md  
**Scope:** Property import, portfolio save flow, scoring, confidence display, deal score display, property detail visibility, subscription value proposition.  
**Date:** 2025-03-12

---

## 1. Claims that imply in-app confidence/deal scoring exists today

| # | Claim | Location | Exact or paraphrased text |
|---|--------|----------|----------------------------|
| 1 | User can see a confidence score in-app | Home (Get started card) | "Add a property by pasting a Zillow or Redfin link, or enter an address to **analyze deals and see your confidence score**." |
| 2 | User can track confidence score over time | Portfolio (empty state) | "Add a property from the Import tab to **see it here and track your confidence score over time**." |
| 3 | User can see saved property in Portfolio | Import success alert | "You can **see it in your Portfolio**." / "your property is **in your Portfolio**." |
| 4 | Portfolio shows saved properties and analyses | Portfolio tab | Subtitle: "**Your saved properties and analyses**." Empty body implies properties will appear here. |
| 5 | Sign-in syncs a viewable portfolio | Login | "**Sign in to sync your portfolio**." |
| 6 | Compare and track properties in one place | Paywall (benefits) | "**Compare and track properties in one place**." |
| 7 | Keep saved properties and analysis together | Paywall (benefits) | "**Keep your saved properties and analysis together**." |

**Additional implied claims (softer):**

| # | Claim | Location | Notes |
|---|--------|----------|--------|
| 8 | Deal analysis exists in-app | Home | "analyze **deals**" implies deal-level analysis (e.g. deal score) is available. |
| 9 | Analyses exist in-app | Portfolio subtitle | "saved properties and **analyses**" implies analysis UI per property. |
| 10 | Subscription unlocks scoring/insights | Paywall | "**Unlock scoring and insights as we add them**" — honest (future); no false claim. |

---

## 2. Current build behavior (verification)

| Area | What exists | What does not exist |
|------|-------------|----------------------|
| **Property import** | Paste link (redirects to address) or enter address → geocode + optional rent estimate → `recordPropertyImportEnforced` → insert into `properties` table, RPC `record_property_import`. Success alert; no navigation to property. | Full link-based import (Zillow/Redfin scrape); no post-import navigation to detail. |
| **Portfolio save flow** | Import writes to Supabase: default portfolio, property row (address, list_price, bedrooms, bathrooms, sqft, etc.). Import count and free limit enforced. | Portfolio tab **does not** fetch or list properties. Always shows empty state. User cannot "see" saved properties in-app. |
| **Scoring (deal / confidence)** | Logic in `src/lib`: `dealScoringEngine`, `confidenceMeterEngine`, `dealScoreInputsFromSimulation`, `confidenceMeterCopy`. Unit tests present. | **No UI** consumes these. No screen shows a deal score or confidence score. |
| **Confidence display** | None. | No confidence meter, band, or score on any screen. |
| **Deal score display** | None. | No deal score, band, or breakdown on any screen. |
| **Property detail visibility** | None. | No property detail screen. No route `portfolio/[id]`. User cannot open a saved property. |
| **Subscription value** | Paywall: unlimited imports, "Compare and track," "Keep saved properties and analysis together," "Unlock scoring and insights as we add them." Restore, manage subscription, billing copy. | "Compare/track in one place" and "analysis together" are not fulfilled: no list, no detail, no analysis UI. "Scoring as we add them" is accurate (future). |

**Conclusion:**  
- Claims 1, 2, 3, 4, 5, 6, 7, 8, 9 are **not** fulfilled by the current build in the way a user would interpret them.  
- Claim 10 is honest and does not require change.

---

## 3. Summary table: claim vs. build

| Claim | Fulfilled? | Gap |
|-------|------------|-----|
| Analyze deals and see your confidence score | No | No deal or confidence UI. |
| See it here and track your confidence score over time | No | No property list; no score UI. |
| See it in your Portfolio / property is in your Portfolio | Partially | Data is saved; Portfolio does not show list. |
| Your saved properties and analyses | No | No list; no analyses UI. |
| Sign in to sync your portfolio | Partially | Data syncs (save); user never sees list. |
| Compare and track properties in one place | No | No list or comparison UI. |
| Keep your saved properties and analysis together | No | No list or analysis UI. |
| Unlock scoring and insights as we add them | Yes | Copy is forward-looking; no overclaim. |

---

## 4. Store copy and marketing (external)

- **app.json:** No App Store description or subtitle (those live in App Store Connect).
- **final_metadata_requirements.md:** Recommends subtitle e.g. "Property investment analysis" (≤30 chars) and "Must not overpromise; align with shipped features."
- **Recommendation:** Any App Store subtitle, description, or promotional text must **not** promise "confidence score," "deal score," or "analyze deals" in-app unless the app actually shows them. Prefer: "Add and save properties; track your portfolio" or similar until either (A) minimal property detail + score is shipped or (B) copy is limited to what MVP does.

---

## 5. References

- release_blocker_report.md § Scoring and analysis, § Severity 3
- expo-app/app/(tabs)/index.tsx (Home card body)
- expo-app/app/(tabs)/portfolio.tsx (empty state, subtitle)
- expo-app/app/(tabs)/import.tsx (success alerts)
- expo-app/app/(auth)/login.tsx (subtitle)
- expo-app/src/features/paywall/paywallCopy.ts (benefits)
- expo-app/src/services/importLimits.ts (property insert, no list query)
- expo-app/src/lib/scoring, expo-app/src/lib/confidence (logic only; no UI)

---

*Next: mvp_truthfulness_plan.md (Path A vs B), launch_copy_recommendations.md, property_detail_mvp_spec.md.*
