import { View } from 'react-native';

import { WelcomeFeatureCard } from './WelcomeFeatureCard';
import { WELCOME_FEATURE_ITEMS } from './welcomeFeatureItems';
import { welcomeScreenStyles } from './welcomeScreenStyles';

/**
 * Renders the three welcome benefit cards from centralized copy + variant config.
 */
export function WelcomeFeatureCardList() {
  return (
    <View style={welcomeScreenStyles.cards}>
      {WELCOME_FEATURE_ITEMS.map((item) => (
        <WelcomeFeatureCard
          key={item.variant}
          variant={item.variant}
          title={item.title}
          description={item.description}
        />
      ))}
    </View>
  );
}
