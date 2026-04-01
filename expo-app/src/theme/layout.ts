/**
 * Layout tokens for headers, cards, and safe-area padding.
 * These are semantic so we can tune spacing without touching every screen.
 */

import { spacing } from './index';

export const headerSpacing = {
  top: spacing.l,
  horizontal: spacing.xl,
  bottom: spacing.m,
} as const;

export const modalSpacing = {
  vertical: spacing.xxxl,
  horizontal: spacing.xl,
} as const;

