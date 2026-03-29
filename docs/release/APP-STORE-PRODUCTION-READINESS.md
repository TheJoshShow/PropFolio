# App Store Production Readiness – APIs, Algorithms, and Functionality

**Target:** iOS only. PropFolio production build is the Expo app in `expo-app/`; no Android or web release.

This document ensures **all app functionality works** after the app is uploaded to the Apple App Store. It lists every dependency (APIs, backend, algorithms), how the app behaves when they are missing or fail, and a checklist so you configure everything required for full functionality.

---

## 1. Dependency overview

| Dependency | Used for | Required for full functionality? | If missing or fails |
|------------|----------|-----------------------------------|----------------------|
| **Supabase (URL + anon key)** | Auth, DB (profiles, property_imports, subscription_status), Edge Function invokes | **Yes** (real auth, import save, subscription sync) | App runs in **demo mode** (in-memory user); no save to server; Edge Functions not callable. |
| **Supabase Edge Functions** | Geocoding, autocomplete, rent estimate, delete account, (optional) summarize, census | **Yes** for: address lookup, rent estimate, account deletion. Optional: summarize, census | `geocodeAddress` / `placesAutocomplete` / `rentEstimate` return error; UI shows alert. **delete-account** must be deployed for App Store account-deletion compliance. |
| **RevenueCat (iOS API key)** | Subscriptions, offerings, purchase, restore, Pro entitlement | **Yes** for in-app purchases and Pro access | Paywall shows “Loading plans…” then fallback; no purchase; `hasProAccess` stays false. App does not crash. |
| **Scoring / underwriting / confidence (in-app)** | Deal score, confidence meter, what-if, renovation math | **Yes** (core product) | Pure TypeScript in `src/lib/`; no network. Works as long as property/input data is available. |
| **Monitoring stub** | `src/services/monitoring` (no third-party SDK yet) | No | No env vars; production no-op until Crashlytics. |
| **Fonts & assets** | UI (SpaceMono, app icon, splash) | **Yes** | Bundled with app; must be present in build (default Expo setup includes them). |

---

## 2. Required configuration for full functionality

### 2.1 Environment variables (client)

These must be set **at build time** for the App Store build (e.g. EAS Build “production” profile or Xcode scheme). The app reads them via `process.env.EXPO_PUBLIC_*`.

| Variable | Purpose | Where to set for iOS |
|----------|---------|----------------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL | EAS Secrets or `eas.json` env for production profile |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key | EAS Secrets or `eas.json` env |
| `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` | RevenueCat iOS public API key | EAS Secrets or `eas.json` env |
| `EXPO_PUBLIC_PRIVACY_POLICY_URL` | Optional; default `https://prop-folio.vercel.app/privacy` | EAS Secrets if you override |
| `EXPO_PUBLIC_TERMS_URL` | Optional; default `https://prop-folio.vercel.app/terms` | EAS Secrets if you override |

**Important:** For EAS Build, set these in [EAS Project → Secrets](https://docs.expo.dev/build-reference/variables/#using-secrets) and attach them to the **production** build profile so the production iOS binary has the correct Supabase and RevenueCat keys. Without them, the app will run in demo mode and subscriptions will not work.

### 2.2 Supabase project

- **Migrations:** All migrations in `supabase/migrations/` must be applied (especially 00001, 00016, 00017, 00018, 00019, 00020 for auth, free tier, subscription_status, RPC, and delete-account support).
- **Edge Functions:** Deploy and set secrets as in `docs/DEPLOY-EDGE-FUNCTIONS.md`. Minimum for full functionality:
  - `geocode-address` (Google Geocoding)
  - `places-autocomplete` (Google Places)
  - `rent-estimate` (RentCast)
  - `delete-account` (required for App Store account deletion)
- **Secrets:** Set in Supabase Dashboard → Edge Functions → Secrets:
  - `GOOGLE_MAPS_API_KEY`
  - `RENTCAST_API_KEY`
  - (Optional) `OPENAI_API_KEY`, `CENSUS_API_KEY`, `REVENUECAT_WEBHOOK_AUTHORIZATION`

### 2.3 RevenueCat

- Create iOS app in RevenueCat with bundle ID `com.propfolio.app`.
- Create entitlement (e.g. `pro_access`) and default offering with monthly/annual packages.
- Add App Store Connect in-app purchase product IDs to RevenueCat and attach to the offering.
- Use the **public iOS API key** as `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` in the client build.

### 2.4 Algorithms (no extra config)

- **Deal scoring, underwriting, confidence meter, what-if, renovation:** Implemented in `expo-app/src/lib/` (TypeScript). They run entirely in-app; no API calls. They work as long as the app has the required inputs (e.g. property data from import or manual entry).

---

## 3. Code behavior when APIs are missing or fail

The app is written so that **missing or failing services do not crash** the app:

| Scenario | Behavior |
|----------|----------|
| **Supabase URL/anon key not set** | `getSupabase()` returns `null`. Auth uses demo user; `getImportCount(null)` returns safe defaults; Edge Function `invoke()` returns `{ data: null, error: 'Supabase not configured' }`; import screen shows “Address parsed (offline)” or alert on lookup failure. |
| **Edge Function not deployed or returns error** | `geocodeAddress` / `placesAutocomplete` / `rentEstimate` return `{ data: null, error: message }`. Import screen shows Alert with the error. No crash. |
| **RevenueCat not configured or getOfferings/getCustomerInfo fails** | `configureRevenueCat` returns false; `getOfferings()` / `getCustomerInfo()` return null. Paywall shows loading then fallback/empty state; `hasProAccess` remains false. SubscriptionContext keeps last cached state on error (does not revoke Pro on network failure). |
| **deleteAccount() called when Supabase not configured** | Settings only shows “Delete account” when `isAuthConfigured` is true. If called anyway (e.g. race), AuthContext throws; Settings catches and shows alert. |
| **delete-account Edge Function not deployed** | `deleteAccount()` returns `{ data: null, error }`. AuthContext throws; Settings shows alert with error message. |

So: for **production**, you must configure Supabase and RevenueCat (and deploy Edge Functions) so that **full** functionality works; the app will not crash if something is misconfigured, but features will be limited or show errors until fixed.

---

## 4. Pre–App Store upload checklist

Use this before uploading the first build (or after any change to backend/APIs).

### 4.1 Build and env

- [ ] **EAS Build** (or Xcode) production profile has:
  - [ ] `EXPO_PUBLIC_SUPABASE_URL`
  - [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`
- [ ] **App version and build number** set for this submission (e.g. in `app.json` or EAS).

### 4.2 Supabase

- [ ] All **migrations** applied to the project used by production.
- [ ] **Edge Functions** deployed: `geocode-address`, `places-autocomplete`, `rent-estimate`, `delete-account` (and any others the app calls).
- [ ] **Secrets** set for those functions: at least `GOOGLE_MAPS_API_KEY`, `RENTCAST_API_KEY` (and any required by delete-account if it uses more than Supabase env).

### 4.3 RevenueCat

- [ ] iOS app in RevenueCat with bundle ID `com.propfolio.app`.
- [ ] Entitlement (e.g. `pro_access`) and **default** offering with packages created.
- [ ] App Store Connect subscription products created and linked in RevenueCat.
- [ ] Public iOS API key from RevenueCat set in client as `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`.

### 4.4 App Store compliance

- [ ] **Delete account:** User can trigger deletion from Settings; `delete-account` Edge Function is deployed and succeeds when called with a valid session.
- [ ] **Restore purchases:** Available from Settings and Paywall; tested.
- [ ] **Privacy Policy / Terms:** URLs in app (and in App Store listing) resolve and match your live pages.

### 4.5 Smoke test (after upload or TestFlight)

- [ ] **Sign in** with a real account (Supabase auth).
- [ ] **Import a property** via “Enter address”: geocode and rent estimate succeed (or show a clear error if an API is down).
- [ ] **Save to portfolio:** Import completes and usage count updates (free tier or Pro).
- [ ] **Paywall:** Plans load; purchase (sandbox) or restore works; Pro access reflects correctly.
- [ ] **Delete account:** From Settings, delete account flow completes and session is cleared.
- [ ] **Scoring/analysis:** Open a property or run analysis; deal score and confidence run in-app without errors.

---

## 5. Summary

- **APIs and backend:** Full functionality requires Supabase (URL + anon key), deployed Edge Functions (geocode, places, rent-estimate, delete-account) with secrets, and RevenueCat (iOS API key + products/entitlements). Set client env vars at **build time** for the App Store build.
- **Algorithms:** All scoring, underwriting, and confidence logic run in-app; no extra config beyond having the app and input data.
- **Resilience:** The app handles missing or failing APIs without crashing; users see alerts or degraded behavior until you fix configuration. Use the checklist above so that once the app is on the App Store, all features work as intended.

For Edge Function deployment and secrets, follow **`docs/DEPLOY-EDGE-FUNCTIONS.md`**. For auth, subscriptions, and paywall wiring, see **`docs/AUTH-FREE-TIER-PAYWALL-SUBSCRIPTION-GUIDE.md`** and **`docs/release/APP-STORE-SUBMISSION-CHECKLIST.md`**.
