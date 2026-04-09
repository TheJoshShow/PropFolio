/**
 * PropFolio theme — re-exports semantic colors, core tokens, and typography.
 * Prefer importing `semantic`, `textPresets`, and `heights` for new UI.
 */

export { colors, semantic } from './semantic';
export type { SemanticColors } from './semantic';
export { hitSlop, layout, navigationChrome, radius, spacing } from './tokensCore';
export { textPresets, typography } from './typographyPresets';
export {
  cardPadding,
  heights,
  iconSizes,
  tabSwitcher,
} from './componentSizes';
