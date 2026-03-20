# Quarantined code (unused in production)

These files are **not used** by the current app. They were moved here during an audit so they can be restored if ever needed.

## Contents

- **`app/modal.tsx`** – Default Expo template modal screen. No navigation in the app links to `/modal`.
- **`components/EditScreenInfo.tsx`** – Expo “get started” helper (only used by the modal).
- **`components/StyledText.tsx`** – MonoText component (only used by EditScreenInfo).
- **`components/ExternalLink.tsx`** – Link that opens in browser (only used by EditScreenInfo).

## Restoring

To restore the modal screen:

1. Copy the four files back to `app/` and `components/`.
2. In `app/_layout.tsx`, add back: `<Stack.Screen name="modal" options={{ presentation: 'modal' }} />`
3. Fix any import paths so they point to `@/components/` and `@/constants/` as in the main app.

## Audit reference

See **`docs/release/AUDIT-OBSOLETE-UNUSED.md`** for the full audit and rationale.
