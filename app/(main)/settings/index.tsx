import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Screen,
  SectionHeader,
  SettingsGroup,
  SettingsProfileRow,
  SettingsRow,
} from '@/components/ui';
import {
  LEGAL_PRIVACY_POLICY_URL,
  SUPPORT_EMAIL,
  SUPPORT_MAILTO,
} from '@/config';
import { useAuth } from '@/features/auth';
import { useSubscription } from '@/features/subscription';
import { openLegalDocument } from '@/lib/openLegalDocument';
import { hitSlop, iconSizes, semantic, spacing, textPresets } from '@/theme';

export default function SettingsIndexScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user, profile, signOut } = useAuth();
  const sub = useSubscription();

  const displayName =
    profile?.full_name?.trim() ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Investor';

  const email = user?.email ?? '—';

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Settings',
      headerTitleAlign: 'center',
      headerLargeTitle: false,
      headerShadowVisible: false,
      headerBackVisible: false,
      headerLeft: () => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          hitSlop={hitSlop}
          style={styles.headerSide}
        >
          <Ionicons name="chevron-back" size={iconSizes.xl} color={semantic.textPrimary} />
        </Pressable>
      ),
      headerRight: () => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Done"
          onPress={() => router.back()}
          hitSlop={hitSlop}
          style={styles.headerSide}
        >
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      ),
    });
  }, [navigation, router]);

  async function onSignOut() {
    await signOut();
    router.replace('/');
  }

  const openPrivacy = () => void openLegalDocument(LEGAL_PRIVACY_POLICY_URL);
  const openSupport = () => void Linking.openURL(SUPPORT_MAILTO);

  return (
    <Screen
      scroll
      safeAreaEdges={['bottom', 'left', 'right']}
      contentContainerStyle={styles.body}
      testID="propfolio.settings.index"
    >
      <SettingsProfileRow
        displayName={displayName}
        email={email}
        onPress={() => router.push('/settings/personal')}
      />

      <SettingsGroup>
        <SettingsRow
          label="Personal Information"
          isFirst
          leftIcon={<Ionicons name="person-outline" size={22} color={semantic.textSecondary} />}
          onPress={() => router.push('/settings/personal')}
        />
        <SettingsRow
          label="Security"
          leftIcon={<Ionicons name="shield-checkmark-outline" size={22} color={semantic.textSecondary} />}
          onPress={() => router.push('/settings/security')}
        />
        <SettingsRow
          label="Notification Settings"
          leftIcon={<Ionicons name="notifications-outline" size={22} color={semantic.textSecondary} />}
          onPress={() => router.push('/settings/notifications')}
        />
        <SettingsRow
          label="Membership"
          value={sub.tierLabel}
          leftIcon={<Ionicons name="diamond-outline" size={22} color={semantic.accentScore} />}
          onPress={() => router.push('/settings/subscription')}
        />
        {sub.hasAppAccess ? (
          <SettingsRow
            label="Buy import credits"
            value="Top up"
            leftIcon={<Ionicons name="bag-add-outline" size={22} color={semantic.accentGold} />}
            onPress={sub.openCreditTopUp}
          />
        ) : null}
        {!sub.hasAppAccess ? (
          <SettingsRow
            label="Start membership"
            value="View"
            leftIcon={<Ionicons name="rocket-outline" size={22} color={semantic.accentGold} />}
            onPress={sub.openPaywall}
          />
        ) : null}
      </SettingsGroup>

      <SectionHeader title="Preferences" style={styles.sectionTop} />
      <SettingsGroup>
        <SettingsRow
          label="Currency"
          value="USD"
          isFirst
          leftIcon={<Ionicons name="cash-outline" size={22} color={semantic.textSecondary} />}
          onPress={() => router.push('/settings/currency')}
        />
        <SettingsRow
          label="Theme"
          value="System"
          leftIcon={<Ionicons name="color-palette-outline" size={22} color={semantic.textSecondary} />}
          onPress={() => router.push('/settings/theme')}
        />
      </SettingsGroup>

      <SectionHeader title="Support" style={styles.sectionTop} />
      <SettingsGroup>
        <SettingsRow
          label="Help Center"
          isFirst
          leftIcon={<Ionicons name="help-circle-outline" size={22} color={semantic.textSecondary} />}
          onPress={() => router.push('/settings/help')}
        />
        <SettingsRow
          label="Contact Support"
          leftIcon={<Ionicons name="mail-outline" size={22} color={semantic.textSecondary} />}
          onPress={openSupport}
        />
        <SettingsRow
          label="Privacy Policy"
          leftIcon={<Ionicons name="document-text-outline" size={22} color={semantic.textSecondary} />}
          onPress={openPrivacy}
        />
      </SettingsGroup>

      {__DEV__ ? (
        <>
          <SectionHeader title="Developer" style={styles.sectionTop} />
          <SettingsGroup>
            <SettingsRow
              label="Style guide"
              value="UI"
              isFirst
              onPress={() => router.push('/style-guide')}
            />
          </SettingsGroup>
        </>
      ) : null}

      <View style={styles.footer}>
        <Pressable onPress={onSignOut} style={styles.signOut} accessibilityRole="button">
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
        <Text style={styles.supportEmail} numberOfLines={1}>
          {SUPPORT_EMAIL}
        </Text>
      </View>
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
  headerSide: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 44,
    justifyContent: 'center',
  },
  doneText: {
    ...textPresets.body,
    fontWeight: '600',
    color: semantic.accentGold,
  },
  sectionTop: {
    marginTop: spacing.xs,
    marginBottom: 0,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  signOut: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  signOutText: {
    ...textPresets.bodyMedium,
    color: semantic.danger,
  },
  supportEmail: {
    ...textPresets.captionSmall,
    color: semantic.textTertiary,
    paddingHorizontal: spacing.md,
  },
});
