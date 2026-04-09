import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppBackButton,
  HeaderActionSpacer,
  headerLeadingInset,
  headerTrailingInset,
} from '@/components/navigation';
import {
  Screen,
  SectionHeader,
  SettingsGroup,
  SettingsProfileRow,
  SettingsRow,
} from '@/components/ui';
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '@/config';
import { useAuth } from '@/features/auth';
import { resolveUserFullNameForDisplay } from '@/services/auth';
import { useSubscription } from '@/features/subscription';
import { semantic, spacing, textPresets } from '@/theme';

export default function SettingsIndexScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user, profile, signOut } = useAuth();
  const sub = useSubscription();

  const displayName = resolveUserFullNameForDisplay(profile, user);

  const email = user?.email ?? '—';

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Settings',
      headerTitleAlign: 'center',
      headerLargeTitle: false,
      headerShadowVisible: false,
      headerBackVisible: false,
      headerLeft: () => <AppBackButton onPress={() => router.back()} testID="propfolio.settings.header.back" />,
      headerRight: () => <HeaderActionSpacer />,
      headerLeftContainerStyle: headerLeadingInset(insets.left),
      headerRightContainerStyle: headerTrailingInset(insets.right),
    });
  }, [navigation, router, insets.left, insets.right]);

  async function onSignOut() {
    await signOut();
    router.replace('/');
  }

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

      <SectionHeader title="General" style={styles.sectionAfterProfile} />
      <SettingsGroup>
        <SettingsRow
          label="Notification Settings"
          isFirst
          leftIcon={<Ionicons name="notifications-outline" size={22} color={semantic.textSecondary} />}
          onPress={() => router.push('/settings/notifications')}
        />
        <SettingsRow
          label="Membership"
          value={sub.tierLabel}
          leftIcon={<Ionicons name="diamond-outline" size={22} color={semantic.accentScore} />}
          onPress={() => router.push('/settings/subscription')}
        />
        {!sub.hasAppAccess ? (
          <SettingsRow
            label="Start membership"
            value="View"
            leftIcon={<Ionicons name="rocket-outline" size={22} color={semantic.accentGold} />}
            onPress={sub.openPaywall}
          />
        ) : null}
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
            <SettingsRow
              label="Billing diagnostics"
              value="RC / StoreKit"
              onPress={() => router.push('/settings/billing-diagnostics')}
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
  sectionAfterProfile: {
    marginTop: spacing.lg,
    marginBottom: 0,
  },
  sectionTop: {
    marginTop: spacing.lg,
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
