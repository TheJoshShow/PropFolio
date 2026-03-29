# PropFolio — Services Initiation Guide

Step-by-step setup for each third-party service: links, APIs/keys, PropFolio usage, and optional extras. **Never call paid APIs directly from the mobile client** — use Supabase Edge Functions or your backend as a proxy.

---

## Overview: What You Need Where

| Service | Primary use in PropFolio | Keys / APIs | Call from |
|--------|---------------------------|-------------|-----------|
| **Supabase** | Auth, DB, storage, Edge Functions | URL + anon key (client); service_role (backend only) | Client (auth/DB); Edge Functions for secrets |
| **Google Maps Platform** | Address autocomplete, geocoding, validation | API key(s) with restrictions | Backend/Edge Function or restricted client key |
| **RentCast** | Rent estimates, comps for underwriting | API key | Backend/Edge Function only |
| **Expo EAS** | Build & release (iOS, Android) | EAS account; credentials via EAS | CI / your machine |
| **Firebase Crashlytics** | Native/JS crash reporting (iOS) | `GoogleService-Info.plist`; Firebase console | Client + build — **`expo-app/docs/MONITORING_SETUP.md`** |
| **OpenAI API** | Summaries, explanations, AI cleanup | API key | Backend/Edge Function only |
| **Census API** | Future Value Predictor inputs | API key | Backend/Edge Function only |

---

## 1. Supabase — Auth, database, storage, server functions

### Links & signup

- **Dashboard:** https://supabase.com/dashboard  
- **Docs:** https://supabase.com/docs  
- **Pricing:** https://supabase.com/pricing (free tier: 50K MAU, 500MB DB, 1GB storage)

### Initiation steps

1. Sign up at https://supabase.com and create an **organization** (if prompted).
2. **New project:** Dashboard → **New project** → pick region, set DB password (store securely).
3. Wait for the project to be ready. Go to **Project Settings** (gear) → **API**.
4. Copy:
   - **Project URL** → use as `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → use as `EXPO_PUBLIC_SUPABASE_ANON_KEY`
5. In **Authentication** → **Providers**: enable **Email** (and **Apple** when you add iOS native).
6. (Optional) **Database** → run migrations from your repo `supabase/migrations` if you have them.
7. **Storage**: Create buckets as needed (e.g. `property-docs`, `exports`); set RLS policies.
8. **Edge Functions**: Deploy server-side logic (e.g. call RentCast, OpenAI, Census) so API keys never ship to the client.

### APIs / keys

| Item | Where to get | Use in PropFolio |
|------|--------------|-------------------|
| Project URL | Settings → API → Project URL | Client `.env`: `EXPO_PUBLIC_SUPABASE_URL` |
| anon key | Settings → API → anon public | Client `.env`: `EXPO_PUBLIC_SUPABASE_ANON_KEY` |
| service_role key | Settings → API → service_role | **Backend/Edge Functions only**; never in client |

### PropFolio functions (and more)

- **Auth:** Email sign-in/sign-up; session persistence; later Apple Sign In.
- **Database:** Users, profiles, properties, analyses, scenarios, market snapshots, subscriptions, usage events.
- **Storage:** Uploads (e.g. documents, export files); user assets.
- **Server functions:** Edge Functions to proxy RentCast, Google, OpenAI, Census; keep keys server-side.

**App wiring:** Already in place. Set the two env vars in `expo-app/.env`; see `expo-app/docs/ENV.md`.

---

## 2. Google Maps Platform — Address autocomplete, geocoding, validation

### Links & signup

- **Console:** https://console.cloud.google.com  
- **Maps Platform:** https://console.cloud.google.com/google/maps-apis  
- **Docs (Places):** https://developers.google.com/maps/documentation/places/web-service  
- **Docs (Geocoding):** https://developers.google.com/maps/documentation/geocoding  
- **Pricing:** https://maps.google.com/pricing (free monthly credit; then pay-per-use)

### Initiation steps

1. Create or select a **Google Cloud project** in the Cloud Console.
2. Enable APIs:
   - **Places API** (for autocomplete and Place Details).
   - **Geocoding API** (address → lat/lng and validation).
   - **Maps JavaScript API** only if you embed a map in web; otherwise optional.
3. **Credentials** → **Create credentials** → **API key**.
4. Restrict the key:
   - **Application restrictions:** e.g. HTTP referrers (web) or iOS/Android app bundle IDs.
   - **API restrictions:** limit to Places API, Geocoding API (and Maps JS if used).
5. For **mobile**, prefer a **backend proxy**: app calls your Supabase Edge Function or API; the function calls Google with a **server API key** (IP or no client restriction, but never shipped to the app).

### APIs / keys

| Item | Where | Use in PropFolio |
|------|--------|-------------------|
| API key (server) | GCP Console → APIs & Services → Credentials | Edge Function or backend; env e.g. `GOOGLE_MAPS_API_KEY` |
| (Optional) client key | Same, restricted to app bundle IDs / referrers | Only if you call Google from the client (not recommended for key safety) |

### PropFolio functions (and more)

- **Address autocomplete:** Suggestions as user types in “Enter address” (Import flow).
- **Geocoding:** Address string → structured components + lat/lng for mapping and validation.
- **Validation:** Confirm address exists and normalize format before underwriting.
- **Other:** Future map previews, “nearby comps” distance, or drive-time (Distance Matrix) if needed.

**Integration:** Add an Edge Function (e.g. `geocode-address`, `places-autocomplete`) that accepts requests from the app and calls Google; app uses `EXPO_PUBLIC_SUPABASE_URL` + anon key only.

---

## 3. RentCast — Property and rent data for imports and underwriting

### Links & signup

- **Site:** https://www.rentcast.io  
- **API docs:** https://docs.rentcast.io (or contact for API access)
- **Pricing:** Typically subscription; check their site for plans.

### Initiation steps

1. Sign up at RentCast and subscribe to an API plan.
2. Obtain **API key** (or token) from their dashboard or support.
3. Store the key only in **Supabase Edge Function** secrets or your backend env (e.g. `RENTCAST_API_KEY`).
4. Create an Edge Function that accepts property identifier or address from the app and returns rent estimates/comps; app never sees the key.

### APIs / keys

| Item | Where | Use in PropFolio |
|------|--------|-------------------|
| API key | RentCast account / dashboard | Backend/Edge Function only: `RENTCAST_API_KEY` |

### PropFolio functions (and more)

- **Rent estimates:** Pre-fill or validate rent in underwriting and deal scoring.
- **Rent comps:** Support “rent coverage strength” and confidence.
- **Import enrichment:** When user adds by address or link, backend can fetch RentCast data and store in your DB.

**Integration:** Edge Function (e.g. `get-rent-estimate`) that calls RentCast; app calls the function via Supabase client.

---

## 4. Expo EAS — Cross-platform build and release workflow

### Links & signup

- **Expo account:** https://expo.dev/signup  
- **EAS docs:** https://docs.expo.dev/build/introduction/  
- **EAS Submit:** https://docs.expo.dev/submit/introduction/  
- **Pricing:** https://expo.dev/pricing (free tier for limited builds)

### Initiation steps

1. Create an **Expo account** at https://expo.dev and log in.
2. In the project: `cd expo-app` then `npx eas-cli login` (or `npm install -g eas-cli` then `eas login`).
3. **Configure EAS Build:**  
   `npx eas build:configure`  
   This creates or updates `eas.json` (e.g. profiles: `development`, `preview`, `production`).
4. **Credentials:** EAS can manage iOS (Apple) and Android (keystore) credentials, or you can use local credentials.
5. **First build:**  
   - iOS: `npx eas build --platform ios --profile preview` (or `production`).  
   - Android: `npx eas build --platform android --profile preview`.
6. **Submit to stores:**  
   `npx eas submit` (after build) or connect to App Store Connect / Google Play.

### APIs / keys

| Item | Where | Use |
|------|--------|-----|
| Expo account | expo.dev | Login for EAS CLI |
| Apple Developer | developer.apple.com | iOS builds & submit (EAS can store credentials) |
| Google Play Console | play.google.com/console | Android builds & submit |

### PropFolio functions (and more)

- **Build:** Reliable iOS/Android builds in the cloud; no need for Xcode/Android Studio on every machine.
- **Release:** Submit builds to TestFlight, App Store, and Google Play.
- **Updates (Expo Updates):** Push JS/asset updates without full store review (optional).

**App wiring:** Ensure `expo-app/app.json` has correct `expo.name`, `slug`, `ios.bundleIdentifier`, `android.package`; then use EAS as above.

---

## 5. Crash reporting — Firebase Crashlytics

**PropFolio** uses **`expo-app/src/services/monitoring`** as the only entry point; the native SDK is **`@react-native-firebase/crashlytics`** on iOS.

**Operational guide:** **`expo-app/docs/MONITORING_SETUP.md`** (initialization, plist, EAS, troubleshooting). **Manual plist / EAS file env:** **`docs/monitoring/FIREBASE_CRASHLYTICS_MANUAL_STEPS.md`**. **Historical migration audit:** **`docs/archive/migrations/MIGRATION_SENTRY_TO_CRASHLYTICS_AUDIT.md`**.

**Do not** add paid API keys for crash reporting to the client beyond what Firebase documents for your integration pattern. The **`GoogleService-Info.plist`** identifies the Firebase app — it is not a secret server key, but treat repo policy as for any client config file.

---

## 6. OpenAI API — Summaries, explanations, AI cleanup layers

### Links & signup

- **Platform:** https://platform.openai.com  
- **API keys:** https://platform.openai.com/api-keys  
- **Docs:** https://platform.openai.com/docs  
- **Pricing:** https://openai.com/pricing (per-token; no key from client)

### Initiation steps

1. Sign up at https://platform.openai.com and add payment method if required.
2. **Create API key:** API Keys → Create new secret key. Store in **Supabase Edge Function** secrets (e.g. `OPENAI_API_KEY`) or backend env only.
3. **Usage:** Only server-side (Edge Function or your API). App sends “please summarize this” or “explain this score”; backend calls OpenAI and returns the result.

### APIs / keys

| Item | Where | Use in PropFolio |
|------|--------|-------------------|
| API key | platform.openai.com → API Keys | Backend/Edge Function only: `OPENAI_API_KEY` |

### PropFolio functions (and more)

- **Summaries:** Short plain-English summary of a deal or analysis (per product rule: AI for explanations only).
- **Explanations:** “Why did my confidence score change?” in natural language.
- **AI cleanup:** Normalize or structure free-text input (e.g. listing descriptions) for display or storage.
- **No financial metrics:** Per PropFolio rules, AI must not calculate financials; only explain and summarize.

**Integration:** Edge Function (e.g. `openai-summarize`, `openai-explain`) that receives text/context from the app and returns AI output; app never sends or receives the API key.

---

## 7. Census API — Future Value Predictor inputs

### Links & signup

- **Census Bureau:** https://www.census.gov/data/developers/data-sets.html  
- **API docs:** https://www.census.gov/data/developers/guidance/api-user-guide.html  
- **Key (optional):** https://api.census.gov/data/key_signup.html  
- **Pricing:** Free; key optional for higher rate limits.

### Initiation steps

1. (Recommended) Request an **API key** at https://api.census.gov/data/key_signup.html for higher rate limits.
2. Use the key only in **backend/Edge Function** (e.g. `CENSUS_API_KEY`).
3. Build an Edge Function or cron job that pulls relevant Census data (e.g. population, income, housing) by geography and writes to your **market_snapshots** (or similar) table in Supabase for the Future Value Predictor.

### APIs / keys

| Item | Where | Use in PropFolio |
|------|--------|-------------------|
| API key | census.gov API key signup | Backend/Edge Function: `CENSUS_API_KEY` (optional; improves rate limits) |

### PropFolio functions (and more)

- **Future Value Predictor:** Demographics, income, housing counts as inputs to “market tailwinds” and future value logic.
- **Market context:** Enrich property views with area stats (e.g. median income, population growth).

**Integration:** Backend job or Edge Function that fetches Census data and stores it; app and scoring read from your DB, not Census directly.

---

## 8. Stripe — Payments and subscriptions

### Links & signup

- **Dashboard:** https://dashboard.stripe.com  
- **Signup:** https://dashboard.stripe.com/register  
- **Docs (API):** https://docs.stripe.com/api  
- **Docs (Subscriptions):** https://docs.stripe.com/billing/subscriptions/overview  
- **Docs (React Native / Expo):** https://docs.stripe.com/payments/accept-a-payment?platform=react-native  
- **Pricing:** https://stripe.com/pricing (per-transaction; no monthly fee for standard)

### Initiation steps

1. **Create a Stripe account** at https://dashboard.stripe.com/register (or log in).
2. **Get your keys:** Dashboard → **Developers** → **API keys**.
   - **Publishable key** (starts with `pk_test_` or `pk_live_`) → safe for the client; use as `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` when you add a payment UI.
   - **Secret key** (starts with `sk_test_` or `sk_live_`) → **backend/Edge Function only**; never in the client. Store as `STRIPE_SECRET_KEY` in Supabase Edge Function Secrets.
3. **Products & prices (subscriptions):** Dashboard → **Product catalog** → create Products (e.g. “PropFolio Pro”) and Prices (recurring monthly/yearly). Note the **Price IDs** (e.g. `price_xxx`) for your Edge Function.
4. **Backend flow:** Use a Supabase Edge Function (or your API) to:
   - Create a **Checkout Session** (Stripe API) with the customer’s email and price ID; return the session `url` or `id` to the app.
   - Or create a **Customer** and **Subscription** server-side; collect payment method via Stripe.js / React Native Stripe in the app and attach to the Customer.
5. **Webhooks:** Dashboard → **Developers** → **Webhooks** → Add endpoint (your Supabase Edge Function URL or webhook handler). Subscribe to `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`. Use the **Signing secret** (`whsec_xxx`) as `STRIPE_WEBHOOK_SECRET` in your Edge Function to verify events. On each event, update your Supabase `subscriptions` table so the app knows the user’s plan and status.
6. **Test mode:** Keep using `pk_test_` and `sk_test_` until you’re ready for production; then switch to `pk_live_` and `sk_live_` and set up live webhooks.

### APIs / keys

| Item | Where | Use in PropFolio |
|------|--------|-------------------|
| Publishable key | Dashboard → API keys → Publishable | Client (optional): `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` for Stripe UI (e.g. Payment Element). Omit until you add payment screens. |
| Secret key | Dashboard → API keys → Secret | Backend/Edge Function only: `STRIPE_SECRET_KEY` |
| Webhook signing secret | Dashboard → Webhooks → endpoint → Signing secret | Backend webhook handler: `STRIPE_WEBHOOK_SECRET` |

### PropFolio functions (and more)

- **Subscriptions:** Recurring plans (e.g. monthly Pro); sync status to Supabase `subscriptions` table via webhooks.
- **One-time payments:** If you offer one-off purchases (e.g. report export).
- **Invoices:** Stripe hosts invoices; link from your Settings or “Billing” screen.
- **Usage-based:** Optional metered billing later (e.g. per analysis) via Stripe metered usage.

**Integration:** Supabase holds the source of truth for “does this user have Pro?” (e.g. `subscriptions` table with `user_id`, `plan`, `status`, `stripe_subscription_id`). Edge Function creates Checkout/Subscription; webhook handler updates Supabase when Stripe events fire. App reads plan from Supabase, not from Stripe directly.

---

## 9. Suggested additional APIs / subscriptions

| Service | What it’s for | When to add |
|---------|----------------|-------------|
| **Stripe** | Payments, subscriptions, invoices | When you introduce paid plans; use with Supabase `subscriptions` table. |
| **RevenueCat** | In-app subscriptions (iOS/Android) with one backend | When you want App Store / Play billing without building billing yourself. |
| **ATTOM** | Parcel/property attributes (beds, baths, lot, etc.) | When you need richer property data than RentCast alone. |
| **Twilio / SendGrid** | Transactional email (verify email, password reset) | When Supabase email limits or custom domains are needed. |
| **Mixpanel / PostHog / Amplitude** | Product analytics, funnels, retention | When you want events and flows beyond usage events in Supabase. |
| **Zillow/Redfin (via proxy)** | Listing data when user pastes a link | When you have an agreement or proxy; keep behind your backend. |
| **Expo Updates** | OTA JS updates without store review | When you want to ship fixes/features without a full build. |

---

## 9. Environment variables checklist (expo-app)

Add to `expo-app/.env` (and document in `.env.example` without real values). **Never commit real keys.**

### Client-safe (EXPO_PUBLIC_*)

| Variable | Service | Required |
|----------|---------|----------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase | Yes, for auth/DB |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase | Yes, for auth/DB |

*Crash reporting uses **`GoogleService-Info.plist`** (or EAS `GOOGLE_SERVICES_INFO_PLIST`), not `EXPO_PUBLIC_*` — see **`expo-app/docs/MONITORING_SETUP.md`**.*

### Server / Edge Function only (never in client)

| Variable | Service |
|----------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase (admin) |
| `GOOGLE_MAPS_API_KEY` | Google Maps Platform |
| `RENTCAST_API_KEY` | RentCast |
| `OPENAI_API_KEY` | OpenAI |
| `CENSUS_API_KEY` | Census (optional) |
| `STRIPE_SECRET_KEY` | Stripe (payments; backend only) |
| `STRIPE_WEBHOOK_SECRET` | Stripe (webhook verification; backend only) |

**Optional client (when you add payment UI):** `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` — Stripe publishable key; safe to expose.

Set server keys in Supabase: **Project Settings → Edge Functions → Secrets** (or your CI/EAS secrets).

---

## 11. Recommended order of initiation

1. **Supabase** — Foundation for auth, DB, storage, and all server-side proxies.
2. **Expo EAS** — So you can build and ship iOS/Android.
3. **Firebase Crashlytics** (when integrated) — So you see crashes and errors in production.
4. **Google Maps Platform** — High impact on Import UX (autocomplete, validation).
5. **RentCast** — When you’re ready to enrich underwriting with rent data.
6. **OpenAI** — When you add summaries/explanations.
7. **Census** — When you implement or refine the Future Value Predictor.

Then add **Stripe** (see §8) when you launch paid plans, and **analytics** (Mixpanel/PostHog) when you want deeper product metrics.

---

## 12. References

- **Deploy Edge Functions (Google, RentCast, OpenAI, Census):** **`docs/DEPLOY-EDGE-FUNCTIONS.md`** — link project, set secrets, deploy so the app can call them.
- **expo-app env:** `expo-app/docs/ENV.md`
- **Founder API map:** `docs/FOUNDER-API-VENDOR-MAP.md`
- **Backend config (legacy iOS):** `docs/SETUP-BACKEND-CONFIG.md`
- **Supabase + Expo:** https://supabase.com/docs/guides/getting-started/quickstarts/react-native
