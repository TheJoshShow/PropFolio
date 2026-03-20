# PropFolio – iOS UX Optimization Report

**Role:** Lead iOS Product Engineer  
**Goal:** Make PropFolio feel like a premium iPhone-native app.

---

## 1. Non-iOS UX assumptions removed

| Location | Issue | Status |
|----------|--------|--------|
| **responsive.ts** | `Platform.select` for web maxWidth; default is `{}` for native. | Kept; harmless on iOS. Optionally simplify to always `{}` for iOS-only. |
| **sign-up.tsx** | `SignUpFormWrapper` and `Platform.OS === 'web'` for form/Enter submit. | Remove web branch; use View only (iOS-only). |
| **sign-up.tsx** | `Platform.OS === 'web'` in ScrollView contentStyle. | Remove; use single layout. |
| **(tabs)/_layout.tsx** | Portfolio tab icon still uses `name={{ ios, android, web }}`. | Use string `"list.bullet.rectangle.fill"` for consistency. |

---

## 2. Navigation, layout, spacing, typography

| Area | Current | Recommendation |
|------|---------|----------------|
| **Navigation** | Expo Router file-based; Stack + Tabs. Back behavior is predictable. | Keep. Ensure all modal/sheet dismiss is explicit (Done/Back). |
| **Layout** | ScrollView on all main screens; content padding from theme (spacing.m, paddingBottom xxxl). | Add safe area insets to tab screens so content clears home indicator and notch. |
| **Spacing** | Theme: spacing.xxxs (2) through xxxl (40). Used consistently. | Standardize screen-level padding: use spacing.xl horizontal, spacing.m top, paddingBottom = insets.bottom + spacing.xxl. |
| **Typography** | fontSizes xs (12) to title (28); fontWeights 400–700. No lineHeight scale. | Add lineHeight map to theme for Dynamic Type resilience; use in body/title styles. |
| **Safe areas** | Auth and Paywall use SafeAreaView edges={['top','bottom']}. Tab screens (Home, Import, Portfolio, Settings) use ScrollView only. | Wrap tab screen content in SafeAreaView or apply useSafeAreaInsets() to contentContainerStyle so tab content respects safe area. |
| **Keyboard** | KeyboardAvoidingView with behavior="padding" on login, sign-up, forgot-password, update-password. | Keep. Add keyboardVerticalOffset={0} or small value so header doesn’t overlap; ensure keyboardShouldPersistTaps="handled" on all form ScrollViews. |
| **Loading states** | ActivityIndicator in import (autocomplete, address), buttons show "Signing in…", "Saving…", etc. | Consistent. Add loading state to primary CTAs where missing. |
| **Empty states** | Portfolio: "No properties yet" + CTA. Home: card + "Add property". | Clear and actionable. Keep. |
| **Haptics** | None. | Optional: add light impact on primary button tap (expo-haptics) for premium feel. |

---

## 3. Viewport coverage (SE, standard, Pro Max)

| Viewport | Risk | Mitigation |
|----------|------|------------|
| **iPhone SE / small** | Dense forms; keyboard covers submit. | KeyboardAvoidingView + sufficient scroll padding (e.g. paddingBottom 120–140). Already in place on auth. Import screen: add KeyboardAvoidingView or ensure scroll padding. |
| **Standard iPhone** | Good. | No change. |
| **Pro Max / large** | responsiveContentContainer limits width on web; on native default is {}. | Content stays full width on native; consider maxWidth for tablet (e.g. 560) when supportsTablet is true. |

---

## 4. Touch targets, text, scroll, sheets

| Item | Finding | Action |
|------|---------|--------|
| **Touch targets** | Button minHeight 44; TextInput minHeight 44; Pressable "Forgot password", "Sign up" use minHeight 44 or hitSlop. | Audit all Pressable/TouchableOpacity: ensure ≥44pt or hitSlop. |
| **Clipped text** | numberOfLines used on Settings row value; suggestion rows use numberOfLines={1}. | Ensure critical labels (e.g. error messages) don’t clip; allow 2 lines where needed. |
| **Scroll behavior** | ScrollView throughout; no sticky headers. | Acceptable for current screens. If Settings grows, consider section list or sticky section headers. |
| **Tab bar** | Native tab bar (expo-router Tabs). | Keep. |
| **Modal sheets** | Paywall is full screen. | Consider presentation: 'modal' for paywall on iPhone for sheet-like feel (optional). |
| **Date/number formatting** | No date pickers in current flow. Numbers: toLocaleString() for rent. | Use locale from device when available (e.g. en-US). |
| **Keyboard avoidance** | Implemented on auth; Import has keyboardShouldPersistTaps only. | Add KeyboardAvoidingView to Import screen when address/link inputs are focused. |
| **Dark mode** | useThemeColors() from useColorScheme(); light/dark colors in theme. | Supported. Ensure no hardcoded #fff/#000 in screens. |
| **Orientation** | app.json orientation: portrait. | Keep for MVP. |
| **Accessibility** | Some accessibilityLabel/accessibilityRole on login; missing on many buttons and cards. | Add accessibilityLabel (and role where appropriate) to all interactive elements; see accessibility_audit.md. |
| **Dynamic Type** | Font sizes are fixed (theme fontSizes). | Add optional scaling via PixelRatio or allowFontScaling on Text; prefer allowFontScaling={true} and test with larger type. |

---

## 5. Apple HIG alignment

| HIG principle | Status |
|---------------|--------|
| Clear hierarchy | Title → subtitle → cards/sections. Good. |
| Native-feeling spacing | Theme spacing used; could tighten section spacing on small screens. |
| Predictable back | Stack back and tab switching are standard. |
| Sheet usage | Paywall could be modal sheet on iPhone. |
| Minimal clutter | Screens are focused. |
| Form ergonomics | Labels, errors, primary CTA; could add autoFocus on first field for login/sign-up. |
| Responsive loading/error | Loading states and Alert for errors; consider inline error below fields where applicable. |

---

## 6. Design tokens and scales

| Token | Current | Recommendation |
|-------|---------|----------------|
| **Spacing scale** | xxxs(2)–xxxl(40). | Keep; document as canonical scale. Use for all padding/margin. |
| **Typography scale** | fontSizes + fontWeights. | Add lineHeights (e.g. lineHeight: fontSize * 1.35 for body). |
| **Radius** | xs(4)–full(9999). | Keep. |
| **Colors** | lightColors/darkColors semantic. | Keep. |

---

## 7. Icon usage

| Location | Icon | Notes |
|----------|------|------|
| Tab bar | SymbolView (house.fill, plus.circle.fill, list.bullet.rectangle.fill, gearshape.fill) | SF Symbols; correct for iOS. Portfolio was still object form; standardize to string. |

---

## 8. Product flow summary

| Flow | Notes |
|------|--------|
| **Onboarding** | No dedicated onboarding; Home + Import explain value. Acceptable for MVP. |
| **Login/sign-up** | Clear; OAuth + magic link. Remove web-only form wrapper. |
| **Property import** | Paste link or address; autocomplete; clear CTAs. Add keyboard avoidance. |
| **Scoring/analysis** | Portfolio empty state; analysis flow not in scope for this pass. |
| **Paywall** | Shown on limit; placement correct. |
| **Settings/account** | Sections clear; restore, manage subscription, legal. |
| **Error messaging** | Alert-based; consider inline errors for forms. |

---

## 9. Implementation checklist (from this report)

- [ ] Add SafeAreaView or useSafeAreaInsets to tab screens (index, import, portfolio, settings).
- [ ] Fix portfolio tab icon to string name.
- [ ] Remove web branch from SignUpFormWrapper and sign-up ScrollView.
- [ ] Add KeyboardAvoidingView to Import screen.
- [ ] Add lineHeights to theme typography.
- [ ] Ensure all interactive elements have ≥44pt touch target or hitSlop.
- [ ] Add accessibilityLabel/accessibilityRole where missing (see accessibility_audit.md).
- [ ] Optional: expo-haptics on primary button tap.
