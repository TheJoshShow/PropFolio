import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme';

type Props = {
  /** E2E / Maestro — `propfolio.boot` */
  testID?: string;
};

/**
 * Shown while auth session hydrates — avoids blank frames and Stack flicker.
 */
export function AuthBootView({ testID = 'propfolio.boot' }: Props) {
  return (
    <View
      style={styles.root}
      accessibilityLabel="Loading account"
      testID={testID}
    >
      <ActivityIndicator size="large" color={colors.accentCta} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundPrimary,
    paddingVertical: spacing.xxxl,
  },
});
