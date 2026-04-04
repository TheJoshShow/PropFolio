import { Platform, type TextStyle } from 'react-native';

import { semantic } from './semantic';

/**
 * Central typography presets — use in new primitives and migrate screens incrementally.
 */
export const textPresets = {
  pageTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: Platform.select({ ios: 0.25, default: 0 }),
    lineHeight: 34,
    color: semantic.textPrimary,
  } satisfies TextStyle,

  pageTitleLarge: {
    fontSize: 34,
    fontWeight: '700' as const,
    letterSpacing: Platform.select({ ios: 0.35, default: 0 }),
    lineHeight: 41,
    color: semantic.textPrimary,
  } satisfies TextStyle,

  sectionTitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
    color: semantic.textTertiary,
  } satisfies TextStyle,

  cardTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: Platform.select({ ios: -0.35, default: 0 }),
    lineHeight: 25,
    color: semantic.textPrimary,
  } satisfies TextStyle,

  metricLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    letterSpacing: 0.4,
    textTransform: 'uppercase' as const,
    color: semantic.textTertiary,
  } satisfies TextStyle,

  metricValue: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: -0.35,
    fontVariant: ['tabular-nums'] as TextStyle['fontVariant'],
    color: semantic.textPrimary,
  } satisfies TextStyle,

  body: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 24,
    color: semantic.textPrimary,
  } satisfies TextStyle,

  bodySecondary: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 22,
    color: semantic.textSecondary,
  } satisfies TextStyle,

  bodyMedium: {
    fontSize: 17,
    fontWeight: '500' as const,
    lineHeight: 22,
    color: semantic.textPrimary,
  } satisfies TextStyle,

  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
    color: semantic.textTertiary,
  } satisfies TextStyle,

  captionSmall: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    color: semantic.textTertiary,
  } satisfies TextStyle,

  button: {
    fontSize: 17,
    fontWeight: '600' as const,
    lineHeight: 22,
  } satisfies TextStyle,

  tab: {
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 20,
  } satisfies TextStyle,

  tabInactive: {
    fontSize: 15,
    fontWeight: '500' as const,
    lineHeight: 20,
    color: semantic.textSecondary,
  } satisfies TextStyle,

  inputLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 20,
    color: semantic.textPrimary,
  } satisfies TextStyle,

  inputPlaceholder: {
    color: semantic.placeholder,
  } satisfies TextStyle,
} as const;

/**
 * Legacy `typography` export shape — maps old keys to presets for gradual migration.
 */
export const typography = {
  screenTitle: textPresets.pageTitleLarge,
  screenTitleSmall: textPresets.pageTitle,
  sectionHeader: textPresets.sectionTitle,
  cardTitle: textPresets.cardTitle,
  metricLabel: textPresets.metricLabel,
  body: textPresets.body,
  bodyMedium: textPresets.bodyMedium,
  bodySecondary: textPresets.bodySecondary,
  caption: textPresets.caption,
  captionSmall: textPresets.captionSmall,
} as const;
