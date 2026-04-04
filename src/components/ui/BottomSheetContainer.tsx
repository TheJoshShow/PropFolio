import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, shadowStyle, spacing } from '@/theme';

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  /** Extra bottom padding in addition to safe area */
  contentBottomInset?: number;
};

/**
 * Presentational shell for modal sheets — pair with `presentation: 'modal'` or a portal library later.
 */
export function BottomSheetContainer({ children, style, contentBottomInset = spacing.md }: Props) {
  const { bottom } = useSafeAreaInsets();

  return (
    <View style={[styles.sheet, shadowStyle('md'), style]}>
      <View style={styles.handleWrap} accessibilityLabel="Sheet handle">
        <View style={styles.handle} />
      </View>
      <View style={[styles.body, { paddingBottom: bottom + contentBottomInset }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: colors.surfaceCard,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderBottomWidth: 0,
    overflow: 'hidden',
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
  },
  body: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
});
