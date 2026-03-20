# PropFolio Design System (Premium Redesign)

## Summary

Centralized design system for a **premium, investor-focused** look: deep navy background, warm amber accent, high-contrast typography, and consistent spacing/radii. Theme is **system-aware** (dark = navy + amber; light = light gray + amber accent).

---

## Design Tokens

### Colors (`src/theme/colors.ts`)

| Token | Dark | Light |
|-------|------|-------|
| `background` | `#0F1419` (deep navy) | `#F1F5F9` |
| `surface` | `#1A2129` | `#FFFFFF` |
| `surfaceSecondary` | `#252D38` | `#E2E8F0` |
| `primary` | `#E5A00D` (amber) | `#C4890A` |
| `text` | `#F8FAFC` | `#0F172A` |
| `textSecondary` | `#94A3B8` | `#475569` |
| `textMuted` | `#64748B` | `#64748B` |
| `border` | `#334155` | `#CBD5E1` |
| `glowPrimary` | rgba amber | rgba amber |

### Typography (`src/theme/typography.ts`)

- **Hero:** 34px, bold (welcome headline).
- **Title:** 28px, bold (screen titles).
- **Section:** 24px, bold.
- **Body:** 16px, line height 22.
- **Caption / metadata:** 12–14px.
- **Button label:** 16px, bold.

### Spacing & radius (`src/theme/index.ts`)

- Spacing scale: `xxxs` (2) through `xxxl` (40).
- Radius: `xs` (4) to `xl` (20), plus `pill` (9999) for buttons/badges.

### Shadows (`src/theme/shadows.ts`)

- `primaryButtonGlow(glowColor)` — CTA glow.
- `cardShadow` — elevated cards.
- `surfaceSubtle` — light lift.

---

## Components Updated / Added

| Component | Location | Notes |
|-----------|----------|--------|
| **Button** | `src/components/Button.tsx` | Primary = dark text on amber, pill + glow; outline = borderFocus. |
| **Card** | `src/components/Card.tsx` | Uses `cardShadow` when elevated; radius `l`. |
| **PillBadge** | `src/components/PillBadge.tsx` | Outlined pill; amber border/text. |
| **FeatureRow** | `src/components/FeatureRow.tsx` | Icon in rounded square + description (welcome). |
| **TextInput** | `src/components/TextInput.tsx` | Unchanged; uses theme colors. |
| **Chip** | `src/components/Chip.tsx` | Unchanged; uses theme. |

---

## Welcome Screen Copy (Reference)

- **Badge:** `● AI DRIVEN REAL ESTATE INTELLIGENCE`
- **Hero:** `Find the deals` / `others miss.`
- **Subhead:** `Track, analyze & grow your portfolio.` / `Your edge in real estate investing.`
- **Features:**  
  - Uncover hidden deals before the market does  
  - Analyze cap rate, cash flow & ARV in seconds  
  - Track your portfolio like a pro investor  
- **Primary CTA:** Get Started For Free  
- **Secondary CTA:** Sign In  

---

## Files Changed

### New

- `app/(auth)/index.tsx` — Welcome screen.
- `src/theme/shadows.ts` — Glow and card shadows.
- `src/components/PillBadge.tsx` — Pill badge.
- `src/components/FeatureRow.tsx` — Feature row with icon.
- `docs/DESIGN_SYSTEM.md` — This file.

### Modified

- `src/theme/colors.ts` — Premium dark + light palette.
- `src/theme/typography.ts` — Added `hero` size/lineHeight.
- `src/theme/index.ts` — Export shadows; `radius.pill`.
- `src/components/Button.tsx` — Pill, glow, primary dark text.
- `src/components/Card.tsx` — `cardShadow`, radius `l`.
- `src/components/index.ts` — Export PillBadge, FeatureRow.
- `app/(auth)/_layout.tsx` — Stack includes `index`.
- `app/(auth)/login.tsx` — Back to welcome link; title "Sign in".
- `app/(auth)/sign-up.tsx` — Back to welcome link.
- `app/(tabs)/_layout.tsx` — Redirect to `/(auth)`; tab bar style.
- `app/(tabs)/index.tsx` — Home copy and card elevated.

---

## Screens / Components for Future Polish

- **Import flow** — Inputs and results already use theme; could add more card/empty states.
- **Portfolio list / property cards** — List item cards could use `elevated` and tighter hierarchy.
- **Property detail** — Score blocks and metrics could use more amber emphasis.
- **Paywall** — Already theme-driven; optional headline hierarchy pass.
- **Modals / bottom sheets** — If added, use `radius.l` and surface colors.

---

## Visual QA Checklist (iPhone / TestFlight)

1. **Welcome**
   - [ ] Deep navy background; amber accent and CTA.
   - [ ] Hero “Find the deals” / “others miss.” readable; “others miss.” in amber.
   - [ ] Pill badge and feature rows spaced correctly; no clipping.
   - [ ] “Get Started For Free” pill button with subtle glow; “Sign In” outlined.
   - [ ] Safe areas respected; scrolls on small devices.

2. **Auth**
   - [ ] Login / Sign up / Forgot password use same background and amber links.
   - [ ] “← Welcome” back link on login and sign-up.
   - [ ] Inputs and buttons use theme (surface, border, primary).

3. **Tabs**
   - [ ] Tab bar uses surface color; active tab amber.
   - [ ] Home title/subtitle hierarchy clear; card elevated.

4. **Contrast & touch**
   - [ ] Body text readable (no low-contrast amber-on-dark for long copy).
   - [ ] Buttons ≥ 44pt height; key actions obvious.
   - [ ] No content under notch or home indicator.

5. **Consistency**
   - [ ] No leftover teal/green or old light-only styles.
   - [ ] Cards and buttons use shared radius and shadows.
