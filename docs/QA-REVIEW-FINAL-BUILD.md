# QA Review: Final Runnable Build and Test Flow

Assessment of run instructions, demo coverage, manual test path, and critical flows. **Pass/fail** per area and **launch blockers** at the end.

---

## 1. Can a beginner follow the run instructions?

**Verdict: PASS with minor gaps**

- **Prerequisites** are clear: Xcode 15+, macOS, iOS 17+ simulator; Windows called out as unable to run the simulator.
- **Option A** (existing project): Simple (open project → scheme → run); commands are copy-pasteable.
- **Option B** (first-time): Step-by-step with menu paths (File → New → Project, iOS → App, etc.). Folder rule is explicit: *"Save the project in the same folder that contains the existing PropFolio app source folder (so the project and the PropFolio folder are siblings)."*
- **Gaps for beginners:**
  - **README** does not point to **docs/DEVELOPMENT.md**. Someone only reading the README gets a 3-step setup and may miss demo data, env vars, and the full tap-through checklist.
  - Option B doesn’t say *where* to create the project (e.g. “in the repo root so `PropFolio.xcodeproj` sits next to the `PropFolio` source folder”). The phrase “same folder that contains the existing PropFolio” is correct but could be one sentence clearer: e.g. “Create the new project in the **repo root** so the project file and the PropFolio source folder are side by side.”
- **No .xcodeproj in repo:** First-time runners **must** do Option B. That’s documented; no change required for pass.

**Recommendation:** Add to README a line: *“For detailed run steps, simulator choice, and a full test checklist, see [DEVELOPMENT.md](./DEVELOPMENT.md).”* Optionally add the one-sentence “repo root” clarification to Option B.

---

## 2. Do demo scenarios cover all major features?

**Verdict: PASS**

| Feature | Covered by demo | How |
|--------|------------------|-----|
| **Portfolio** | Yes | Three deals (strong, value-add, risky); list, filters, tap → Analysis. |
| **Analysis** | Yes | Full state: deal score, archetype, confidence, future value, key metrics, risks/opportunities, What-If CTA. |
| **What-If** | Yes | Opens from Analysis; inputs seeded from deal when available; sliders, fields, live metrics. |
| **Renovation** | Yes | From What-If (Edit / Add renovation budget); value-add deal has `RenovationPlan`; line items, tier, contingency. |
| **Import** | Yes | Demo (development): Strong 4-plex, Value-add 6-plex, Risky condo → result → details, photos, Edit. |
| **Settings** | Yes | Use demo data toggle; Portfolio reacts (3 deals vs empty/mock). |
| **Home** | Partial | Import CTA switches to Import tab; “Recent analyses” and “Portfolio snapshot” are mock only (no navigation to real analysis). |

- Demo data gives **three distinct score/confidence bands** (85/high, 58/medium, 28/low) and different future-value copy.
- **Paste link / Type address** are testable in UI; real lookup fails without API keys (documented as optional).

**Conclusion:** All major *testable* features are covered by demo scenarios. Home’s “Recent analyses” / “Portfolio snapshot” are placeholder content, not a demo gap.

---

## 3. Is the manual test path complete?

**Verdict: PASS**

- **docs/DEVELOPMENT.md** (Section 4): 8-step tap-through (Home → Import, Import demo, Portfolio → Analysis → What-If → Renovation, filters, Settings). Order is logical and hits every major screen.
- **docs/QA-PASS-FINAL.md**: 12-step path adds keyboard/scroll checks (Address input, Edit details) and explicit Home → Import tab check. Includes a short “Quick smoke path.”

Together they cover:

- Portfolio (landing, filters, tap deal).
- Analysis (score, confidence, future value, metrics, risks/opportunities, What-If CTA).
- What-If (open, sliders/fields, Renovation entry).
- Renovation planner (open, Done).
- Import (demo load, result, Edit details, Save/Done).
- Address input and Edit screen (keyboard/scroll).
- Home → Import tab.
- Settings (demo toggle).

**Conclusion:** The manual test path is complete for the current feature set.

---

## 4. Are any critical flows still untested or broken?

**Verdict: FAIL — one critical flow is not implemented**

- **Save to portfolio (Import result):** The button is present and in the test path (“Save to portfolio / Done”), but the handler only dismisses the result; it does **not** persist the deal or add it to the Portfolio list.  
  - **Code:** `PropertyImportFlowView.swift`: `onSaveToPortfolio: { /* TODO: persist and navigate */ flowVM.dismissResult() }`.  
  - **Effect:** Tapping “Save to portfolio” looks like success (sheet dismisses) but the deal never appears in Portfolio. This is a **critical flow** for the product promise (“save analyses”) and is currently **untested as implemented** (only the dismiss behavior is testable).

- **Paste link / Type address:** Real API lookup fails without keys; documented as optional and expected. Not a launch blocker.

- All other flows referenced in the test path (Portfolio → Analysis → What-If → Renovation, Import demo → Result → Edit, Settings, Home → Import) are testable and work as described.

---

## 5. Pass/fail summary

| Check | Result |
|-------|--------|
| Can a beginner follow the run instructions? | **PASS** (add README link and optional “repo root” sentence for clarity). |
| Do demo scenarios cover all major features? | **PASS** |
| Is the manual test path complete? | **PASS** |
| Are any critical flows still untested / broken? | **FAIL** — Save to portfolio does not persist. |

**Overall: CONDITIONAL PASS.** The build and test flow are in good shape for a first run and full manual pass, but one critical flow is missing and must be fixed or explicitly scoped out for launch.

---

## 6. Final launch blockers

1. **Save to portfolio (Import result)**  
   - **Issue:** “Save to portfolio” only dismisses; it does not add the imported property/deal to the Portfolio list.  
   - **Required for launch (if “save” is in scope):** Implement persist + (optional) navigate to Portfolio; then re-test the Import → Save → Portfolio path.  
   - **Alternative:** If “Save to portfolio” is out of scope for this release, remove or relabel the button (e.g. “Done”) and update the test path and docs so testers don’t expect the deal in Portfolio.

No other launch blockers identified for the final runnable build and test flow (run steps, demo data, manual path, and other critical flows are sufficient once the above is resolved or scoped out).

---

## 7. Recommended small improvements (non-blocking)

- **README:** Add: *“For detailed run steps, simulator choice, and a full test checklist, see [DEVELOPMENT.md](./DEVELOPMENT.md).”*
- **DEVELOPMENT.md Option B:** Add one sentence: *“Create the new project in the **repo root** so `PropFolio.xcodeproj` and the `PropFolio` source folder are side by side.”*
- **Test path / docs:** When “Save to portfolio” is implemented (or scoped out), add a dedicated step: *“Import → Demo → Result → **Save to portfolio** → confirm deal appears in Portfolio (or remove/relabel button and update this step).”*
