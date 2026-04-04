import { StyleSheet } from 'react-native';

import { radius, semantic, spacing, textPresets } from '@/theme';

/**
 * Shared layout tokens for Financials / Renovation / Market analysis panels
 * (sheet cards, intro copy, expandable “more” row).
 */
export const analysisPanelStyles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  intro: {
    ...textPresets.bodySecondary,
    color: semantic.textSecondary,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  sheetCard: {
    padding: 0,
    overflow: 'hidden',
    backgroundColor: semantic.surface,
    borderRadius: radius.card,
  },
  sheetCardInner: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  moreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: semantic.border,
  },
  morePressed: {
    opacity: 0.85,
  },
  moreLabel: {
    ...textPresets.bodyMedium,
    fontSize: 16,
    color: semantic.textPrimary,
  },
});
