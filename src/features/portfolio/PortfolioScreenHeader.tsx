import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HEADER_NAV_BALANCE_WIDTH, HeaderActionSpacer, HeaderIconButton } from '@/components/navigation';
import { navigationChrome, semantic } from '@/theme';

type Props = {
  onPressSettings: () => void;
};

/**
 * In-screen portfolio top bar — avoids native stack `headerRight` bar-item chrome (iOS liquid-glass pill).
 */
export function PortfolioScreenHeader({ onPressSettings }: Props) {
  const insets = useSafeAreaInsets();
  const padL = Math.max(insets.left, navigationChrome.headerBarEdgePadding);
  const padR = Math.max(insets.right, navigationChrome.headerBarEdgePadding);

  return (
    <View style={[styles.shell, { paddingTop: insets.top, backgroundColor: semantic.background }]}>
      <View style={[styles.row, { paddingLeft: padL, paddingRight: padR }]}>
        <View style={styles.side}>
          <HeaderActionSpacer />
        </View>
        <Text style={styles.title} pointerEvents="none" accessibilityRole="header">
          PropFolio
        </Text>
        <View style={styles.side}>
          <HeaderIconButton
            name="settings-outline"
            accessibilityLabel="Settings"
            onPress={onPressSettings}
            visual="ghost"
            testID="propfolio.portfolio.header.settings"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: navigationChrome.headerActionMinHeight,
  },
  side: {
    width: HEADER_NAV_BALANCE_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: semantic.navy,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
