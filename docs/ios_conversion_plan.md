# PropFolio – iOS-Only Conversion Plan

**Recommendation:** Keep the current Expo/React Native stack and target **iOS only**. Remove or refactor Android and web support to reduce risk, effort, and time to production.

**Reference:** audit_report_ios_only.md, cleanup_candidates.csv.

---

## Recommendation justification

| Criterion | Option 1: Keep stack, target iOS only | Option 2: Rewrite selected pieces natively (Swift) |
|-----------|--------------------------------------|---------------------------------------------------|
| **Effort** | Low–medium: config, scripts, Platform branches, copy, optional dependency removal. | High: duplicate UI and flows in Swift or bridge to existing PropFolio (Swift) codebase. |
| **Risk** | Low: existing Expo iOS build and App Store readiness already documented; removing platforms reduces surface. | Higher: two stacks to maintain or large migration; regression risk. |
| **Performance** | Slightly better: smaller effective surface, no web/Android code paths. | Native can be faster in theory; current app has no reported performance issues. |
| **Launch speed** | Fastest: phased cleanup over days, not weeks. | Slower: rewrite or integration takes weeks/months. |

**Conclusion:** Option 1 is the **lowest-risk path to production** for an exclusive iOS app. Option 2 is only justified if there is a hard requirement for native Swift UI or native modules Expo cannot provide.

---

## Phased execution plan

### Phase 0: Verification (no destructive changes)

- [ ] Confirm **expo-app/expo-app** is not referenced by any build script, EAS config, or CI. If referenced, document and leave as-is; otherwise mark for removal in Phase 1.
- [ ] Confirm **_archive_review** and **_archive_review/web** are not referenced by docs or scripts. Document decision: keep as archive or remove in Phase 1.
- [ ] Run full test suite and typecheck (`npm run validate` in expo-app). Record baseline.
- [ ] Create a backup branch or tag before Phase 1 (e.g. `pre-ios-only-cleanup`).

**Deliverable:** Verification checklist completed; baseline green; backup branch.

---

### Phase 1: Config and scripts (iOS-only target)

- [ ] **app.json:** Remove the `android` key (package, adaptiveIcon, predictiveBackGestureEnabled). Remove the `web` key (bundler, output, favicon). Keep `ios` and root-level fields (name, slug, version, scheme, plugins, experiments, extra).
- [ ] **package.json:** Remove or comment the `"android"` and `"web"` scripts (or leave for local dev only and document that production builds are iOS-only). No dependency changes yet.
- [ ] **EAS (if added):** Ensure production profile builds only iOS (e.g. `"platform": "ios"` or equivalent). Document in docs/release.

**Deliverable:** App and build config target iOS only; Android/web not used for release.

---

### Phase 2: Assets (delete after verification)

- [ ] Remove **expo-app/assets/images/android-icon-foreground.png**, **android-icon-background.png**, **android-icon-monochrome.png** (after app.json android block is removed).
- [ ] Optionally remove **expo-app/assets/images/favicon.png** if web is no longer built (confirm no other reference).
- [ ] Do **not** remove icon.png, splash-icon.png, or SpaceMono font; they are used for iOS.

**Deliverable:** No Android/web-specific assets in repo; iOS assets unchanged.

---

### Phase 3: Platform.OS and copy refactors (keep but refactor)

- [ ] **app/_layout.tsx:** Replace `isWeb = Platform.OS === 'web'` with a single check for crash reporting: e.g. only init crash reporting when `Platform.OS === 'ios'` (or keep `!== 'web'` if Android might return later).
- [ ] **app/(tabs)/_layout.tsx:** SymbolView `name` – use only the `ios` value (e.g. `name="house.fill"` if API accepts string, or `name={{ ios: 'house.fill' }}` and rely on iOS).
- [ ] **app/(tabs)/settings.tsx:** Remove `Platform.OS === 'web'` branches; update "Subscription management is available in the iOS or Android app" to "Subscription management is available in the PropFolio app" or "in this app". Ensure restore and delete account are visible and working on iOS.
- [ ] **app/paywall.tsx:** Remove web early-return and `Platform.OS !== 'web'` conditionals so paywall and purchase UI always show on iOS.
- [ ] **src/contexts/AuthContext.tsx:** Remove or no-op web-only logic (WebBrowser.maybeCompleteAuthSession, web early return in sign-out or session restore) for iOS-only.
- [ ] **src/services/supabase.ts:** Remove web-only branches (localStorage, detectSessionInUrl for web) if building iOS-only; or leave and rely on Platform.OS so behavior is correct on device.
- [ ] **src/services/revenueCat.ts:** Optionally simplify isNative to `Platform.OS === 'ios'`; no functional change if Android is never built.
- [ ] **src/utils/subscriptionManagement.ts:** Keep iOS path; remove or update Android path and fallback copy to "this app" or "PropFolio".
- [ ] **src/config/billing.ts:** For iOS-only: getRevenueCatApiKey() return only iOS key; isBillingConfigured() check only iOS key. Remove or comment ENV_REVENUECAT_API_KEY_ANDROID usage.
- [ ] **src/features/paywall/PaywallContent.tsx:** Remove `Platform.OS !== 'web'` wrapper so content always shows.
- [ ] **src/features/paywall/paywallCopy.ts:** Replace "iOS and Android" with "this app" or "PropFolio on your device".
- [ ] **src/utils/authRedirect.ts:** No-op or remove web URL session handling for iOS-only.

**Deliverable:** No web or Android code paths required for iOS build; copy and behavior are iOS-appropriate.

---

### Phase 4: Optional dependency and file cleanup

- [ ] **react-native-web:** If web is permanently dropped, remove from package.json dependencies and run `npm install`. Verify no remaining imports of `react-native-web` in app or src (grep). Expo and some deps may still reference it; only remove if build and tests pass.
- [ ] **app/+html.tsx:** If EAS/Expo iOS build does not require it, remove or leave in place (Expo may still expect it for meta; confirm with Expo docs).
- [ ] **src/store/index.ts:** Either document as "reserved for future global state" or remove and delete any imports (currently none in production code).

**Deliverable:** Smaller dependency set and no dead web-only entry files, if safe.

---

### Phase 5: PropFolio (Swift) and nested expo-app

- [ ] **PropFolio/** (Swift): **Do not delete** in this plan. Decision: (A) Abandon Swift codebase and use Expo as the single iOS app, or (B) Replace Expo with Swift app. If (A): document "Expo is the canonical iOS app; PropFolio is legacy" and optionally move PropFolio to _archive_native or leave in repo. If (B): create a separate migration plan. No destructive change until decision is recorded.
- [ ] **expo-app/expo-app:** If Phase 0 confirmed it is unused, remove the directory (or move to _quarantine). If it is a submodule or used by tooling, document and leave as-is.

**Deliverable:** Clear decision on Swift codebase; nested expo-app removed or documented.

---

### Phase 6: Final validation and release

- [ ] Run `npm run validate` (typecheck + test) in expo-app.
- [ ] Run iOS app in simulator and on device: auth (sign up, login, magic link if used), import (address, free limit, paywall), purchase/restore, delete account, Settings links.
- [ ] Confirm EAS production build uses only iOS and has EXPO_PUBLIC_SUPABASE_*, EXPO_PUBLIC_REVENUECAT_API_KEY_IOS set.
- [ ] Update docs/release/APP-STORE-PRODUCTION-READINESS.md and APP-STORE-SUBMISSION-CHECKLIST.md to state "iOS only" where relevant.

**Deliverable:** Green tests; manual smoke test passed; docs updated; ready for App Store upload.

---

## Order of operations summary

1. **Phase 0:** Verify nested folder and archive; baseline tests; backup branch.  
2. **Phase 1:** app.json + package.json (iOS-only target).  
3. **Phase 2:** Remove Android/web assets.  
4. **Phase 3:** Refactor Platform.OS and copy in app and src.  
5. **Phase 4:** Optional: remove react-native-web, +html.tsx, store placeholder.  
6. **Phase 5:** Decide and document PropFolio (Swift); remove or keep expo-app/expo-app.  
7. **Phase 6:** Validate, smoke test, update release docs.

**Do not refactor or delete until Phase 0 is complete and this plan is approved.**
