/**
 * Non-color tokens — spacing, radius, layout. Safe to import from componentSizes without cycles.
 */

export const spacing = {
  micro: 2,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  section: 48,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  /** White cards in mocks — slightly tighter than lg */
  card: 14,
  full: 9999,
} as const;

export const hitSlop = { top: 12, bottom: 12, left: 12, right: 12 } as const;

export const layout = {
  screenPaddingHorizontal: spacing.md,
  screenPaddingVertical: spacing.lg,
  listContentBottom: spacing.xxxl,
  minTapSize: 44,
} as const;
