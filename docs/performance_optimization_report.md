# PropFolio – Performance Optimization Report

**Role:** Lead iOS Product Engineer

---

## 1. List performance

| Location | Implementation | Recommendation |
|----------|----------------|----------------|
| **Import suggestions** | `suggestions.slice(0, 5).map` with TouchableOpacity. | Small list; acceptable. If suggestions grow, use FlatList with keyExtractor and getItemLayout not needed for 5 items. |
| **Portfolio** | No list yet (empty state). | When wiring properties, use FlatList or SectionList with stable ids; avoid inline functions in renderItem. |
| **Settings** | ScrollView with static sections. | Fine. |

---

## 2. Image and chart rendering

| Item | Status |
|------|--------|
| **Images** | No property images in current import flow. When added: use appropriate resizeMode; consider caching (expo-image or FastImage). |
| **Charts** | No charts in current screens. If added: use native or lightweight lib; avoid heavy SVG on main thread. |

---

## 3. Startup and screen transition performance

| Area | Finding | Recommendation |
|------|---------|----------------|
| **Startup** | SplashScreen.preventAutoHideAsync(); fonts loaded then hide. Auth + Subscription context load on mount. | Keep. Consider lazy-initializing crash reporting after first paint. |
| **Transitions** | Default Stack/Tabs. | No custom heavy animations. Acceptable. |
| **Fonts** | SpaceMono loaded in _layout. | Single font; minimal impact. |

---

## 4. Rerenders

| Area | Risk | Recommendation |
|------|------|----------------|
| **Context** | AuthContext, SubscriptionContext, ImportResumeContext provide session/offerings/state. | Context value memoized where possible (SubscriptionContext already uses useMemo for value). |
| **Screens** | Screens re-render on context change. | Acceptable. For heavy screens (e.g. future property list), use React.memo on list items. |
| **Theme** | useThemeColors() returns new object when colorScheme changes. | Colors object is stable per scheme; no unnecessary rerenders from theme alone. |

---

## 5. Expensive computations (scoring/analysis)

| Location | Finding | Recommendation |
|----------|---------|----------------|
| **src/lib/scoring** | Pure functions (score, dealScoreInputsFromSimulation). | No network; run on JS thread. If inputs are large, consider running in worker (harder in RN). For typical single-property analysis, keep synchronous. |
| **src/lib/confidence** | evaluate() pure. | Same as above. |
| **Import flow** | geocodeAddress, placesAutocomplete, rentEstimate are async; state updates trigger rerenders. | Debounce already 400ms for autocomplete. Ensure loading states don’t cause layout thrash. |

---

## 6. Technical debt and quick wins

| Item | Action |
|------|--------|
| **responsiveContentContainer** | Platform.select: default {}; no-op on iOS. Keep. |
| **Lazy crash reporting** | crash reporting.init in _layout runs at startup. Optional: defer init until after RootLayout first paint. |
| **Bundle** | No analysis run here. Removing web/Android already reduced surface. |

---

## 7. Implementation checklist

- [ ] When adding property list: use FlatList with stable id and avoid inline renderItem.
- [ ] Optional: defer crash reporting.init by one frame after mount.
- [ ] No immediate code changes required for current scope; document for future list/chart work.
