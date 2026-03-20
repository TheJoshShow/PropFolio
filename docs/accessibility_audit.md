# PropFolio – Accessibility Audit

**Role:** Lead iOS Product Engineer

---

## 1. Current state

| Screen / Component | accessibilityLabel | accessibilityRole | accessibilityHint | Notes |
|--------------------|--------------------|-------------------|-------------------|--------|
| **Login** | Email, Password, Forgot password?, Try again, Sign up | link/button where used | — | Error has accessibilityRole="alert", accessibilityLiveRegion="polite". Good. |
| **Sign-up** | — | — | — | Missing labels on form fields and buttons. |
| **Forgot password** | — | — | — | Missing. |
| **Update password** | — | — | — | Missing. |
| **Home** | — | — | — | "Add property" button and card need label/hint. |
| **Import** | — | — | — | Link input, address input, suggestion rows, buttons need labels. |
| **Portfolio** | — | — | — | "Add property" button. |
| **Settings** | — | — | — | Rows, buttons, links. SettingsRow value has numberOfLines={1}; ensure accessibilityLabel has full value. |
| **Paywall** | — | — | — | Plan cards, Restore, Subscribe, Done. |
| **Button** | — | — | — | Title is visible text; add accessibilityLabel from title if not default. |
| **TextInput** | Optional label prop | — | — | Login passes accessibilityLabel; other screens don’t. |

---

## 2. Dynamic Type resilience

| Item | Status | Recommendation |
|------|--------|----------------|
| **Font scaling** | React Native Text allows scaling by default (allowFontScaling true). | Keep. Test with iOS Larger Text; ensure layout doesn’t break (flexWrap, numberOfLines, padding). |
| **Fixed sizes** | Theme fontSizes in pt. | Acceptable. Consider supporting larger accessibility sizes by scaling or using maxFontSizeMultiplier where clipping is risk. |
| **Line height** | Not set in theme. | Add lineHeight for body/title so wrapped text is readable at larger sizes. |

---

## 3. VoiceOver / TalkBack

| Requirement | Status |
|-------------|--------|
| All interactive elements focusable | Buttons and Pressables are focusable by default. |
| Logical order | Follows component order. Tab order: correct. |
| Labels describe purpose | Partial; many buttons only have title as label. Add accessibilityLabel where title is vague (e.g. "Done" → "Done, close paywall"). |
| Grouping | Sections (e.g. Settings) could use accessibilityRole="summary" or grouping for section headers (optional). |

---

## 4. Contrast and visibility

| Item | Status |
|------|--------|
| **Colors** | Semantic tokens (text, textSecondary, primary); sufficient contrast in light/dark. |
| **Error text** | colors.error on background; should meet contrast. |
| **Focus** | No visible focus ring on iOS by default; ensure selected state is clear. |

---

## 5. Implementation checklist

- [ ] **Login:** Keep existing labels; add accessibilityLabel to "Sign in" button if different from title.
- [ ] **Sign-up:** Add accessibilityLabel to all TextInputs (First name, Last name, Email, Password, Confirm password) and to "Create account" button.
- [ ] **Forgot password:** Add accessibilityLabel to Email input and "Send reset link" button.
- [ ] **Update password:** Add accessibilityLabel to New password, Confirm, and Submit button.
- [ ] **Home:** accessibilityLabel on "Add property" button (e.g. "Add property").
- [ ] **Import:** accessibilityLabel on Paste link input, Address input, "Import from link", "Use address", suggestion rows ("Address suggestion: {description}").
- [ ] **Portfolio:** accessibilityLabel on "Add property" button.
- [ ] **Settings:** accessibilityLabel on each Card row (e.g. "Email, {value}"); "Manage subscription", "Restore purchases", "Update password", "Sign out", "Delete account", and legal links.
- [ ] **Paywall:** accessibilityLabel on plan cards ("Monthly, Subscribe"), "Restore purchases", "Done".
- [ ] **Button:** Use title as accessibilityLabel when no custom label; allow override via accessibilityLabel prop (already passed through Pressable).
- [ ] **Theme:** Add lineHeights for body/title for Dynamic Type.
