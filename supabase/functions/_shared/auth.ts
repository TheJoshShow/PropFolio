import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

export type AuthedContext = {
  userId: string;
  supabase: ReturnType<typeof createClient>;
};

export async function requireAuthedUser(req: Request): Promise<AuthedContext> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('UNAUTHORIZED');
  }
  const url = Deno.env.get('SUPABASE_URL');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !anon) {
    throw new Error('SERVER_MISCONFIGURED');
  }
  const supabase = createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('UNAUTHORIZED');
  }
  return { userId: user.id, supabase };
}
