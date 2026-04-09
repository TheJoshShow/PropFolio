import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { welcomeLayout, welcomeElevation } from './welcomeLayout';
import { welcomeTokens } from './welcomeTokens';

export type WelcomeFeatureVariant = 'import' | 'scores' | 'roi';

type IonName = ComponentProps<typeof Ionicons>['name'];

const VARIANTS: Record<WelcomeFeatureVariant, { icon: IonName; iconColor: string; circle: string }> = {
  import: {
    icon: 'checkmark',
    iconColor: welcomeTokens.navy,
    circle: welcomeTokens.iconGold,
  },
  scores: {
    icon: 'bar-chart',
    iconColor: welcomeTokens.iconOnGreen,
    circle: welcomeTokens.iconGreen,
  },
  roi: {
    icon: 'calculator',
    iconColor: welcomeTokens.iconOnGreen,
    circle: welcomeTokens.iconGreen,
  },
};

type Props = {
  variant: WelcomeFeatureVariant;
  title: string;
  description: string;
};

export function WelcomeFeatureCard({ variant, title, description }: Props) {
  const v = VARIANTS[variant];
  const well = welcomeLayout.featureIconWell;
  return (
    <View style={styles.card}>
      <View style={[styles.iconColumn, { width: welcomeLayout.featureIconColumnWidth }]}>
        <View style={[styles.iconWell, { width: well, height: well, borderRadius: well / 2, backgroundColor: v.circle }]}>
          <Ionicons name={v.icon} size={welcomeLayout.featureIconGlyphSize} color={v.iconColor} />
        </View>
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.desc}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: welcomeTokens.cardSurface,
    borderRadius: welcomeLayout.featureCardRadius,
    paddingVertical: welcomeLayout.featureCardPaddingV,
    paddingHorizontal: welcomeLayout.featureCardPaddingH,
    ...welcomeElevation.featureCard,
  },
  iconColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: welcomeLayout.featureIconToTextGap,
  },
  iconWell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingRight: 2,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: welcomeTokens.navy,
    letterSpacing: Platform.select({ ios: -0.25, default: 0 }),
    lineHeight: 22,
  },
  desc: {
    fontSize: 14,
    fontWeight: '400',
    color: welcomeTokens.muted,
    lineHeight: 20,
    letterSpacing: Platform.select({ ios: -0.1, default: 0 }),
  },
});
