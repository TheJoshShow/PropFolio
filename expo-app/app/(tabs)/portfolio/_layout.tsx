/**
 * Portfolio tab: Stack so list is default and [id] is detail.
 */

import { Stack } from 'expo-router';

export default function PortfolioLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
