# Second-Pass UI Polish — Summary

## Focus Areas

- **Theme token consistency** — Replaced hardcoded colors, radii, font sizes, and weights with design tokens.
- **Spacing rhythm** — Standardized screen padding to `spacing.xl` where content starts; card/list padding aligned.
- **Button hierarchy** — Primary uses `onPrimary` for label; Best Value badge uses `onPrimary`; outline/secondary unchanged.
- **Icon consistency** — Welcome logo uses `colors.onPrimary` for tint (dark on amber).
- **Loading/empty/error** — Cards use `elevated` where appropriate; error/empty states use theme typography and spacing.
- **Small-screen/safe area** — Content padding and error wrappers use consistent padding; +not-found uses SafeAreaView.

---

## Theme Changes

- **`src/theme/colors.ts`**  
  - Added **`onPrimary`** (`#0F172A`) to both `darkColors` and `lightColors` for text/labels on primary (e.g. primary button, Best Value badge).

---

## Files Touched (Second Pass)

### Theme
- **`src/theme/colors.ts`** — Added `onPrimary` token.

### Components
- **`src/components/Button.tsx`** — Primary label uses `colors.onPrimary` instead of hardcoded `#0F172A`.
- **`src/components/FeatureRow.tsx`** — Replaced `fontSize: 15` and `fontWeight: '500'` with `fontSizes.base`, `fontWeights.medium`, `lineHeights.base`.

### Welcome & Auth
- **`app/(auth)/index.tsx`** — Logo tint uses `colors.onPrimary`; logo `borderRadius: 12` → `radius.m`; Sign In button `borderRadius: 9999` → `radius.pill`; added `radius` import.
- **`app/(auth)/login.tsx`** — Subtitle `lineHeight: 22` → `lineHeights.base`; added `lineHeights` import.

### Import
- **`app/(tabs)/import.tsx`** — Content padding `spacing.m` → `spacing.xl`; suggestions container `borderRadius: 8` → `radius.s`, `borderColor` from theme (`colors.border`), background `colors.surface`; added `radius` import.

### Portfolio
- **`app/(tabs)/portfolio/index.tsx`** — Title/subtitle padding `spacing.m` → `spacing.xl`; list content padding `spacing.xl`; row `borderRadius: radius.m` → `radius.l`; all `fontWeight: '600'/'700'` → `fontWeights.semibold`/`fontWeights.bold`; empty/error Cards use `elevated`; card horizontal margin `spacing.m` → `spacing.xl`; footer error padding `spacing.xl`; scoreDisclaimer lineHeight `lineHeights.sm`; added `fontWeights` import.
- **`app/(tabs)/portfolio/[id].tsx`** — Content padding `spacing.m` → `spacing.xl`; all string font weights replaced with `fontWeights.*`; error wrap padding `spacing.m` → `spacing.xl`; error Cards use `elevated`; added `fontWeights` import.

### Settings
- **`app/(tabs)/settings.tsx`** — Content padding `spacing.m` → `spacing.xl`; section header `marginTop: spacing.m` → `spacing.l`; card `marginBottom: spacing.s` → `spacing.m`.

### Paywall
- **`src/features/paywall/PaywallContent.tsx`** — Content padding `spacing.m` → `spacing.xl`; headline `lineHeight: 34` → `lineHeights.title`; subheadline `lineHeight: 24` → `lineHeights.lg`; Best Value badge text color from `colors.onPrimary` (removed hardcoded `#fff`); added `lineHeights` import.

### Global / Other
- **`app/+not-found.tsx`** — Reworked to use `useThemeColors`, `SafeAreaView`, theme `spacing`/`fontSizes`/`fontWeights`; primary-colored link; removed dependency on `@/components/Themed` and hardcoded colors/fonts; navigation via `router.replace('/(tabs)')`.

---

## Standardization Summary

| Item | Before | After |
|------|--------|--------|
| Screen content padding | Mixed `spacing.m` / `spacing.xl` | `spacing.xl` for main content |
| Card radius (list/portfolio) | `radius.m` | `radius.l` for list rows |
| Pill / full rounded | `9999` or `12` | `radius.pill`, `radius.m` |
| Font weights | String `'600'`, `'700'`, `'500'` | `fontWeights.semibold`, `fontWeights.bold`, `fontWeights.medium` |
| Line heights | Magic numbers (22, 34, 24) | `lineHeights.base`, `lineHeights.title`, `lineHeights.lg` |
| Text on primary | `#0F172A` / `#fff` | `colors.onPrimary` |
| Suggestion list (import) | `borderRadius: 8`, rgba border | `radius.s`, `colors.border`, `colors.surface` |
| Error/empty cards | Default Card | Card with `elevated` where appropriate |
| +not-found | Themed + hardcoded | Theme tokens + SafeAreaView |

---

## Visual QA Checklist (Quick Pass)

- [ ] **Welcome** — Logo and Sign In button use theme radius; no hardcoded tints.
- [ ] **Login / Sign up** — Subtitle and body use theme line heights.
- [ ] **Import** — Content padding and suggestion list match other screens; border/background from theme.
- [ ] **Portfolio list** — Row radius and padding consistent; empty/error cards elevated.
- [ ] **Property detail** — Content padding and error cards consistent; all labels use fontWeights.
- [ ] **Settings** — Section and card spacing consistent.
- [ ] **Paywall** — Best Value badge readable (onPrimary on amber); content padding and line heights from theme.
- [ ] **+not-found** — Background and text from theme; link uses primary; safe area respected.
