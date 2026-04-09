import { Redirect, useRouter } from 'expo-router';

import { AuthBootView } from '@/components/ui';
import { useAuth } from '@/features/auth';
import { WelcomeContent } from '@/features/welcome';

export default function WelcomeScreen() {
  const router = useRouter();
  const {
    isReady,
    isConfigured,
    isSignedIn,
    emailConfirmed,
    needsEmailVerification,
    isPasswordRecovery,
  } = useAuth();

  if (!isReady) {
    return <AuthBootView />;
  }

  if (isPasswordRecovery) {
    return <Redirect href="/reset-password" />;
  }

  if (isSignedIn && emailConfirmed) {
    return <Redirect href="/portfolio" />;
  }

  if (needsEmailVerification) {
    return <Redirect href="/verify-email-pending" />;
  }

  return (
    <WelcomeContent
      isConfigured={isConfigured}
      onSignIn={() => router.push('/sign-in')}
      onCreateAccount={() => router.push('/create-account')}
    />
  );
}
