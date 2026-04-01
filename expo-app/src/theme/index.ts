/**
 * Design tokens and theme (colors, typography, spacing).
 * Used by components and screens (iOS).
 */

export const spacing = {
  xxxs: 2,
  xxs: 4,
  xs: 8,
  s: 12,
  m: 16,
  l: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const radius = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 20,
  /** Pill / fully rounded (buttons, badges). */
  pill: 9999,
  full: 9999,
} as const;

export { lightColors, darkColors } from './colors';
export type { ColorScheme } from './colors';
export { fontSizes, fontWeights, lineHeights } from './typography';
export { primaryButtonGlow, cardShadow, surfaceSubtle } from './shadows';
export { iconSizes } from './icons';
export { headerSpacing, modalSpacing } from './layout';
