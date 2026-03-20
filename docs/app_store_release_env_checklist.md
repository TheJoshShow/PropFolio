# PropFolio — App Store Release Environment Checklist

**Purpose:** Verify production environment values are set and documented before iOS App Store release.  
**Use with:** production_env_matrix.md, secret_boundary_audit.md, release_blocker_report.md.  
**Last updated:** [DATE]

---

## 1. Client env (expo-app) — required / recommended

Set these for the **production** build (EAS build or release build). Do not commit values; use EAS Secrets or a secure CI env.

| # | Variable | Required for release? | Verification |
|---|----------|------------------------|--------------|
| 1 | **EXPO_PUBLIC_SUPABASE_URL** | Yes (for real auth) | Production Supabase project URL. App will run in demo mode if missing. |
| 2 | **EXPO_PUBLIC_SUPABASE_ANON_KEY** | Yes (for real auth) | Production anon key from Supabase Dashboard. **Never** service role key. |
| 3 | **EXPO_PUBLIC_REVENUECAT_API_KEY_IOS** | Yes (for IAP) | RevenueCat Dashboard → API Keys → Public iOS key. Required for paywall and restore. |
| 4 | **EXPO_PUBLIC_PRIVACY_POLICY_URL** | Recommended (App Store) | Must resolve (e.g. https://propfolio.app/privacy). Match App Store Connect. |
| 5 | **EXPO_PUBLIC_TERMS_URL** | Recommended | Must resolve (e.g. https://propfolio.app/terms). |
| 6 | **EXPO_PUBLIC_SUPPORT_URL** | Recommended (App Store) | Must resolve; match App Store Connect Support URL. |
| 7 | **EXPO_PUBLIC_BILLING_HELP_URL** | Optional | If set, used for "Billing help & FAQ" in Settings. |
| 8 | **EXPO_PUBLIC_SENTRY_DSN** | Optional | If set, Sentry is enabled. Can leave empty for release. |

**Checklist:**

- [ ] All required variables set for the production build (EAS or release config).  
- [ ] No `.env` or `.env.production` with real values committed to git.  
- [ ] Privacy Policy, Terms, and Support URLs tested in Safari (resolve and load).  
- [ ] RevenueCat key is the **public** iOS key, not server/secret key.

---

## 2. Backend (Supabase Edge Functions) — production secrets

Configure in **Supabase Dashboard → Project Settings → Edge Functions → Secrets** (or equivalent) for the **production** project.

| # | Secret / env | Required for release? | Notes |
|---|--------------|------------------------|--------|
| 1 | **SUPABASE_URL** | Auto (Supabase) | Provided at runtime. |
| 2 | **SUPABASE_ANON_KEY** | Auto (Supabase) | Used in delete-account with request JWT. |
| 3 | **SUPABASE_SERVICE_ROLE_KEY** | Auto (Supabase) | Used in delete-account and revenuecat-webhook. |
| 4 | **GOOGLE_MAPS_API_KEY** | Yes (if using address/places) | Geocoding and Places; production API key with restrictions. |
| 5 | **RENTCAST_API_KEY** | Yes (if using rent estimate) | Rent estimate API; production key. |
| 6 | **OPENAI_API_KEY** | Optional (if using summarize) | Only if openai-summarize is used. |
| 7 | **CENSUS_API_KEY** | Optional (if using census-data) | Only if census-data is used. |
| 8 | **REVENUECAT_WEBHOOK_AUTHORIZATION** | Yes (if using RevenueCat) | From RevenueCat webhook config; validate incoming webhooks. |

**Checklist:**

- [ ] Production Supabase project has all required Edge Function secrets set.  
- [ ] No service role key or webhook secret in client code or client env.  
- [ ] RevenueCat webhook (if used) points to production Edge Function URL and uses correct authorization secret.

---

## 3. Documentation and templates

| # | Item | Done |
|---|------|------|
| 1 | **.env.example** lists all EXPO_PUBLIC_* vars used by the app (add SUPPORT and BILLING_HELP if missing). | ☐ |
| 2 | **production_env_matrix.md** reviewed and updated with any new vars. | ☐ |
| 3 | **Internal runbook or doc** states where production client env is set (e.g. EAS Secrets, CI). | ☐ |

---

## 4. Pre-submission verification (recap)

- [ ] Production env set for client (required + recommended vars).  
- [ ] Backend secrets set for production Supabase project.  
- [ ] Privacy Policy, Terms, Support URLs resolve and match App Store Connect.  
- [ ] Account deletion tested end-to-end (uses delete-account Edge Function with service role server-side only).  
- [ ] Restore purchases and subscription flow tested with production RevenueCat and production client key.  
- [ ] No __DEV__-only code paths that expose env or secrets in release build.

---

## 5. Quick reference — never in client

Do **not** put these in expo-app `.env` or any client bundle:

- SUPABASE_SERVICE_ROLE_KEY  
- GOOGLE_MAPS_API_KEY  
- RENTCAST_API_KEY  
- OPENAI_API_KEY  
- CENSUS_API_KEY  
- REVENUECAT_WEBHOOK_AUTHORIZATION  
- STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET  
- Any other server-only API key or webhook secret  

---

*See production_env_matrix.md and secret_boundary_audit.md.*
