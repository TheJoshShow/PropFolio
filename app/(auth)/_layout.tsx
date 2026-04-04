import { Redirect, Stack, usePathname } from 'expo-router';

import { AuthBootView } from '@/components/ui';
import { useAuth } from '@/features/auth';
import { semantic } from '@/theme';

export default function AuthLayout() {
  const pathname = usePathname();
  const { isReady, isSignedIn, emailConfirmed, isPasswordRecovery } = useAuth();

  const onResetPassword = pathname.includes('reset-password');
  const onVerifyPending = pathname.includes('verify-email-pending');

  if (!isReady) {
    return <AuthBootView />;
  }

  if (isPasswordRecovery && !onResetPassword) {
    return <Redirect href="/reset-password" />;
  }

  if (isSignedIn && emailConfirmed && !isPasswordRecovery) {
    return <Redirect href="/portfolio" />;
  }

  if (isSignedIn && !emailConfirmed && !onVerifyPending) {
    return <Redirect href="/verify-email-pending" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: semantic.background },
        animation: 'slide_from_right',
      }}
    />
  );
}
