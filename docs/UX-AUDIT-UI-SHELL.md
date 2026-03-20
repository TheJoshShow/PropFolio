# UX Audit: PropFolio UI Shell

**Scope:** Home dashboard, tab shell, reusable components (buttons, cards, metric chips, input, empty state, confidence meter teaser).  
**Criteria:** Visual hierarchy, text clipping, tap target sizes (44pt min), spacing consistency, readability on common iPhone sizes, investor-friendly / premium feel.

---

## Verdict: **PASS** (after applying fixes below)

The shell is structurally sound and meets HIG and accessibility baselines. P0 and P1 fixes have been applied; P2 hero added. Re-capture screenshots to confirm and close.

---

## Screenshots to capture for inspection

Capture these on **iPhone SE (3rd)** or **iPhone 14** (or equivalent simulators), in **light** and **dark** mode:

| # | Screen / area | What to check |
|---|----------------|----------------|
| 1 | **Home – full scroll** | Section order, spacing between blocks, no overlap or clipping at bottom |
| 2 | **Home – Quick import CTA** | Card padding, button height, CTA copy wrap (no single-line overflow) |
| 3 | **Home – Featured metrics row** | All three chips visible without clipping on 375pt width; no wrapping into chaos |
| 4 | **Home – Recent analyses** | First row: address truncation (…), score chip and “6.2% cap” visible; row feels tappable |
| 5 | **Home – Portfolio snapshot card** | “Latest:” address truncates with …; count and label readable |
| 6 | **Confidence meter teaser** | Circle, label, subtitle, chevron aligned; full card looks tappable |
| 7 | **Portfolio – empty state** | Icon, title, message, button centered; button width comfortable |
| 8 | **Tab bar** | All four labels readable; selected tab clearly indicated |
| 9 | **Settings – list** | Section header and rows readable; list background matches theme |

Use **Accessibility Inspector** (or Device → Accessibility → Larger Text) to confirm Dynamic Type: increase text size and ensure no clipping or overlap on Home and Portfolio.

---

## Findings summary

| Criterion | Status | Notes |
|----------|--------|--------|
| **Visual hierarchy** | OK | Section titles (title3), subtitles (caption), cards stand out. Section-to-section spacing uniform (xl). |
| **Text clipping** | Fix needed | Featured metrics HStack can overflow on 375pt width. Single-line fields use lineLimit(1); set truncationMode(.tail) explicitly where needed. |
| **Tap target sizes** | OK + 1 fix | Buttons and text field use minHeight 44. Confidence teaser and recent-analysis row are full-width/height cards; row should enforce minHeight 44 for consistency. |
| **Spacing consistency** | Fix needed | Section header title-to-subtitle uses xxxs (2pt)—too tight; use xs (8pt). |
| **Readability (iPhone SE / 14)** | Fix needed | Same as clipping: metrics row and any long labels need small-screen behavior (scroll or flexible layout). System fonts scale with Dynamic Type. |
| **Investor-friendly / premium** | OK | Clear labels (Confidence score, Featured metrics, Portfolio snapshot), teal primary, cards with shadow. Optional: add short value-prop line at top of Home. |

---

## Prioritized fix list

### P0 – Must fix before release

1. **Featured metrics on small devices**  
   On 375pt width, three `MetricChip`s in an `HStack` can overflow or squeeze. Use a horizontal `ScrollView` for the metrics row (with `scrollIndicators(.hidden)` if desired) so all chips remain visible and readable on iPhone SE / narrow devices.

2. **Section header spacing**  
   In `sectionHeader`, the gap between section title and subtitle is `AppSpacing.xxxs` (2pt). Change to `AppSpacing.xs` (8pt) so the hierarchy reads clearly and matches the rest of the app.

3. **Recent analysis row minimum height**  
   Enforce `minHeight: 44` on the tappable row (the `Button` or its content frame) so the row always meets the 44pt touch target, including when the content is compact.

### P1 – Should fix

4. **Explicit truncation for single-line text**  
   Where you use `lineLimit(1)` (recent analysis address, confidence teaser subtitle, portfolio “Latest:” address), add `.truncationMode(.tail)` so truncation behavior is explicit and consistent across OS versions.

5. **Confidence meter teaser minimum height**  
   The teaser card is already tall enough, but add a `frame(minHeight: 44)` (or equivalent) on the tappable content so the hit area is explicitly at least 44pt in the vertical axis.

### P2 – Nice to have

6. **Home hero / value prop**  
   Add a single line at the top of the Home scroll (e.g. “Should I buy this property?” or “Score deals. Decide with confidence.”) with title2 or headline styling to reinforce the product question and premium tone.

7. **Safe area / bottom padding**  
   Confirm ScrollView content has sufficient bottom padding (e.g. `AppSpacing.xxl`) so the last card clears the tab bar and safe area on all devices (already present; verify visually).

---

## Fixes applied (implementation)

| Fix | Change |
|-----|--------|
| P0-1 Featured metrics | Wrapped chips in `ScrollView(.horizontal, showsIndicators: false)` with trailing padding. |
| P0-2 Section header | `sectionHeader` title-to-subtitle spacing changed from `AppSpacing.xxxs` to `AppSpacing.xs`. |
| P0-3 Recent row tap target | `RecentAnalysisRow` content given `.frame(minHeight: 44)` and `.frame(maxWidth: .infinity, alignment: .leading)`. |
| P1-4 Truncation | `.truncationMode(.tail)` added to all single-line text (recent row address, confidence subtitle, portfolio "Latest:"). |
| P1-5 Confidence teaser | Teaser card content given `.frame(minHeight: 44)`. |
| P2-6 Hero | `heroValueProp` added at top of Home: "Should I buy this property?" with `AppTypography.title2`. |

---

## Re-audit checklist

After applying P0 and P1 (done):

- [ ] Run on iPhone SE (3rd) and iPhone 14; capture screenshots 1–9.
- [ ] Enable Larger Text (Accessibility); scroll Home and Portfolio; confirm no clipping.
- [ ] Tap each interactive element (CTA, confidence teaser, recent row, empty-state button, tab items); confirm targets feel comfortable and no accidental misses.
- [ ] Compare section headers to body text; confirm 8pt gap between title and subtitle.
- [ ] Mark audit as **PASS** and close, or add new items to the fix list.
