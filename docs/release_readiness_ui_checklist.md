# PropFolio – Release Readiness UI Checklist

**Use before App Store submission.**

---

## 1. iPhone viewports

- [ ] **iPhone SE (small):** Login, sign-up, forgot password, update password: form and submit visible with keyboard open; scroll works.
- [ ] **Standard iPhone:** All screens layout correctly; no clipped content.
- [ ] **Pro Max / large:** Content readable; no excessive whitespace or stretch.

---

## 2. Safe area and layout

- [ ] **Notch / Dynamic Island:** Tab screens (Home, Import, Portfolio, Settings) respect top and bottom safe area.
- [ ] **Home indicator:** Bottom padding so content and tab bar are not obscured.
- [ ] **Orientation:** Portrait; no broken layout in portrait.

---

## 3. Keyboard

- [ ] **Login:** Keyboard doesn’t cover Sign in button; KeyboardAvoidingView works.
- [ ] **Sign-up:** Same for Create account.
- [ ] **Forgot password:** Same for Send reset link.
- [ ] **Update password:** Same for Submit.
- [ ] **Import:** Address/link input: keyboard doesn’t cover "Use address" / "Import from link"; tap outside dismisses keyboard or scroll reveals button.

---

## 4. Touch targets and gestures

- [ ] All buttons and tappable elements ≥44pt or have hitSlop.
- [ ] No accidental double-tap or scroll conflicts.
- [ ] Tab bar switches correctly; back navigation works.

---

## 5. Typography and text

- [ ] No clipped text (e.g. long email in Settings); numberOfLines or ellipsis where appropriate.
- [ ] Error messages visible and readable (contrast, size).
- [ ] Critical labels (form labels, section headers) use theme fontSizes.

---

## 6. Loading and empty states

- [ ] Loading: spinner or disabled button state shown during sign-in, import, restore, delete account.
- [ ] Empty portfolio: clear message and "Add property" CTA.
- [ ] Paywall: "Loading plans…" when offerings load; fallback copy when unavailable.

---

## 7. Dark mode

- [ ] All screens support dark mode (useThemeColors); no hardcoded light-only colors.
- [ ] Contrast sufficient in both schemes.

---

## 8. Accessibility

- [ ] All interactive elements have accessibilityLabel (or visible text that VoiceOver can read).
- [ ] Form fields have labels (visible or accessibilityLabel).
- [ ] Test with VoiceOver: flow is understandable; no dead ends.

---

## 9. Modals and sheets

- [ ] Paywall: dismisses correctly (Done / back).
- [ ] Alerts: correct titles and buttons (e.g. Sign out confirmation, Delete account).

---

## 10. Trust and copy

- [ ] Error messages: clear and actionable (e.g. "Enter a valid email").
- [ ] Paywall: billing disclosure and Terms/Privacy links visible.
- [ ] Settings: Restore purchases, Manage subscription, Delete account available and working.

---

## 11. Performance

- [ ] No visible jank on screen transitions or scroll.
- [ ] No long blank screen on app launch (splash then content).

---

## 12. Sign-off

- [ ] UX review passed (hierarchy, spacing, HIG alignment).
- [ ] Accessibility audit items addressed.
- [ ] Tested on device (at least one physical iPhone) in light and dark mode.
