# Property Detail — Manual QA Checklist (iPhone)

Run on a physical iPhone or iOS simulator. Check each item for both **Free** and **Pro** accounts where relevant.

## Before you start

- [ ] App built and running (e.g. `npm run ios` or dev client).
- [ ] At least one saved property with **full data** (price, rent) and one with **minimal data** (e.g. price only, or price + rent only).
- [ ] Ability to toggle Pro (e.g. restore purchase or use sandbox).

---

## 1. Complete property (imported or full data)

- [ ] Open property detail for a property that has list price and rent.
- [ ] **Hero:** Address and one-line deal summary visible; badges show "Deal X/100" and "High/Medium/Low/Very low confidence".
- [ ] **Score cards:** Two cards — deal score (number or "—") with band label; confidence score with band label.
- [ ] **Cap note:** If confidence is low and raw score would be > 60, yellow cap note appears; otherwise no cap note.
- [ ] **Disclaimer:** One line below cards: "Scores are indicative only and do not guarantee future performance."
- [ ] **Deal summary line:** Same or similar summary sentence as hero.
- [ ] **Factor breakdown (Pro):** Tapping expands; intro text and factor list with labels + explanations. No blank or "undefined".
- [ ] **Factor breakdown (Free):** Tapping opens paywall (no expand).
- [ ] **Confidence explained:** Tapping expands "What confidence means" and, if applicable, "Recommended next steps". Collapse works.
- [ ] **Key metrics:** Purchase price, Est. rent, Monthly cash flow, Cap rate, Cash-on-cash, DSCR. Values or "—"; no crash.
- [ ] **Strengths / Risks:** If present, bullets and labels render; no "undefined".
- [ ] **Assumptions:** List with (default)/(estimated) where applicable.
- [ ] **About these scores (Pro):** All three accordion items open and show body copy.
- [ ] **About these scores (Free):** Tapping any item opens paywall.
- [ ] **Footer:** Disclaimer and "Last updated" (if available).

---

## 2. Sparse / minimal property

- [ ] Open a property with only price, or price + rent, no expenses.
- [ ] If rent missing: deal score "—", band "Insufficient data", risk "Insufficient data" present.
- [ ] If rent present but sparse: scores and metrics render; confidence may be lower; assumptions show defaults/estimated.
- [ ] No crash; no "undefined" in labels or copy.

---

## 3. Negative cash flow

- [ ] Use a property where rent is low and debt/expenses high (or create one).
- [ ] Monthly cash flow shows negative or zero.
- [ ] Risks include "Negative cash flow" (or equivalent).
- [ ] Deal score still 0–100; no NaN.

---

## 4. Premium gating

- [ ] **Free account:** Tap "Factor breakdown" → paywall opens; back returns to detail.
- [ ] **Free account:** Tap any "About these scores" item → paywall opens.
- [ ] **Pro account:** Factor breakdown and accordion expand and show content.
- [ ] After purchasing/restoring from paywall on detail, back returns to same property detail.

---

## 5. Offline and errors

- [ ] **Offline:** Turn off network; open property detail (or pull to refresh). Error state with message; Back/Retry; no crash.
- [ ] **Deleted property:** Delete property elsewhere or use invalid id; open detail. "Property not found" (or similar); Back; no crash.
- [ ] **Stale record:** Open detail for a property not refreshed in a while. Renders with existing data; "Last updated" reflects date.

---

## 6. Session and loading

- [ ] **Session expired:** If possible, expire session while detail is loading (e.g. sign out on another tab, or wait for token expiry). App should not crash; user sees error or sign-in prompt, not main content with null data.
- [ ] **Loading:** While loading, skeleton or spinner shows; no flash of empty or wrong content.

---

## 7. Labels and disclaimers (consistency)

- [ ] Every deal band (Strong, Good, Fair, Weak, Poor, Insufficient data) shows a label, never "undefined".
- [ ] Every confidence band (High, Medium, Low, Very low) shows a label.
- [ ] Score disclaimer appears exactly once below the two score cards.
- [ ] Footer disclaimer appears at bottom of screen.

---

## Sign-off

- [ ] All critical paths passed (no crashes, correct free vs Pro behavior).
- [ ] Score labels and disclaimers consistent.
- [ ] Edge cases (no rent, negative CF, low confidence cap) behave as documented.

Date: ___________   Tester: ___________
