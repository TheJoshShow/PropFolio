# PropFolio — Settings / Account Compliance Checklist

Use this to verify the **Settings** (account) area meets App Store and common compliance requirements.

**Screen:** `app/(tabs)/settings.tsx`  
**Config:** `src/config/legalUrls.ts` (env fallbacks)

---

## Required items

| # | Requirement | Location in app | Status |
|---|-------------|-----------------|--------|
| 1 | **Privacy Policy link** | Legal section → "Privacy Policy" | ✅ Implemented |
| 2 | **Terms of Use link** | Legal section → "Terms of Service" (same document; satisfies Terms of Use) | ✅ Implemented |
| 3 | **Contact Support link** | Help & support → "Contact support" | ✅ Implemented |
| 4 | **Restore Purchases button** | Subscription section → "Restore purchases" | ✅ Implemented |
| 5 | **Delete Account flow** | Account security → "Delete account" (confirmation → Edge Function → sign out) | ✅ Implemented |
| 6 | **Subscription management guidance (iOS)** | "Manage subscription" button; iOS hint text: "On iPhone: Settings → [Your Name] → Subscriptions"; fallback Alert with same path if link fails | ✅ Implemented |

---

## Verification steps

- [ ] **Privacy Policy:** Tap link → opens correct URL (env or fallback). No crash if URL fails (Alert shown).
- [ ] **Terms of Use / Terms of Service:** Tap link → opens same document URL. No crash if URL fails.
- [ ] **Contact support:** Tap → opens Support URL or mailto. Must match App Store Connect Support URL.
- [ ] **Restore purchases:** Tap → RevenueCat restore runs; user sees outcome alert (success / no purchases / failed / offline).
- [ ] **Delete account:** Tap → confirmation alert → "Delete account" → Edge Function runs → user deleted and signed out; success or error alert.
- [ ] **Manage subscription:** Tap → opens management URL or App Store subscriptions; if not openable, Alert shows iOS path: "Settings app → your name → Subscriptions."
- [ ] **iOS hint (optional):** Short line under "Manage subscription" on iOS: e.g. "On iPhone: Settings → [Your Name] → Subscriptions."

---

## Optional / recommended

| Item | Status |
|------|--------|
| Billing help / FAQ link (when URL configured) | ✅ Shown when `EXPO_PUBLIC_BILLING_HELP_URL` set |
| Inline subscription help when no billing URL | ✅ "Use Manage subscription above or Contact support." |
| Disclaimer (no advice) in Legal section | ✅ "PropFolio is for informational use only…" |
| Update password | ✅ Account security section (when auth configured) |
| Log out | ✅ Account security section |

---

## Env vars (production)

Set these so in-app links match App Store Connect and your hosted pages:

- `EXPO_PUBLIC_PRIVACY_POLICY_URL` — Privacy Policy page URL
- `EXPO_PUBLIC_TERMS_URL` — Terms of Use / Terms of Service page URL  
- `EXPO_PUBLIC_SUPPORT_URL` — Contact support (page or mailto); must match Connect
- `EXPO_PUBLIC_BILLING_HELP_URL` — Optional; billing/FAQ page

See `legal_links_matrix.md` for where each link is used.

---

*Re-check before each App Store submission. Update this checklist if you add or move settings.*
