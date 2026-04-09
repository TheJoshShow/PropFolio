import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { navigationChrome, semantic, spacing, textPresets } from '@/theme';

import { HEADER_NAV_BALANCE_WIDTH } from './headerChrome';
import { HeaderActionSpacer } from './HeaderActionSpacer';

export type AppHeaderProps = {
  title: string;
  /** Left zone — e.g. `HeaderIconButton` or `HeaderActionSpacer` */
  left?: ReactNode;
  right?: ReactNode;
  /** Extra top inset (usually `useSafeAreaInsets().top`) for full-screen headers */
  insetTop?: number;
  showDivider?: boolean;
  style?: ViewStyle;
  /** `numberOfLines` for title */
  titleLines?: number;
  /**
   * When true, row has no horizontal padding (e.g. header sits inside a parent that already applies screen padding).
   */
  omitRowPadding?: boolean;
};

/**
 * In-screen header row (not the native stack header): balanced 3-column layout with centered title.
 * Prefer native `headerLeft` / `headerRight` when already inside a stack.
 */
export function AppHeader({
  title,
  left,
  right,
  insetTop = 0,
  showDivider = true,
  style,
  titleLines = 1,
  omitRowPadding = false,
}: AppHeaderProps) {
  return (
    <View style={[{ paddingTop: insetTop }, style]}>
      <View style={[styles.row, omitRowPadding && styles.rowFlush]}>
        <View style={styles.side}>{left ?? <HeaderActionSpacer />}</View>
        <Text style={styles.title} numberOfLines={titleLines} ellipsizeMode="tail" accessibilityRole="header">
          {title}
        </Text>
        <View style={styles.side}>{right ?? <HeaderActionSpacer />}</View>
      </View>
      {showDivider ? <View style={styles.divider} /> : null}
    </View>
  );
}

const sideW = HEADER_NAV_BALANCE_WIDTH;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: navigationChrome.headerActionMinHeight,
    paddingHorizontal: navigationChrome.headerBarEdgePadding,
  },
  rowFlush: {
    paddingHorizontal: 0,
  },
  side: {
    width: sideW,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    ...textPresets.bodyMedium,
    fontSize: 17,
    fontWeight: '600',
    color: semantic.textPrimary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: semantic.border,
    marginTop: spacing.xs,
  },
});
