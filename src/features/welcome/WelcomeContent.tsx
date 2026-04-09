import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen } from '@/components/ui';
import { layout, spacing } from '@/theme';

import { WelcomeAuthButtons } from './WelcomeAuthButtons';
import { WelcomeFeatureCardList } from './WelcomeFeatureCardList';
import { WelcomeHero } from './WelcomeHero';
import { welcomeDividerStyle, welcomeLayout } from './welcomeLayout';
import { welcomeScreenStyles } from './welcomeScreenStyles';
import { welcomeTokens } from './welcomeTokens';

type Props = {
  isConfigured: boolean;
  onSignIn: () => void;
  onCreateAccount: () => void;
};

/**
 * Welcome landing UI (hero, features, CTAs). Auth routing stays in `app/index.tsx`.
 */
export function WelcomeContent({ isConfigured, onSignIn, onCreateAccount }: Props) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const gutter = layout.screenPaddingHorizontal * 2;
  const columnMaxWidth = Math.min(welcomeLayout.contentMax, windowWidth - gutter);
  const minContentHeight = Math.max(0, windowHeight - insets.top - insets.bottom);
  const bottomInset = Math.max(insets.bottom, spacing.md);

  return (
    <Screen
      scroll
      testID="propfolio.welcome"
      style={{ backgroundColor: welcomeTokens.canvas }}
      safeAreaEdges={['top', 'right', 'left', 'bottom']}
      contentContainerStyle={{
        flexGrow: 1,
        minHeight: minContentHeight,
        paddingTop: welcomeLayout.scrollPaddingTop,
        paddingBottom: bottomInset + spacing.lg,
      }}
    >
      <View style={welcomeScreenStyles.balanceRoot}>
        <View style={welcomeScreenStyles.balanceSpacer} />

        <View style={[welcomeScreenStyles.column, { maxWidth: columnMaxWidth }]}>
          <View style={welcomeScreenStyles.heroSection}>
            <WelcomeHero />
            <View
              style={[
                welcomeDividerStyle,
                {
                  marginTop: welcomeLayout.subtitleToDivider,
                  marginBottom: welcomeLayout.dividerToCards,
                },
              ]}
            />
          </View>

          <View style={welcomeScreenStyles.featuresSection}>
            <WelcomeFeatureCardList />
          </View>

          <View style={[welcomeScreenStyles.buttonBlock, { marginTop: welcomeLayout.cardsToButtons }]}>
            <WelcomeAuthButtons
              onSignIn={onSignIn}
              onCreateAccount={onCreateAccount}
              disabled={!isConfigured}
            />
          </View>
        </View>

        <View style={welcomeScreenStyles.balanceSpacer} />
      </View>
    </Screen>
  );
}
