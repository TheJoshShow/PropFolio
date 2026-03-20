/**
 * Typography tokens: hierarchy for hero, section, body, captions.
 * Prioritizes strong hierarchy and readability on iPhone.
 */

export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  title: 28,
  /** Hero headline on welcome / key screens. */
  hero: 34,
} as const;

export const fontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

/** Line heights for body/title readability and accessibility. */
export const lineHeights = {
  xs: 16,
  sm: 20,
  base: 22,
  lg: 24,
  xl: 26,
  xxl: 30,
  title: 34,
  hero: 40,
} as const;
