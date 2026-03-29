/**
 * User-facing copy when account services (Supabase auth) are not usable.
 * Combines env validation failures with rare "env looks valid but client failed to construct" cases.
 */

import { getAuthConfigurationUserMessage, validateAuthEnv } from './env';
import { explainAccountServicesInitUserMessage } from '../services/supabase';

/**
 * Banner / inline message when sign-up (or similar) is blocked because the Supabase client is unavailable.
 */
export function getAccountServicesUnavailableBannerMessage(): string | null {
  const envMessage = getAuthConfigurationUserMessage();
  if (envMessage) return envMessage;
  if (!validateAuthEnv().isValid) {
    return 'Account services are not configured in this build. Update the app or contact support.';
  }
  return explainAccountServicesInitUserMessage();
}
