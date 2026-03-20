# PropFolio — Screenshot Plan

Use this to capture and order **App Store Connect** screenshots for iPhone (and optionally iPad). Required sizes: 6.7", 6.5", 5.5" (or use one set that scales). Max 10 screenshots per device size.

---

## Exact screen list to capture

Capture these screens in a **release build** (no debug UI). Use a test account that has used **0 or 1** free import so you can show both free and paywall states.

| # | Screen | Route / How to get there | Free vs Premium |
|---|--------|---------------------------|-----------------|
| 1 | **Login** | Open app (logged out) or Settings → Log out, then open app | Free (no account) |
| 2 | **Home (dashboard)** | After login; main tab "Home" | Free (shows "Get started", free imports remaining) |
| 3 | **Import — input** | Tabs → Import; show paste link + address entry | Free |
| 4 | **Import — at limit (paywall CTA)** | After 2 imports; Import tab showing "You've used your 2 free imports" card | Free (gated) |
| 5 | **Paywall** | From Import at limit → "Upgrade to Pro" or from Settings / in-app CTA | Premium (offer) |
| 6 | **Portfolio (empty)** | Tabs → Portfolio | Free |
| 7 | **Settings — account & plan** | Tabs → Settings; scroll to show Account, Plan & subscription, Restore | Free or Pro |
| 8 | **Settings — legal & support** | Same screen, scroll to Help & support, Legal (Privacy, Terms) | Free |

**Optional 9–10:**  
- **You have Pro** (paywall when already subscribed): open Paywall when Pro is active.  
- **Success state:** e.g. "Property added" alert (hard to capture; optional).

---

## Best order for screenshots

Recommended order (tells a story: sign in → see home → add property → hit limit → upgrade → manage):

1. **Login** — First impression; app is gated by account.
2. **Home** — Value prop: "Should I buy this property?" and Add property.
3. **Import** — How users add properties (link or address).
4. **Import at limit** — Natural moment to show upgrade CTA.
5. **Paywall** — Subscription offer (unlimited imports, benefits).
6. **Portfolio** — Where saved properties live (empty state is fine for launch).
7. **Settings (account & plan)** — Trust: email, plan, Restore, Manage subscription.
8. **Settings (legal)** — Privacy, Terms, Contact support.

If you have a "property list" or "property detail" screen later, insert after Portfolio (e.g. "Portfolio with properties" then "Property detail").

---

## Caption suggestions (per screenshot)

Keep captions short. Apple may show them below the image.

| # | Suggested caption |
|---|-------------------|
| 1 | Sign in to sync your portfolio |
| 2 | Add properties and get rent estimates |
| 3 | Paste a link or enter any U.S. address |
| 4 | Upgrade to Pro when you need more imports |
| 5 | Unlimited imports with Pro |
| 6 | All your properties in one place |
| 7 | Manage your account and subscription |
| 8 | Privacy, terms, and support in one place |

---

## Free vs premium — which screenshots show what

| Screenshot | Shows free features | Shows premium |
|------------|---------------------|---------------|
| Login | ✓ Account required | — |
| Home | ✓ Free tier copy, free imports remaining | — |
| Import (input) | ✓ Paste link, enter address | — |
| Import at limit | ✓ Paywall CTA, "2 free imports" | Upgrade path |
| Paywall | — | ✓ Plans, price, Restore |
| Portfolio | ✓ Empty state, CTA to add | — |
| Settings | ✓ Account, Restore, Manage | ✓ If Pro: "Pro" status |
| Legal | ✓ Links (same for all users) | — |

**Guideline:** At least 2–3 screens should clearly show **free** experience (login, home, import). At least 1 should show the **paywall** so Apple sees subscription is IAP and clear. Do not show only paywall or only empty screens.

---

## Technical notes

- **Device:** Use a physical iPhone or simulator; remove status bar clutter if needed (e.g. full battery, no carrier text).
- **Safe area:** Ensure no critical text or buttons are under the notch or home indicator.
- **Dark mode:** Optional second set if your app supports it and you want to showcase it.
- **Localization:** If you add languages later, capture (or duplicate) screenshots for each locale.

---

*Update this plan when you add new screens (e.g. property detail, onboarding).*
