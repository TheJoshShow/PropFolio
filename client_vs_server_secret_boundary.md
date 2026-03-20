# PropFolio — Client vs Server Secret Boundary

Where secrets live, who may use them, and how the client talks to the server.

---

## 1. Boundary diagram

```
┌─────────────────────────────────────────────────────────────────┐
│  CLIENT (expo-app / iOS)                                         │
│  • EXPO_PUBLIC_SUPABASE_URL + EXPO_PUBLIC_SUPABASE_ANON_KEY       │
│  • EXPO_PUBLIC_REVENUECAT_API_KEY_IOS                             │
│  • EXPO_PUBLIC_SENTRY_DSN                                         │
│  • EXPO_PUBLIC_PRIVACY_POLICY_URL, TERMS_URL, SUPPORT_URL (opt)   │
│  • User session: JWT from Supabase Auth (in memory / storage)     │
│  • NO service role, NO backend API keys, NO webhook secrets       │
└─────────────────────────────────────────────────────────────────┘
         │
         │  HTTPS only
         │  • Supabase client: auth + RLS + functions.invoke(name, { body })
         │  • Authorization: Bearer <user_jwt> (set by Supabase client)
         │  • Body: only non-secret payload (e.g. address, text)
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  SERVER (Supabase Edge Functions)                                │
│  • Deno.env.get("SUPABASE_URL")                                  │
│  • Deno.env.get("SUPABASE_ANON_KEY")  — only where needed        │
│  • Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")  — admin only        │
│  • Deno.env.get("REVENUECAT_WEBHOOK_AUTHORIZATION")              │
│  • Deno.env.get("GOOGLE_MAPS_API_KEY")                           │
│  • Deno.env.get("RENTCAST_API_KEY")                              │
│  • Deno.env.get("OPENAI_API_KEY")                                │
│  • Deno.env.get("CENSUS_API_KEY")                                │
│  • API keys NEVER come from request body or client               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. What the client may hold

| Asset | Allowed in client? | Why |
|-------|---------------------|-----|
| Supabase project URL | ✅ Yes | Public. |
| Supabase **anon** key | ✅ Yes | Designed for client; RLS + auth enforce access. |
| RevenueCat **public** app API key | ✅ Yes | Public key; only used for SDK. |
| Sentry DSN | ✅ Yes | Public; only allows sending events. |
| Privacy / Terms / Support URLs | ✅ Yes | No secrets. |
| User JWT (session) | ✅ Yes | User’s own token; from auth flow. |
| Supabase **service role** key | ❌ Never | Bypasses RLS; server-only. |
| Google / RentCast / OpenAI / Census API keys | ❌ Never | Server-only. |
| RevenueCat webhook secret | ❌ Never | Server-only. |
| Any password or long-lived secret | ❌ Never | Not stored in client. |

---

## 3. How the client calls the server

- **Auth:** Supabase JS client (anon key). Sign-in, sign-up, OAuth, magic link, password reset. No custom secrets; JWT stored by Supabase client.
- **Data / RPC:** Supabase client with RLS. Client never sends service role.
- **Edge Functions:** `getSupabase().functions.invoke(functionName, { body })`.  
  - Client sends: function **name** and **body** (e.g. `{ address }`, `{ text }`).  
  - Client does **not** send: API keys, service role, or webhook secrets.  
  - Function reads keys from `Deno.env.get(...)` only.

---

## 4. Privileged operations (server-only)

| Operation | Where | Secret used |
|-----------|--------|--------------|
| Delete user account | Edge Function `delete-account` | Service role (to delete from auth.users). |
| RevenueCat webhook → DB | Edge Function `revenuecat-webhook` | Webhook auth header; service role to write. |
| Geocoding | Edge Function `geocode-address` | GOOGLE_MAPS_API_KEY. |
| Places autocomplete | Edge Function `places-autocomplete` | GOOGLE_MAPS_API_KEY. |
| Rent estimate | Edge Function `rent-estimate` | RENTCAST_API_KEY. |
| Summarize (OpenAI) | Edge Function `openai-summarize` | OPENAI_API_KEY. |
| Census data | Edge Function `census-data` | CENSUS_API_KEY. |

All of these use env vars set in Supabase Edge Function secrets (or Supabase-injected vars). None are passed from the client.

---

## 5. Demo mode (client only)

When `EXPO_PUBLIC_SUPABASE_URL` or `EXPO_PUBLIC_SUPABASE_ANON_KEY` is missing:

- `getSupabase()` returns `null`.
- Auth shows a synthetic `DEMO_USER` so the app can run without a backend.
- **Production:** Both vars must be set; demo user is never used. No test credentials are shared with production.

---

## 6. Checklist for new features

- [ ] New secret → set only in Supabase Edge Function secrets (or equivalent server env); never in expo-app `.env` with `EXPO_PUBLIC_`.
- [ ] New client call to backend → use `supabase.functions.invoke(name, { body })` with non-secret body only.
- [ ] New env var in client → document in `env_matrix.md` and confirm it is public-safe (URL, anon key, public API key, or DSN).

---

*See also: `secrets_audit.md`, `env_matrix.md`, and expo-app `.env.example`.*
