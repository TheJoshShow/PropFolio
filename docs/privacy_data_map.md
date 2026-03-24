# PropFolio Privacy Data Map

**Purpose:** Map every place user data is collected, stored, transmitted, or shared for App Store Privacy Nutrition Labels, Privacy Policy, and review responses.  
**Date:** 2025-03-12.

---

## 1. Data collected by the app (first-party)

| Data category | Collected | Stored (where) | Transmitted (to whom) | Purpose |
|---------------|-----------|----------------|------------------------|---------|
| **Account (email, auth)** | Yes (sign-up/sign-in) | Supabase Auth (`auth.users`); session in AsyncStorage (device) | Supabase (your project) | Authentication, account management |
| **Profile (display name)** | Yes (optional, sign-up) | Supabase `profiles` | Supabase | App profile, display name |
| **Property data** | Yes (user-entered or imported) | Supabase `properties`, `portfolios` | Supabase | Underwriting, scoring, portfolio |
| **Import history** | Yes (per import) | Supabase `property_imports` | Supabase | Free-tier limit, audit |
| **Subscription state** | Yes (entitlement, plan) | Device: AsyncStorage (subscription cache); Server: Supabase `subscription_status` | Supabase; RevenueCat | Gating, Manage subscription |
| **Usage events** | Yes (funnel events) | Supabase `usage_events` (user_id, event_type, metadata) | Supabase | Analytics; metadata is non-PII (source, outcome, etc.) |
| **Address / query (geocode, autocomplete)** | Yes (when user types address) | Not stored by app; sent to Edge Function | Google (via Supabase Edge) | Address normalization, suggestions |
| **Address (rent estimate)** | Yes (normalized address) | Not stored by app; sent to Edge Function | RentCast (via Supabase Edge) | Rent estimate for underwriting |
| **Crash/error data** | Yes (when crash reporting DSN set) | crash reporting servers | crash reporting | Crash reporting; currently sendDefaultPii configurable |

---

## 2. Storage locations

| Location | Data stored | Retention / control |
|----------|-------------|---------------------|
| **Supabase (your project)** | Auth users, profiles, properties, portfolios, property_imports, subscription_status, usage_events | Per your Supabase and data retention policy; account deletion removes auth user and can cascade per RLS/schema |
| **Device (AsyncStorage / UserDefaults)** | Supabase session (tokens); subscription cache (hasProAccess, plan name, expiration) | Session cleared on sign-out; subscription cache keyed by user id, cleared on sign-out |
| **RevenueCat** | App user id (Supabase user id), purchase/entitlement state | Per RevenueCat policy; user id is opaque to RevenueCat unless you link elsewhere |
| **crash reporting** | Crash reports, breadcrumbs, device/OS, optional PII if sendDefaultPii true | Per crash reporting policy; recommend sendDefaultPii false and no custom PII in breadcrumbs |

---

## 3. Third-party SDKs and data sharing

| SDK / service | Data shared with | Privacy manifest / signature | Notes |
|---------------|------------------|-----------------------------|--------|
| **@supabase/supabase-js** | Your Supabase project (you control data) | N/A (first-party backend) | Session, API calls; no third-party analytics in SDK |
| **react-native-purchases (RevenueCat)** | RevenueCat | RevenueCat provides privacy manifest; may require declaration in App Privacy | User id (Supabase id), purchase tokens, product ids; no email from app |
| **Third-party crash SDK (if added)** | Vendor TBD | Follow vendor App Privacy guidance when integrated | Crashes, device/OS context per vendor defaults |
| **@react-native-async-storage/async-storage** | Local device only | App declares NSPrivacyAccessedAPICategoryUserDefaults (CA92.1) in app.json | No transmission |
| **Expo (expo-router, expo-linking, etc.)** | No external analytics by default | Expo modules as needed | No user data sent to Expo by default |
| **Google (via Edge Functions)** | Google Maps Platform (Geocoding, Places) | Not in app binary; server-side only | Address strings only; no user id sent from app |

---

## 4. Data not collected

- **Precise location:** Not collected.
- **Contacts, photos, camera:** Not used.
- **Health, financial account credentials:** Not collected.
- **Passwords:** Sent to Supabase Auth over HTTPS; not stored in plain text; not logged.

---

## 5. Account deletion and data removal

- **In-app:** Settings → Delete account → confirmation → Edge Function `delete-account` deletes the auth user in Supabase.
- **Effect:** Auth user removed; associated data (profiles, portfolios, properties, property_imports, subscription_status, usage_events) should be handled by your schema (cascade delete or retention policy). Document in Privacy Policy what is deleted and what may be retained for legal/backup.
- **RevenueCat:** Deleting the auth user does not automatically delete RevenueCat data; document that purchase history may remain with the store (Apple) and RevenueCat per their policies.
- **crash reporting:** Events may remain per crash reporting retention; no user id needed if sendDefaultPii false and no custom user id set.

---

## 6. Privacy Policy checklist (must disclose)

- Identity of data controller and contact (e.g. support@propfolio.app).
- What data is collected (account, profile, property data, usage events, subscription state, crash data if crash reporting used).
- Legal basis / purpose for each category.
- Who it is shared with (Supabase as processor, RevenueCat, crash reporting, Google via Edge Functions) and for what purpose.
- Retention and deletion (account deletion; subscription cache; crash reporting/RevenueCat retention).
- User rights (access, deletion, portability as applicable).
- Cross-border transfer if applicable.
- Cookie/device ID use if any (e.g. RevenueCat device id).

Use this map to fill App Store Privacy Nutrition Labels and to keep the Privacy Policy accurate.
