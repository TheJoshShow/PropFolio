import { spacing } from './tokensCore';

/**
 * Reusable dimensions for buttons, inputs, icons, tabs — iOS-friendly minimums.
 */
export const heights = {
  buttonMin: 52,
  buttonCompact: 48,
  inputMin: 52,
  inputSearch: 48,
  tabMin: 44,
  listRowMin: 52,
  metricRowMin: 48,
  topBar: 44,
} as const;

export const iconSizes = {
  xs: 16,
  sm: 20,
  md: 22,
  lg: 24,
  xl: 28,
} as const;

export const cardPadding = {
  sm: spacing.md,
  md: spacing.lg,
  lg: spacing.xl,
} as const;

export const tabSwitcher = {
  minHeight: heights.tabMin,
  paddingH: spacing.md,
  gap: spacing.xs,
  pillRadius: 10,
} as const;
