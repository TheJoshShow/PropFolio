import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppCloseButton,
  HEADER_NAV_BALANCE_WIDTH,
  HeaderActionSpacer,
} from '@/components/navigation';
import { navigationChrome, semantic, spacing, textPresets } from '@/theme';

type Props = {
  title: string;
  onClose: () => void;
};

/** Centered title + ghost close — Sign In / Create Account modals. */
export function AuthFormHeader({ title, onClose }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <>
      <View
        style={[
          styles.row,
          {
            paddingLeft: Math.max(insets.left, navigationChrome.headerBarEdgePadding),
            paddingRight: Math.max(insets.right, navigationChrome.headerBarEdgePadding),
          },
        ]}
      >
        <HeaderActionSpacer />
        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
          {title}
        </Text>
        <View style={styles.sideRight}>
          <AppCloseButton onPress={onClose} testID="propfolio.auth.header.close" />
        </View>
      </View>
      <View style={styles.divider} />
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: spacing.md,
    minHeight: navigationChrome.headerActionMinHeight,
  },
  sideRight: {
    width: HEADER_NAV_BALANCE_WIDTH,
    minHeight: navigationChrome.headerActionMinHeight,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    ...textPresets.pageTitle,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: semantic.textPrimary,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: semantic.border,
    marginBottom: spacing.lg,
  },
});
