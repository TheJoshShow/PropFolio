import { StyleSheet, View } from 'react-native';

import { PrimaryButton, SecondaryButton } from '@/components/ui';
import { semantic, spacing } from '@/theme';

import { welcomeLayout, welcomeElevation } from './welcomeLayout';
import { welcomeTokens } from './welcomeTokens';

type Props = {
  onSignIn: () => void;
  onCreateAccount: () => void;
  disabled?: boolean;
};

/**
 * Sign In (gold, ~55% width) + Create Account (white outline, ~45%) — shared radius & shadow language.
 */
export function WelcomeAuthButtons({ onSignIn, onCreateAccount, disabled }: Props) {
  return (
    <View style={styles.row}>
      <PrimaryButton
        label="Sign In"
        onPress={onSignIn}
        disabled={disabled}
        style={styles.primary}
        labelStyle={styles.primaryLabel}
        testID="propfolio.welcome.signIn"
      />
      <SecondaryButton
        label="Create Account"
        onPress={onCreateAccount}
        disabled={disabled}
        style={styles.secondary}
        labelStyle={styles.secondaryLabel}
        testID="propfolio.welcome.createAccount"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: welcomeLayout.buttonRowGap,
    width: '100%',
  },
  primary: {
    flexGrow: 11,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    minHeight: 52,
    borderRadius: welcomeLayout.buttonRadius,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: semantic.accentGold,
    ...welcomeElevation.buttonPrimary,
  },
  primaryLabel: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  secondary: {
    flexGrow: 9,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: 0,
    minHeight: 52,
    borderRadius: welcomeLayout.buttonRadius,
    paddingHorizontal: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: welcomeTokens.cardSurface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: welcomeTokens.borderSubtle,
    ...welcomeElevation.buttonSecondary,
  },
  secondaryLabel: {
    color: welcomeTokens.navy,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.15,
  },
});
