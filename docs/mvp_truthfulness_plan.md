# PropFolio — MVP Truthfulness Plan

**Source of truth:** release_blocker_report.md, feature_claims_gap_report.md  
**Goal:** Align store and in-app claims with the shipped experience.  
**Date:** 2025-03-12

---

## 1. Options

| Path | Description | Effort | Risk |
|------|-------------|--------|------|
| **A** | Implement a minimal property detail screen with confidence/deal score before launch. | Medium: portfolio list + detail route + score UI + wiring to existing engines. | Higher: scope creep, testing, possible delay. |
| **B** | Rewrite App Store and in-app marketing copy so it matches the actual MVP honestly. | Low: copy and string changes only; no new screens. | Lower: no new code paths; launch-ready once copy is applied. |

---

## 2. Recommendation: **Path B (copy rewrite)**

**Rationale:**

1. **Smallest possible implementation for honest positioning**  
   Path B is the smallest change: update in-app strings and document App Store Connect copy. No new routes, no new data fetching, no new UI components.

2. **Release blocker report alignment**  
   The report states: "either ship a minimal property-detail/score view **or** soften store copy to match MVP." Path B is the "soften copy" option and satisfies the requirement.

3. **User expectation management**  
   Current copy sets expectations (confidence score, see property in Portfolio, analyses) that the app does not meet. Rewriting copy removes the gap and avoids negative reviews (e.g. "I added a property but can't see it in Portfolio").

4. **Launch velocity**  
   Path B does not block submission. Path A requires: portfolio list query, detail route, score computation from existing property/underwriting data (or "coming soon" placeholder), and regression testing.

5. **Future-proofing**  
   When property list + detail + score are implemented (e.g. Phase 6), copy can be updated again to mention "confidence score" and "deal score." property_detail_mvp_spec.md documents the minimal scope for that future work.

**Conclusion:** Choose **Path B** for launch. Implement Path A (or a variant) in a post-launch update when property list and detail are ready.

---

## 3. If Path A is chosen instead

- Use **property_detail_mvp_spec.md** as the implementation spec.
- Minimum scope: (1) Portfolio tab fetches and lists saved properties; (2) tap opens property detail screen; (3) detail shows address + basic fields + at least one of: confidence score or deal score (or "Score coming soon" if inputs insufficient).
- Ensure App Store and in-app copy then explicitly mention "confidence score" / "deal score" only where that UI exists.
- Re-audit all claims in feature_claims_gap_report.md after implementation.

---

## 4. Path B checklist (copy-only)

- [ ] Home: remove "analyze deals and see your confidence score"; replace with MVP-accurate line (see launch_copy_recommendations.md).
- [ ] Portfolio: remove "see it here and track your confidence score over time"; replace with copy that does not promise score or list visibility until list exists.
- [ ] Import success: soften "see it in your Portfolio" to avoid implying list is visible (e.g. "Saved to your portfolio" without "see it").
- [ ] Portfolio subtitle: avoid "analyses" until analysis UI exists.
- [ ] Login: "Sign in to sync your portfolio" can stay if interpreted as "sync when you add properties"; or change to "Sign in to save properties" for clarity.
- [ ] Paywall benefits: soften "Compare and track in one place" / "analysis together" to match MVP (e.g. "Unlimited property imports" and "Save properties for when we add comparison and analysis").
- [ ] App Store Connect: subtitle and description must not promise confidence score, deal score, or in-app analysis until shipped. Use launch_copy_recommendations.md for suggested store copy.

---

## 5. References

- release_blocker_report.md (§ Scoring and analysis, § Severity 3)
- docs/feature_claims_gap_report.md
- docs/launch_copy_recommendations.md
- docs/property_detail_mvp_spec.md (for Path A or post-launch)
