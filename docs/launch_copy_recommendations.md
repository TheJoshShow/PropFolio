# PropFolio — Launch Copy Recommendations

**Purpose:** Exact replacement copy so store and in-app claims match the MVP (no property list, no confidence/deal score UI).  
**Source:** release_blocker_report.md, feature_claims_gap_report.md, mvp_truthfulness_plan.md  
**Date:** 2025-03-12

---

## 1. In-app copy changes

| Location | File | Current | Recommended (MVP-honest) |
|----------|------|--------|---------------------------|
| **Home — Get started card body** | `app/(tabs)/index.tsx` | "Add a property by pasting a Zillow or Redfin link, or enter an address to analyze deals and see your confidence score." | "Add a property by pasting a Zillow or Redfin link, or enter an address to save it to your portfolio." |
| **Portfolio — empty state body** | `app/(tabs)/portfolio.tsx` | "Add a property from the Import tab to see it here and track your confidence score over time." | "Add a property from the Import tab to save it to your portfolio. List and analysis views are coming soon." |
| **Portfolio — subtitle** | `app/(tabs)/portfolio.tsx` | "Your saved properties and analyses." | "Your saved properties." |
| **Import — success alert (address)** | `app/(tabs)/import.tsx` | "You can see it in your Portfolio." | "Saved to your portfolio." |
| **Import — success alert (resumed after upgrade)** | `app/(tabs)/import.tsx` | "Thanks for upgrading—your property is in your Portfolio." | "Thanks for upgrading—your property has been saved to your portfolio." |
| **Login — subtitle** | `app/(auth)/login.tsx` | "Sign in to sync your portfolio" | "Sign in to save and sync your properties" (optional; or keep as-is if "sync" is read as background save only). |
| **Paywall — benefits** | `src/features/paywall/paywallCopy.ts` | "Compare and track properties in one place" | "Save and track properties as we add list and comparison" |
| **Paywall — benefits** | `src/features/paywall/paywallCopy.ts` | "Keep your saved properties and analysis together" | "Keep your saved properties in one place; analysis coming soon" |
| **Paywall — benefits** | `src/features/paywall/paywallCopy.ts` | "Unlock scoring and insights as we add them" | **Keep as-is.** (Already honest.) |

---

## 2. App Store Connect (recommended)

- **Subtitle (≤30 chars):**  
  "Add and save rental properties" or "Property saving & analysis tools"  
  Avoid: "Confidence score" / "Deal score" until those UIs ship.

- **Description (summary):**  
  - Emphasize: add properties (link or address), save to your portfolio, free tier (2 imports) then Pro for unlimited, sign-in and account deletion, restore purchases.  
  - Do **not** promise: "see confidence score," "deal score," "analyze deals in-app," or "view analyses" until the app shows them.  
  - Optional line: "More features—including property list, detail view, and scoring—coming in updates."

- **Keywords:**  
  Avoid promising "confidence score" or "deal score" in keywords if the app does not show them.

- **Promotional text:**  
  Same rule: no confidence/deal score or in-app analysis unless shipped.

---

## 3. Paywall subheadline (optional tweak)

Current: "You've used your 2 free imports. Upgrade to continue importing, comparing, and evaluating properties in PropFolio."

- **Recommended:**  
  "You've used your 2 free imports. Upgrade to continue saving properties and unlock unlimited imports."  
  (Removes "comparing" and "evaluating" until list/detail/score exist.)

---

## 4. Implementation notes

- Apply in-app changes in the files listed; no new screens or routes.
- After applying, re-check feature_claims_gap_report.md to ensure no remaining overclaims.
- When property list + detail + score are shipped, update this doc and reintroduce "confidence score" / "deal score" / "analyze deals" where accurate.
