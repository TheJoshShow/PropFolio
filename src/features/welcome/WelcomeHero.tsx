import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { welcomeScreenStyles } from './welcomeScreenStyles';
import { welcomeTokens } from './welcomeTokens';

/**
 * Brand tile, wordmark, and tagline — static welcome hero block.
 */
export function WelcomeHero() {
  return (
    <>
      <View style={welcomeScreenStyles.iconTile} accessibilityLabel="PropFolio">
        <Ionicons name="home" size={36} color={welcomeTokens.navy} />
      </View>
      <Text style={welcomeScreenStyles.title} accessibilityRole="header">
        PropFolio
      </Text>
      <Text style={welcomeScreenStyles.subtitle}>Stop Guessing and Start Investing</Text>
    </>
  );
}
