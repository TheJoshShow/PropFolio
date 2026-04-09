import { Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AppBackButton,
  HeaderActionSpacer,
  headerLeadingInset,
  headerTrailingInset,
  stackHeaderBarStyle,
  stackHeaderTitleStyle,
} from '@/components/navigation';
import { semantic } from '@/theme';

export default function SettingsStackLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Stack
      screenOptions={({ navigation }) => ({
        headerLargeTitle: false,
        headerShadowVisible: false,
        headerStyle: stackHeaderBarStyle,
        headerTintColor: semantic.textPrimary,
        headerTitleStyle: stackHeaderTitleStyle,
        headerTitleAlign: 'center',
        contentStyle: { backgroundColor: semantic.background },
        headerBackVisible: false,
        headerLeftContainerStyle: headerLeadingInset(insets.left),
        headerRightContainerStyle: headerTrailingInset(insets.right),
        headerLeft: ({ canGoBack }) =>
          canGoBack ? (
            <AppBackButton onPress={() => navigation.goBack()} testID="propfolio.settings.stack.back" />
          ) : null,
        headerRight: ({ canGoBack }) => (canGoBack ? <HeaderActionSpacer /> : null),
      })}
    >
      <Stack.Screen
        name="index"
        options={{ headerShown: true, title: 'Settings', headerTitleAlign: 'center' }}
      />
      <Stack.Screen name="personal" options={{ title: 'Account' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notification Settings' }} />
      <Stack.Screen name="subscription" options={{ title: 'Membership' }} />
      <Stack.Screen name="help" options={{ title: 'Help Center' }} />
      <Stack.Screen name="billing-diagnostics" options={{ title: 'Billing diagnostics' }} />
    </Stack>
  );
}
