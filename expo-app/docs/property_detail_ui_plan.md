# Property Detail — UI Plan (iPhone-First)

**Purpose:** Production-ready Property Detail screen structure, hierarchy, and UX rules.  
**Route:** Dedicated property detail from portfolio list → `/(tabs)/portfolio/[id]`.  
**Date:** 2026-03-18

---

## 1. Screen structure (top → bottom)

| Section | Content | UX notes |
|---------|--------|----------|
| **Navigation** | Back (chevron or "Back") | Min 44pt tap target; primary color. |
| **Hero** | Full address (street, unit, city, state, postal); one short summary sentence; deal score badge; confidence badge | Address = primary hierarchy; summary from analysis deal score explanation (one line); badges compact, no clutter. |
| **Score section** | Large deal score card (number + band label); confidence card (number + band); band labels; one-line disclaimer under scores | Clear visual hierarchy; score cards prominent; disclaimer small, muted. |
| **Key metrics grid** | Purchase price, estimated rent, monthly cash flow, cap rate, cash-on-cash return, DSCR | 2-column grid on phone; label + value; "—" when missing; estimated marked. |
| **Strengths** | Top 3 positive factors (from `strengthFlags`) | List with bullet; short labels; optional description. |
| **Risks / watch items** | Top 3 risk flags (from `riskFlags`) | Same treatment; severity can inform color (e.g. high = muted error). |
| **Assumptions** | List of assumptions with source (default / user / inferred / estimated) | Clearly mark "Estimated" or "Default"; builds trust. |
| **Footer** | Informational-use disclaimer; last updated timestamp | Muted text; allowFontScaling for accessibility. |

---

## 2. Visual hierarchy

- **Primary:** Full address, deal score number, confidence number.
- **Secondary:** Band labels, section titles (Score, Key metrics, Strengths, Risks, Assumptions).
- **Tertiary:** Metric labels, assumption values, disclaimer.
- **Spacing:** Consistent vertical rhythm (e.g. 16/20/24); section spacing larger than in-section spacing.
- **No clutter:** One concept per card; avoid redundant copy.

---

## 3. UX rules

- **Premium iPhone-native:** System-like typography (SF), safe areas, no custom-heavy chrome.
- **Strong hierarchy:** Size and weight distinguish primary vs secondary.
- **Accessible tap targets:** Back and any buttons ≥ 44pt.
- **Loading:** Skeleton (placeholder blocks for hero, score cards, metrics grid) instead of only spinner.
- **Empty/error:** Full-screen fallback with message + Back; no partial content.
- **Scroll performance:** Avoid heavy work in render; memoize derived data; ScrollView with contentContainerStyle.
- **Dynamic Type resilience:** Use theme fontSizes/lineHeights; allowFontScaling true where appropriate; test with larger text.

---

## 4. Data source

- **Analysis:** `runPropertyDetailAnalysis(input)` from `src/features/property-analysis` (simulation → confidence → deal score; uses existing engines).
- **Input:** Derived from property row (listPrice, rent, address) plus defaults inside the service (financing/expenses).
- **Memoization:** Compute analysis once per property id + row; store in state or useMemo keyed by id + row signature.
- **Graceful fallback:** Missing values show "—"; insufficientData shows band label and short explanation; no crash on null.

---

## 5. Copy and disclaimers

- **Score disclaimer (one-line):** e.g. "Scores are indicative only and do not guarantee future performance."
- **Footer disclaimer:** Full informational-use disclaimer (DISCLAIMER_COPY).
- **Last updated:** From property row `updated_at` or `fetched_at`; format e.g. "Last updated Jan 15, 2025".

---

## 6. Files

- **Route:** `app/(tabs)/portfolio/[id].tsx` (single screen component).
- **Data:** `getPropertyById` + `runPropertyDetailAnalysis` (service).
- **Copy:** Use score disclaimers from `propertyAnalysisCopy` (`SCORE_SURFACE_DISCLAIMER`, `DISCLAIMER_COPY`).
