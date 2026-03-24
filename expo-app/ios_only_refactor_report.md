# PropFolio — iOS-Only Refactor Report

**Source of truth:** ios_conversion_plan.md, audit_report_ios_only.md  
**Scope:** Phases 1–4 config, assets, Platform.OS, and copy.  
**Date:** [DATE]

---

## 1. Config and scripts (Phase 1)

| Item | Before | After |
|------|--------|-------|
| **app.json** | Already had only `expo.ios` and root fields; no `android` or `web` keys | No change |
| **package.json** | No `android` or `web` scripts | Added `description`: "PropFolio iOS app (Expo). Production builds are iOS-only; no android or web scripts." |
| **EAS** | No eas.json | Document in release docs: production profile iOS only when EAS is added |

---

## 2. Assets (Phase 2)

| Item | Result |
|------|--------|
| **Android icons** | android-icon-foreground/background/monochrome not found in assets/images. No deletion. |
| **favicon** | Not found. No deletion. |
| **iOS assets** | icon.png, splash-icon.png, fonts unchanged. |

---

## 3. Platform.OS and copy (Phase 3)

| Location | Refactor |
|----------|----------|
| **app/_layout.tsx** | Already `isIOS = Platform.OS === 'ios'` for crash reporting. No change. |
| **app/(tabs)/_layout.tsx** | SymbolView already single string (`house.fill`, etc.). No change. |
| **app/(tabs)/settings.tsx** | Already iOS hint; no web-only copy. No change. |
| **app/paywall.tsx** | No web early-return. No change. |
| **AuthContext.tsx** | Web block (WebBrowser.maybeCompleteAuthSession) left in place; no-op on iOS. |
| **supabase.ts** | Web branches (localStorage, detectSessionInUrl) left for type safety. |
| **subscriptionManagement.ts** | Comment updated to "iOS-only production app"; logic unchanged. |
| **billing.ts** | Already iOS-only behavior; no change. |
| **PaywallContent.tsx** | Fixed Terms link: `openUrl` → `openUrlSafe`. |
| **paywallCopy.ts** | Already iOS/PropFolio wording. No change. |
| **authRedirect.ts** | Left in place (no-op on iOS). |

**Intent:** No destructive removal of auth, Supabase, RevenueCat, import, delete-account, legal, or support flows. Platform.OS branches that are no-op on iOS retained for type safety and minimal risk.

---

## 4. Optional cleanup (Phase 4)

| Item | Decision |
|------|----------|
| **react-native-web** | Not removed. Optional per plan; may be required by Expo. Deferred. |
| **+html.tsx** | Not in app directory. No action. |
| **src/store/index.ts** | Kept; reserved for future global state. |

---

## 5. Summary

- **Config:** app.json already iOS-only; package.json annotated.
- **Assets:** No Android/web assets present; none removed.
- **Code:** One bug fix (PaywallContent openUrl → openUrlSafe); one comment update (subscriptionManagement). No removal of auth, subscription, import, or legal/support flows.
- **Optional:** react-native-web and store left as-is.
