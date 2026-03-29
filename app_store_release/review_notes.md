# PropFolio — App Review Notes

Paste or adapt this into **App Store Connect → App Review Information → Notes** so reviewers can test the app without confusion.

---

## App purpose (concise)

PropFolio is a real estate investment helper. Users add U.S. properties by address, get rent estimates, and save them to a portfolio. The app answers: "Should I buy this property?" with data and a simple workflow. The first 2 property imports are free; after that we show a paywall for a Pro subscription (unlimited imports).

---

## Test account (if needed)

If your app requires login to use core features, provide a demo account:

**Option A — Reviewer creates account:**  
"No test account required. Reviewers can sign up with any email; we recommend using a new account. No payment is required to try the 2 free property imports."

**Option B — Pre-created account:**  
- **Email:** [e.g. appreview+propfolio@yourdomain.com]  
- **Password:** [Provide a temporary password; change after review]  
- **Note:** "This account has not used the free imports so you can test the full flow: add 2 properties, then see the paywall on the 3rd."

**Recommendation:** Use Option A so reviewers exercise sign-up and you avoid sharing credentials. If you use Option B, rotate the password after review.

---

## How subscription / paywall works

- **Free tier:** Each account gets **2 property imports** (add by address). No credit card required.
- **Paywall:** When the user tries to add a 3rd property (or taps "Import from link" / "Use address" at limit), we show an in-app paywall with subscription options (e.g. monthly and annual Pro).
- **Pro:** Unlocks **unlimited** property imports. Purchases are made through **Apple In-App Purchase** (RevenueCat). Payment is charged to the user's Apple ID.
- **Restore purchases:** Available from the paywall and from Settings → Restore purchases. We do not lock core app access behind restore—users can always sign in and see their data.
- **Manage subscription:** Settings and paywall include "Manage subscription," which opens Apple's subscription management (or a fallback message on unsupported OS).

Reviewers can test without purchasing: use the 2 free imports, then dismiss the paywall when it appears.

---

## How property import works

1. User goes to the **Import** tab (or Home → Add property).
2. **Option A — Paste link:** User can paste a Zillow or Redfin URL. We detect the link and direct them to "Or enter address" to add that property by address (we do not scrape listing pages).
3. **Option B — Enter address:** User types a U.S. address (street, city, state, or ZIP). We use **address autocomplete** (Google Places API via our backend) and **geocoding** to resolve the address. We then request a **rent estimate** (RentCast API via our backend) and save the property to the user's account.
4. **Limit:** The 1st and 2nd imports succeed; the 3rd attempt triggers the paywall (or upgrade CTA on Import screen).

If the reviewer is offline or our backend is slow, they may see "Address lookup failed" or "Request timed out." They can retry. No mock data is shown for failed lookups.

---

## API-dependent behavior

- **Sign in / sign up:** Uses Supabase Auth (email/password; confirmation and password-reset links via email). Works with real backend.
- **Address autocomplete and geocoding:** Requires network; calls our Edge Functions (which call Google APIs). No autocomplete when offline.
- **Rent estimate:** Requires network; calls our Edge Function (RentCast). If it fails, we still save the property; rent can be "unavailable."
- **Subscription state:** RevenueCat (and Apple IAP). In Sandbox, reviewers can complete a test purchase to see Pro state.
- **Account deletion:** Implemented via our Edge Function; deletes the auth user. Requires network.

We do not show fake data when APIs fail—we show error messages and retry options.

---

## What might look confusing during review

1. **Portfolio tab is empty after adding properties:** In the current build, the Portfolio tab shows an empty state ("No properties yet") and a CTA to Add property. Property records are saved server-side; if your build does not yet list them on the Portfolio screen, mention that in notes: "Saved properties are stored; the list view is coming in a future update." If the list is already implemented, ignore this.
2. **"Import from link" does not auto-fill from Zillow/Redfin:** We detect the link and tell the user to use "Or enter address" to add that property. This is intentional (we don't scrape listings).
3. **Debug section in Settings:** Only visible in development builds (`__DEV__`). Production builds do not show "Debug (dev only)" or "Log state to console."
4. **Demo mode:** If Supabase env vars are missing, the app may run in demo mode (e.g. sign-in without backend). Production builds must have env set so reviewers hit the real auth and backend.

---

## Contact

If the reviewer has questions, they can use the in-app **Contact support** link (Settings) or the Support URL you set in App Store Connect. Ensure that URL (or mailto) is valid and monitored during review.

---

*Keep this doc in sync with each submission. Shorter notes often get read; put the most important info first.*
