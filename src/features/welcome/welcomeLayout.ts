/**
 * Welcome screen spacing, radii, and elevation — tuned to design render.
 */
import { Platform, StyleSheet } from 'react-native';

import { spacing } from '@/theme';

import { welcomeTokens } from './welcomeTokens';

const shadow = welcomeTokens.shadowTint;

export const welcomeLayout = {
  contentMax: 400,

  iconTileSize: 88,
  iconTileRadius: 22,
  featureIconColumnWidth: 50,
  featureIconWell: 48,
  featureCardRadius: 18,
  featureCardPaddingH: 16,
  featureCardPaddingV: 16,
  featureCardGap: 12,
  featureIconToTextGap: 12,
  featureIconGlyphSize: 22,

  buttonRadius: 14,
  buttonRowGap: 10,

  /**
   * Top inset inside scroll content (SafeAreaView already handles notch).
   * Matches auth/paywall `spacing.sm` top breathing room.
   */
  scrollPaddingTop: spacing.sm,
  iconTileToTitle: 12,
  titleToSubtitle: 8,
  /** Tagline → divider: tight enough to read as one hero unit. */
  subtitleToDivider: 14,
  dividerToCards: 12,
  /** Feature stack → CTAs: clear separation without a floating button row. */
  cardsToButtons: spacing.xl,
  /** Minimum flex-spacer size when the column is taller than the viewport (spacers collapse toward this). */
  verticalBalanceSpacerMin: spacing.xs,
} as const;

export const welcomeElevation = {
  iconTile: {
    shadowColor: shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: Platform.OS === 'ios' ? 0.042 : 0.07,
    shadowRadius: 12,
    elevation: 2,
  },
  featureCard: {
    shadowColor: shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: Platform.OS === 'ios' ? 0.034 : 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  buttonPrimary: {
    shadowColor: shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonSecondary: {
    shadowColor: shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
} as const;

export const welcomeDividerStyle = {
  height: StyleSheet.hairlineWidth,
  backgroundColor: welcomeTokens.divider,
  width: '86%' as const,
  alignSelf: 'center' as const,
};
