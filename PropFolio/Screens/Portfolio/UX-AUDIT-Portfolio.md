# Portfolio Feature — UX Audit Report

**Scope:** Portfolio tab (list, filters, cards, empty states) and deal card → analysis destination.  
**Result:** **PASS** (after fixes below).

---

## 1. Portfolio list screen (`PortfolioScreen.swift`)

| Check | Before | After |
|-------|--------|--------|
| **Bad spacing** | Filter sections and list used same 16pt gap; felt cramped. | Increased LazyVStack spacing to `AppSpacing.l` (20pt). Added "Deals" section label with consistent caption style. |
| **Clipped text** | N/A (no long text in list chrome). | Filter chip titles use `lineLimit(1)` to avoid wrap/clip. |
| **Scroll behavior** | ScrollView + LazyVStack; OK. | No change. scrollIndicators(.automatic) kept. |
| **Visual hierarchy** | Archetype / Status filters present; list had no section label. | Added "Deals" caption above cards to match Archetype/Status. |
| **Tap targets** | **FAIL.** Filter chips had ~16pt vertical padding only (~24pt total height), below 44pt HIG minimum. | **FIXED.** Chips use `frame(minHeight: 44)` and horizontal padding; full chip is tappable. |
| **Score display** | N/A (scores live on cards). | — |
| **Keyboard overlap** | No text fields; N/A. | — |
| **Layout bugs** | Horizontal filter content could sit flush to scroll edge. | Added small horizontal padding to filter HStacks. |
| **iPhone-specific** | None identified. | — |

---

## 2. Deal card (`PortfolioDealCard.swift`)

| Check | Before | After |
|-------|--------|--------|
| **Bad spacing** | Card internal spacing already consistent (AppSpacing.s). | No change. |
| **Clipped text** | Analysis name had no line limit; long names could overflow. | **FIXED.** `lineLimit(1)` + `truncationMode(.tail)` on analysis name. |
| **Scroll behavior** | Metrics in a single HStack could squeeze on narrow devices. | **FIXED.** Metrics row wrapped in `ScrollView(.horizontal)` so chips don’t compress or clip. |
| **Visual hierarchy** | Score row showed "82 / 100" + archetype with no "Score" label; could be confused with Confidence. When no score, left side was empty. | **FIXED.** Added "Score" label before numeric score; when no score, show "Score —". |
| **Tap targets** | Whole card is a Button; target is card height (OK). | **FIXED.** `contentShape(Rectangle())` so full card area is hit-testable. |
| **Score display** | See "Confusing score display" above. | **FIXED.** Explicit "Score" label + "—" for no score. |
| **Keyboard overlap** | N/A. | — |
| **Layout bugs** | None. | — |
| **iPhone-specific** | Status badge and chevron could feel tight on small screens; shortLabel already used for status. | No code change; verified status uses shortLabel. |

---

## 3. Empty states (no deals / no matches)

| Check | Before | After |
|-------|--------|--------|
| **Bad spacing** | EmptyStateView uses AppSpacing.xxl; OK. | Added `.padding(.bottom, AppSpacing.xxxl)` so CTA isn’t tight to tab bar on iPhones with home indicator. |
| **Clipped text** | Title/message use center alignment and multiline; OK. | No change. |
| **Tap targets** | PrimaryButton already has minHeight 44. | No change. |
| **iPhone-specific** | Content could sit too low near tab bar. | **FIXED.** Extra bottom padding. |

---

## 4. Analysis dashboard (destination when opening a deal)

| Check | Result |
|-------|--------|
| **Keyboard overlap** | No text fields in hero; N/A. **PASS.** |
| **Layout / hierarchy** | Existing screen; not modified in this audit. **PASS** for portfolio flow. |

---

## Summary of code changes

- **PortfolioScreen:** Filter chips use `frame(minHeight: 44)` and `lineLimit(1)`; LazyVStack spacing set to `AppSpacing.l`; "Deals" section label added; filter HStacks given horizontal padding; empty states given `.padding(.bottom, AppSpacing.xxxl)`.
- **PortfolioDealCard:** Analysis name `lineLimit(1)` + truncation; score row shows "Score" label and "—" when no score; metrics row in `ScrollView(.horizontal)`; card content uses `contentShape(Rectangle())`.

---

## Verdict

**PASS** — Portfolio UI meets the audited criteria after the applied fixes. No keyboard overlap in this feature; tap targets, spacing, hierarchy, and scroll behavior are addressed.
