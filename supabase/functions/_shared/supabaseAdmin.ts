import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

/** Service-role client — webhooks & admin tasks only. Never import from client app code. */
export function getServiceSupabase() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) {
    throw new Error('SERVER_MISCONFIGURED');
  }
  return createClient(url, key);
}
