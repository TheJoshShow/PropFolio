import { Stack } from 'expo-router';
import { Platform } from 'react-native';

import { semantic } from '@/theme';

export default function SettingsStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: false,
        ...(Platform.OS === 'ios' ? { headerBlurEffect: 'systemMaterial' as const } : {}),
        headerShadowVisible: false,
        headerStyle: { backgroundColor: semantic.background },
        headerTintColor: semantic.textPrimary,
        headerTitleStyle: { color: semantic.textPrimary },
        contentStyle: { backgroundColor: semantic.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ headerShown: true, title: 'Settings', headerTitleAlign: 'center' }}
      />
      <Stack.Screen name="personal" options={{ title: 'Personal Information' }} />
      <Stack.Screen name="security" options={{ title: 'Security' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notification Settings' }} />
      <Stack.Screen name="subscription" options={{ title: 'Membership' }} />
      <Stack.Screen name="currency" options={{ title: 'Currency' }} />
      <Stack.Screen name="theme" options={{ title: 'Theme' }} />
      <Stack.Screen name="help" options={{ title: 'Help Center' }} />
    </Stack>
  );
}
