# Final UI & Product QA Pass

Summary of fixes applied, what remains to improve later, and the recommended manual test path.

---

## What was fixed

### Score display and hierarchy
- **Analysis dashboard:** Added a **"Deal score"** label above the large score number (e.g. "85 / 100") so the hero is clearly the deal score, not an unexplained number.
- **Accessibility:** The score hero card now has a combined accessibility label (e.g. "Deal score 85 out of 100, Strong. Score capped by low data confidence." when applicable) for VoiceOver.

### Keyboard and scroll
- **Address input (Import):** Wrapped content in a **ScrollView** and added bottom padding (`AppSpacing.xxl` + `AppSpacing.xxxl`) so "Look up property" can scroll above the keyboard on small iPhones. Kept `scrollDismissesKeyboard(.interactively)`.
- **Edit imported property:** Added **Spacer** and **`.padding(.bottom, AppSpacing.xxxl)`** so the "Save changes" button can scroll above the keyboard and isn’t tight to the bottom.

### Tap targets (44pt minimum)
- **Analysis – inline What-If CTA:** Added **`frame(minHeight: 44)`** and **`contentShape(Rectangle())`** so the whole card is tappable.
- **Analysis – sticky What-If bar:** Kept **`minHeight: 50`** and added **`contentShape(Rectangle())`** for reliable hit testing.
- **What-If – Renovation:** "Edit" button now uses **`frame(minHeight: 44)`** and **`contentShape(Rectangle())`**; "Add renovation budget" button has **`frame(maxWidth: .infinity)`**, **`frame(minHeight: 44)`**, **`contentShape(Rectangle())`**, and **`buttonStyle(.plain)`** so the full row is a proper tap target.

### Spacing and layout
- No new spacing bugs were found; existing use of `AppSpacing` and Portfolio/DealCard updates (filter chips 44pt, horizontal scroll for metrics, empty-state bottom padding) were left as is.

---

## What remains to improve later

- **Scenario recomputation:** What-If updates on every input change (slider or text). If the simulation engine becomes heavier, consider debouncing (e.g. 100–150 ms) or running recompute on the next run loop so rapid slider moves don’t block the main thread.
- **Label consistency:** Minor differences remain by design: Analysis uses **"Key metrics"**, Home uses **"Featured metrics"** (with "From latest analysis"). Analysis and What-If use **"Cash flow (yr)"**; Portfolio cards use **"Cash flow"** (annual in context). Optional later pass: unify "Cash flow" vs "Cash flow (yr)" and "Key" vs "Featured" if you want strict copy consistency.
- **Dynamic Type:** Layouts use fixed `AppTypography` and system font sizes. For accessibility, consider testing with **Largest** Dynamic Type and adding `lineLimit` / `minimumScaleFactor` or allowing more lines where text currently truncates.
- **Landscape / iPad:** Flows were validated in portrait; landscape and iPad may need extra constraints or different layouts for Analysis grid and What-If sections.
- **Photo gallery:** Placeholder URLs (picsum) load asynchronously; errors or slow networks can show blanks. Consider local placeholders or a proper loading/error state in the gallery component.

---

## Final recommended test path (manual)

Use this order on an **iPhone 16** (or 15) simulator with **demo data ON** (Settings → Use demo data). The app should open on **Portfolio**.

| Step | Screen / action | What to verify |
|------|------------------|----------------|
| 1 | **Portfolio** (landing) | Three deal cards; Archetype and Status filters scroll horizontally; no clipped text; tap targets feel comfortable. |
| 2 | Tap **Maple Ridge 4-plex** (or any deal) | **Analysis** opens; **"Deal score"** label above the big score; score/archetype/confidence and Key metrics readable; scroll to bottom; sticky bar **"What-if scenarios"** is one clear tap target. |
| 3 | Tap **What-if scenarios** (sticky bar) | **What-If** full screen opens; helper text and sections visible; sliders and fields respond. |
| 4 | What-If: scroll to **Renovation** | "Edit" or "Add renovation budget" is easy to tap (44pt); tap **Edit** or **Add renovation budget**. |
| 5 | **Renovation planner** sheet | Line items and totals; **Done** dismisses and returns to What-If. |
| 6 | What-If: tap **Done** | Dismisses to Analysis / Portfolio. |
| 7 | **Import** tab | Start screen; tap **Strong 4-plex** under Demo. |
| 8 | **Import result** | Address, details, photo strip; **Edit details** and **Save to portfolio** / **Done**. |
| 9 | **Import** → **Type address** | **Address input**: type a few characters; keyboard appears; **Look up property** (when address is selected) scrolls into view and is not covered by keyboard. |
| 10 | **Import result** → **Edit details** | **Edit** screen: scroll to **Save changes**; button stays above keyboard when a field is focused; **Done** in keyboard toolbar dismisses keyboard. |
| 11 | **Home** tab | Tap **Import property** → switches to **Import** tab. |
| 12 | **Settings** | Toggle **Use demo data** off → Portfolio shows empty or mock list; toggle on → three demo deals return. |

**Quick smoke path (short):** Portfolio → tap one deal → Analysis → What-if scenarios → Done. Then Import → Demo → Strong 4-plex → back. Then Settings → toggle demo data.

---

## Files touched in this pass

- `PropFolio/Screens/Dashboard/AnalysisDashboardScreen.swift` — Deal score label, score hero accessibility, What-If CTA min height and contentShape, sticky bar contentShape.
- `PropFolio/Screens/PropertyImport/AddressInputView.swift` — ScrollView, bottom padding for keyboard.
- `PropFolio/Screens/PropertyImport/EditImportedPropertyView.swift` — Bottom padding and Spacer for keyboard.
- `PropFolio/Screens/Simulation/WhatIfSimulatorScreen.swift` — Renovation "Edit" and "Add renovation budget" tap targets (min height, contentShape, button style).
