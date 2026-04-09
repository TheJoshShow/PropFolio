import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, Screen } from '@/components/ui';
import { LEGAL_PRIVACY_POLICY_URL, LEGAL_TERMS_OF_SERVICE_URL, SUPPORT_MAILTO } from '@/config';
import { openLegalDocument } from '@/lib/openLegalDocument';
import { hitSlop, semantic, spacing, textPresets } from '@/theme';

export default function SettingsHelpCenterScreen() {
  const router = useRouter();

  return (
    <Screen scroll safeAreaEdges={['bottom', 'left', 'right']} contentContainerStyle={styles.body}>
      <Card elevation="xs" shape="sheet" style={styles.card}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reset password"
          onPress={() => router.push('/forgot-password')}
          hitSlop={hitSlop}
          style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
        >
          <Text style={styles.linkLabel}>Reset password</Text>
          <Text style={styles.linkHint}>Email link to sign back in</Text>
        </Pressable>
        <View style={styles.sep} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Privacy policy"
          onPress={() => void openLegalDocument(LEGAL_PRIVACY_POLICY_URL)}
          hitSlop={hitSlop}
          style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
        >
          <Text style={styles.linkLabel}>Privacy Policy</Text>
          <Text style={styles.linkHint}>Opens in browser</Text>
        </Pressable>
        <View style={styles.sep} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Terms of service"
          onPress={() => void openLegalDocument(LEGAL_TERMS_OF_SERVICE_URL)}
          hitSlop={hitSlop}
          style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
        >
          <Text style={styles.linkLabel}>Terms of Service</Text>
          <Text style={styles.linkHint}>Opens in browser</Text>
        </Pressable>
        <View style={styles.sep} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Email support"
          onPress={() => void Linking.openURL(SUPPORT_MAILTO)}
          hitSlop={hitSlop}
          style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
        >
          <Text style={styles.linkLabel}>Email support</Text>
          <Text style={styles.linkHint}>Opens mail</Text>
        </Pressable>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.sm,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  linkRow: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.xxs,
  },
  pressed: {
    backgroundColor: semantic.surfaceMuted,
  },
  linkLabel: {
    ...textPresets.bodyMedium,
    color: semantic.textPrimary,
  },
  linkHint: {
    ...textPresets.captionSmall,
    color: semantic.textTertiary,
  },
  sep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: semantic.border,
    marginLeft: spacing.lg,
  },
});
