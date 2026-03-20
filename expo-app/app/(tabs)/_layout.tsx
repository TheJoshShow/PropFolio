import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useAuth } from '../../src/contexts/AuthContext';
import { useThemeColors } from '../../src/components/useThemeColors';
import { spacing, fontSizes, fontWeights } from '../../src/theme';

export default function TabLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { session, isLoading } = useAuth();
  const colors = useThemeColors();

  const isOnTabsRoute = Array.isArray(segments) && segments[0] === '(tabs)';

  useEffect(() => {
    if (!isOnTabsRoute) return;
    if (!isLoading && session === null) {
      router.replace('/(auth)');
    }
  }, [session, isLoading, router, isOnTabsRoute]);

  if (session === null) {
    return (
      <View style={[styles.authLoading, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.authLoadingText, { color: colors.textSecondary }]}>
          {isLoading ? 'Loading…' : 'Redirecting…'}
        </Text>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <SymbolView name="house.fill" tintColor={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="import"
        options={{
          title: 'Import',
          tabBarIcon: ({ color }) => (
            <SymbolView name="plus.circle.fill" tintColor={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: 'Portfolio',
          tabBarIcon: ({ color }) => (
            <SymbolView name="list.bullet.rectangle.fill" tintColor={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <SymbolView name="gearshape.fill" tintColor={color} size={24} />
          ),
        }}
      />
      </Tabs>
  );
}

const styles = StyleSheet.create({
  authLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.m,
  },
  authLoadingText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
  },
});
