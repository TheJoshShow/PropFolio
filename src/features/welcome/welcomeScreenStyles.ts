/**
 * StyleSheet for welcome landing layout — single source for hero + column rhythm.
 */
import { Platform, StyleSheet } from 'react-native';

import { spacing } from '@/theme';

import { welcomeElevation, welcomeLayout } from './welcomeLayout';
import { welcomeTokens } from './welcomeTokens';

export const welcomeScreenStyles = StyleSheet.create({
  /** Fills scroll min-height; flex spacers above/below center the main column. */
  balanceRoot: {
    width: '100%',
    flex: 1,
    flexDirection: 'column',
  },
  balanceSpacer: {
    flexGrow: 1,
    flexShrink: 1,
    minHeight: welcomeLayout.verticalBalanceSpacerMin,
  },
  /** Hero (logo, wordmark, tagline) + divider — reads as one header unit. */
  heroSection: {
    width: '100%',
    alignItems: 'center',
  },
  featuresSection: {
    width: '100%',
    alignSelf: 'stretch',
  },
  column: {
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  iconTile: {
    width: welcomeLayout.iconTileSize,
    height: welcomeLayout.iconTileSize,
    borderRadius: welcomeLayout.iconTileRadius,
    backgroundColor: welcomeTokens.cardSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: welcomeLayout.iconTileToTitle,
    ...welcomeElevation.iconTile,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: welcomeTokens.navy,
    textAlign: 'center',
    letterSpacing: Platform.select({ ios: -0.45, default: -0.2 }),
    lineHeight: 42,
  },
  subtitle: {
    marginTop: welcomeLayout.titleToSubtitle,
    fontSize: 15,
    fontWeight: '500',
    color: welcomeTokens.muted,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.xs,
    maxWidth: '100%',
  },
  cards: {
    alignSelf: 'stretch',
    gap: welcomeLayout.featureCardGap,
  },
  buttonBlock: {
    alignSelf: 'stretch',
  },
});
