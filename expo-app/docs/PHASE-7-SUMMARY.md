# Phase 7 — Responsive web (complete)

## Completed items

- **Responsive content width** — `src/utils/responsive.ts`: `MAX_CONTENT_WIDTH = 560`, `responsiveContentContainer` (web: maxWidth + alignSelf center; native: no-op).
- **Tab screens** — Home, Import, Portfolio, Settings use `responsiveContentContainer` on ScrollView `contentContainerStyle` so on desktop web content is centered and not full-bleed.

## Changed files

| File | Change |
|------|--------|
| `src/utils/responsive.ts` | **New** — Platform.select for web max-width container. |
| `app/(tabs)/index.tsx` | Use responsiveContentContainer. |
| `app/(tabs)/import.tsx` | Use responsiveContentContainer. |
| `app/(tabs)/portfolio.tsx` | Use responsiveContentContainer. |
| `app/(tabs)/settings.tsx` | Use responsiveContentContainer. |

## What to manually test

- **Web** — Run `npm run web`, resize to desktop width; confirm content stays centered with max width. Mobile width unchanged.
- **Native** — Confirm layout unchanged on iOS/Android.

## Remaining risk

- **URL routing on web** — Expo Router provides file-based routes; deep links (e.g. /import) work. No custom server-side routing added.
- **Tablet** — No separate breakpoints; same 560px cap on web.
