import { StyleSheet, View, type ViewProps } from 'react-native';

import { navigationChrome } from '@/theme';

import { HEADER_NAV_BALANCE_WIDTH } from './headerChrome';

/**
 * Invisible layout slot so the navigation title stays centered when only one side has an action.
 * No visible chrome — avoids “ghost” circles from empty bar-button backgrounds.
 */
export function HeaderActionSpacer(props: Pick<ViewProps, 'testID'>) {
  return <View pointerEvents="none" style={styles.spacer} testID={props.testID} />;
}

const styles = StyleSheet.create({
  spacer: {
    width: HEADER_NAV_BALANCE_WIDTH,
    minHeight: navigationChrome.headerActionMinHeight,
  },
});
