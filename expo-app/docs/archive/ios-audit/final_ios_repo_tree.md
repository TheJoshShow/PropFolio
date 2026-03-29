# PropFolio — Final iOS Repo Tree (Post iOS-Only Plan)

**Canonical production iOS app:** `expo-app/` (Expo / React Native).  
**Legacy (retained):** `PropFolio/` (Swift).  
**Nested folder:** `expo-app/expo-app/` — confirmed unreferenced; remove manually if present.

---

## Top-level

```
PropFolio (repo root)/
├── expo-app/           # Canonical iOS app (Expo)
├── PropFolio/          # Legacy Swift app — do not delete; not used for launch
├── supabase/           # Backend (Edge Functions, migrations)
├── docs/               # Documentation
└── _archive_review/    # Archive (no _archive_review/web in repo)
```

---

## expo-app (high-level)

```
expo-app/
├── app/
│   ├── (auth)/           # login, sign-up, forgot-password
│   ├── (tabs)/           # index, import, portfolio, settings
│   ├── _layout.tsx
│   ├── paywall.tsx
│   ├── update-password.tsx
│   └── +not-found.tsx
├── src/
│   ├── components/
│   ├── config/           # billing, env, legalUrls
│   ├── contexts/        # Auth, Subscription, ImportResume
│   ├── features/        # paywall, portfolio, etc.
│   ├── hooks/
│   ├── lib/              # scoring, confidence, underwriting, etc.
│   ├── services/         # supabase, edgeFunctions, revenueCat, etc.
│   ├── store/           # Reserved
│   ├── theme/
│   ├── types/
│   └── utils/
├── assets/
├── app.json             # iOS only (no android/web)
├── package.json         # iOS-only production note; no android/web scripts
└── expo-app/            # Nested duplicate — remove manually if present
```

---

## Notes

- **expo-app:** Entry point for iOS (`npx expo run:ios`). EAS production profile should target iOS only.
- **PropFolio (Swift):** Legacy; no feature migration from Expo; retain per legacy_code_decision.md.
- **_archive_review/web:** Not present in repo; _archive_review kept as archive only.
