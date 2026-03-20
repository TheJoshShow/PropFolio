# Monetization Copy Review — Compliance

PropFolio rules: scores and analysis are **model output, not a guarantee**; **informational use only**; users should **verify important assumptions locally**. Paywall and upsell copy must not imply guaranteed returns or investment outcomes.

## Existing paywall copy (`paywallCopy.ts`)

- **Headline / subheadline:** Focus on "unlimited property analysis" and "unlimited imports" — no promise of returns. **Compliant.**
- **Benefits:** "Unlock scoring and insights as we add them", "Save and track properties" — no guarantee of performance. **Compliant.**
- **Footer:** Standard subscription terms (Apple ID, renewal, cancel in settings). **Compliant.**

## Property-detail premium upsell (recommended)

When we show a lock CTA or send the user to the paywall from a gated section (factor breakdown, "About these scores"), any in-app copy should:

- **Do:** Say that Pro unlocks "deeper score breakdown" or "how scores are calculated" and "detailed factor explanations."
- **Do:** Emphasize "informational only" and "verify assumptions locally" if we add a short line near the CTA.
- **Don’t:** Use phrases like "see how much you’ll make", "guaranteed returns", "best deals", or "we’ll tell you which property will succeed."

Suggested lock/upsell line (for a "Pro" badge or modal on property detail):

- **Option A:** "Unlock factor breakdown and score details. Analysis is for informational use only; verify key assumptions locally."
- **Option B:** "Pro unlocks detailed score breakdown and how scores are calculated. Not a guarantee of future performance."

Use one of these (or equivalent) so monetization copy stays compliant.

## Checklist

- [x] Paywall benefits do not promise specific returns or outcomes.
- [x] Paywall footer does not imply investment guarantees.
- [x] Property-detail premium upsell (lock CTA / paywall entry) uses compliant phrasing (informational only; verify locally; not a guarantee).
- [ ] Any new paywall or upsell string added later must be reviewed against this checklist.
