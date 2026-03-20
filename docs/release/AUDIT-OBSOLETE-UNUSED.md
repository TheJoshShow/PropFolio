# PropFolio – Audit: Obsolete Files, Duplicates, and Unused Code

Audit date: March 2025. Scope: obsolete files, duplicate components, test-only paths, unused assets, unused env vars, stale migrations, dead navigation, experimental screens.

---

## 1. Summary

| Category | Finding | Action |
|----------|---------|--------|
| **Experimental / unused screens** | `app/modal.tsx` is in the root Stack but never linked from the app (no `router.push('/modal')`). | **Quarantined** – originals deleted; copies preserved in `expo-app/_quarantine/`; route removed from `_layout.tsx`. |
| **Components only used by modal** | `EditScreenInfo`, `StyledText`, `ExternalLink` are only used by `modal.tsx`. | **Quarantined** – originals deleted; copies in `expo-app/_quarantine/components/`. |
| **Duplicate components** | None found. Single `Button`, `Card`, `TextInput`, etc. in `src/components`. | — |
| **Test-only code paths** | `src/lib/scoring/__tests__/`, `src/lib/underwriting/__tests__/`; `src/test/setup.ts`. No test-only code in production entry points. | **Kept** – tests are appropriate; no removal. |
| **Unused assets** | `app.json` and `_layout.tsx` reference `assets/images/*` and `assets/fonts/SpaceMono-Regular.ttf`. All referenced. | — |
| **Unused environment variables** | `.env.example` documents Stripe vars; app uses RevenueCat only. Stripe is documented for future use. All `EXPO_PUBLIC_*` used in code are read (Supabase, RevenueCat, legal URLs, Sentry). | **No change** – .env.example is documentation; no dead env reads in code. |
| **Stale migrations** | `00002_create_subscriptions.sql` creates `subscriptions` (Stripe-oriented). App uses `subscription_status` (RevenueCat) from 00016+. No app code references `subscriptions` table. | **Not removed** – migrations are append-only; existing DBs may have the table. Documented as legacy. |
| **Dead navigation branches** | Modal route removed (see above). All other `router.push` targets exist: `/(tabs)/import`, `/(auth)/login`, `/paywall`, etc. | — |

---

## 2. Quarantined Items (provably unused)

The following were moved to **`expo-app/_quarantine/`** so they can be restored if ever needed. They are not referenced by the production app.

- **`app/modal.tsx`** – Default Expo template modal; no in-app navigation to it.
- **`components/EditScreenInfo.tsx`** – Only used by `modal.tsx` (Expo “get started” helper).
- **`components/StyledText.tsx`** – Only used by `EditScreenInfo.tsx` (MonoText).
- **`components/ExternalLink.tsx`** – Only used by `EditScreenInfo.tsx`.

**Still in use (do not remove):**

- **`components/Themed.tsx`**, **`useColorScheme`**, **`useClientOnlyValue`** – Used by `+not-found.tsx`, `_layout.tsx`, `(tabs)/_layout.tsx`, and `useThemeColors.ts`.
- **`constants/Colors.ts`** – Used by `Themed.tsx`.

---

## 3. Migrations note

- **00002_create_subscriptions.sql**: Creates `public.subscriptions` (Stripe fields). Current app uses **`subscription_status`** (from 00016) and RevenueCat. No code references `subscriptions`. Treat 00002 as legacy; do not delete migrations.

---

## 4. Files changed in this audit

| Action | Path |
|--------|------|
| **Deleted** (copies in quarantine) | `expo-app/app/modal.tsx` |
| **Deleted** (copies in quarantine) | `expo-app/components/EditScreenInfo.tsx`, `StyledText.tsx`, `ExternalLink.tsx` |
| **Created** | `expo-app/_quarantine/app/modal.tsx`, `_quarantine/components/EditScreenInfo.tsx`, `StyledText.tsx`, `ExternalLink.tsx` |
| **Modified** | `expo-app/app/_layout.tsx` – removed `<Stack.Screen name="modal" … />` |
| **Created** | `expo-app/_quarantine/README.md` – explains quarantine |
| **Created** | `docs/release/AUDIT-OBSOLETE-UNUSED.md` – this file |
