/**
 * External service inventory for audits and onboarding.
 * Secrets (Google Maps, RentCast, OpenAI, Census, webhooks) live in Supabase Edge secrets only — never in EXPO_PUBLIC_*.
 *
 * Client-visible config stays in `runtimeConfig.ts` / `billing.ts` / `legalUrls.ts`.
 */

import type { IntegrationName } from '../services/diagnostics';

/** Supabase Edge Function slugs invoked from the app via `supabase.functions.invoke`. */
export const EDGE_FUNCTION_NAMES = [
  'geocode-address',
  'places-autocomplete',
  'rent-estimate',
  'openai-summarize',
  'census-data',
  'delete-account',
] as const;

export type EdgeFunctionName = (typeof EDGE_FUNCTION_NAMES)[number];

/**
 * Maps Edge Function slug → diagnostics integration bucket (import pipeline / monitoring).
 */
export function edgeFunctionToIntegrationName(fn: string): IntegrationName {
  switch (fn) {
    case 'geocode-address':
      return 'supabase_edge_geocode';
    case 'places-autocomplete':
      return 'supabase_edge_places';
    case 'rent-estimate':
      return 'supabase_edge_rentcast';
    case 'census-data':
      return 'supabase_edge_census';
    case 'openai-summarize':
      return 'supabase_edge_openai';
    case 'delete-account':
      return 'supabase_edge_delete_account';
    default:
      return 'supabase';
  }
}

/**
 * Startup-critical: none of the Edge Functions run at JS bundle load — only after user actions / hooks.
 * Supabase client creation is startup-adjacent (AuthProvider mount); see `getSupabase()` hardening.
 */
export const SERVICE_BOOT_NOTES = {
  supabaseAuth: 'Required for real sign-in, portfolio, Edge invokes; missing URL/key → client null, no crash.',
  revenueCat: 'Configured after session exists; missing iOS key → subscriptions disabled, no crash.',
  firebaseCrashlytics: 'Native; lazy require; missing plist → native risk (build/config), not JS.',
  edgeFunctions: 'All optional at launch; failures return { data: null, error } or structured import errors.',
  legalUrls: 'Defaults to prop-folio.vercel.app; openUrlSafe validates scheme; bad URL → alert, no crash.',
} as const;
