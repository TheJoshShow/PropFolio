# PropFolio Final Release Readiness Checklist

Purpose: prove the iPhone app works independently of any developer laptop, simulator cache, or local network.

Use this checklist before each TestFlight release candidate.

## Pass/Fail rule

- PASS only if every **Required** item is checked.
- If any Required item fails, do not release.

## 1) Environment and Hosting (Required)

- [ ] `EXPO_PUBLIC_SUPABASE_URL` points to hosted Supabase (`https://...supabase.co`), not localhost or LAN IP.
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` is present in EAS environment for the build profile.
- [ ] `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` is present in EAS environment for the build profile.
- [ ] `ASC_API_KEY_PATH` is valid on the CI/submission machine for App Store submission.
- [ ] Supabase Edge Functions used by app are deployed and reachable:
  - [ ] `geocode-address`
  - [ ] `places-autocomplete`
  - [ ] `rent-estimate`
  - [ ] `census-data`
  - [ ] `openai-summarize` (if enabled for this build)
  - [ ] `delete-account`
- [ ] Required Supabase Edge Function secrets are set in hosted project (not local `.env`):
  - [ ] `GOOGLE_MAPS_API_KEY`
  - [ ] `RENTCAST_API_KEY`
  - [ ] `CENSUS_API_KEY` (if census feature enabled)
  - [ ] `OPENAI_API_KEY` (if summaries enabled)

## 2) Security and Portability Scan (Required)

- [ ] No hardcoded personal credentials in repo (`.env`, keys, tokens, service-role keys).
- [ ] No mobile runtime dependency on localhost URLs.
- [ ] No mobile runtime dependency on LAN/private IP URLs.
- [ ] No feature requires the developer laptop, local tunnel, or local Supabase CLI to be online.

## 3) Auth and Deep Link Production Setup (Required)

- [ ] Supabase Auth redirect URLs include production app deep link callback.
- [ ] Confirmation email and password reset links route into app callback flow in TestFlight.
- [ ] New user can sign up, confirm email, sign in, sign out, and reset password on a fresh iPhone.
- [ ] Session restore works after app restart (without dev-only state).

## 4) Subscription and Store Setup (Required)

- [ ] RevenueCat app is linked to correct iOS bundle identifier.
- [ ] Offerings and product IDs are active and match app mapping.
- [ ] Paywall loads plans on device when store is available.
- [ ] Purchase completes and unlocks entitlement.
- [ ] Restore Purchases works on a second install/device.
- [ ] Free features remain usable if store is temporarily unavailable.

## 5) Fresh Install Functional QA (Required)

Run on a physical iPhone after deleting app and reinstalling from TestFlight.

- [ ] Launch app with no existing local cache/session.
- [ ] Sign up with a brand-new email.
- [ ] Import via Zillow URL works.
- [ ] Import via Redfin URL works.
- [ ] Manual address import works.
- [ ] Imported property saves to portfolio immediately.
- [ ] Portfolio still present after app restart and re-login.
- [ ] Portfolio map pin appears for imported property with valid address.
- [ ] Key metrics and score render for normal property data.
- [ ] What If edits recalculate metrics and persist.
- [ ] Paywall opens only where intended and can be dismissed safely.
- [ ] Restore purchases flow shows correct result state.

## 6) Offline Independence Validation (Required)

Perform at least one end-to-end run while the developer laptop is offline/shut down.

- [ ] App can sign in and load portfolio from hosted backend.
- [ ] Import + save still works.
- [ ] Map and scoring still work (with hosted services).
- [ ] Subscription status and paywall still load from hosted systems.

## 7) In-App QA Diagnostics (Recommended)

For internal QA builds, set:

- `EXPO_PUBLIC_ENABLE_QA_DIAGNOSTICS=true`

Then verify in Settings:

- Release readiness diagnostics show:
  - hosted Supabase config present
  - subscription config valid
  - auth redirect config valid
  - Supabase host is not localhost/LAN
- If any "Release blockers" appear, do not release until resolved.

## 8) Final Go/No-Go

- [ ] All Required sections are complete.
- [ ] No unresolved blocker remains in Settings diagnostics or release notes.
- [ ] Build uploaded and processed in App Store Connect.
- [ ] TestFlight smoke test completed on at least two different iPhone models.

Owner sign-off:

- Release candidate build number: `__________`
- Verified by: `__________`
- Date: `__________`
- Go / No-Go: `__________`
