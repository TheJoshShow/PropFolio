/**
 * Canonical expo-router hrefs and safe dismiss patterns so stack/deep-link entry
 * does not leave users on a blank screen when `router.back()` has nowhere to go.
 */

import type { Router } from 'expo-router';

export const PORTFOLIO_DETAIL_PATHNAME = '/(tabs)/portfolio/[id]' as const;

export type PortfolioDetailHref = {
  pathname: typeof PORTFOLIO_DETAIL_PATHNAME;
  params: { id: string };
};

/**
 * Normalizes dynamic segment params (string | string[]) and rejects junk that could break fetches.
 */
export function parsePortfolioPropertyIdParam(raw: unknown): string | null {
  if (raw === undefined || raw === null) return null;
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (typeof v !== 'string') return null;
  const id = v.trim();
  if (id.length === 0 || id.length > 200) return null;
  if (/[\r\n\0]/.test(id)) return null;
  return id;
}

export function hrefPortfolioPropertyDetail(id: string): PortfolioDetailHref | null {
  const safe = parsePortfolioPropertyIdParam(id);
  if (!safe) return null;
  return { pathname: PORTFOLIO_DETAIL_PATHNAME, params: { id: safe } };
}

/** Push portfolio detail; returns false if id was invalid (caller should show an alert). */
export function navigateToPortfolioDetail(router: Router, id: string): boolean {
  const href = hrefPortfolioPropertyDetail(id);
  if (!href) return false;
  router.push(href);
  return true;
}

/** Prefer stack pop; otherwise land on main tabs (e.g. paywall opened as first screen). */
export function dismissOrReplaceTabs(router: Router): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/(tabs)');
  }
}

/** After update-password: prefer pop to settings; otherwise replace settings tab. */
export function dismissOrReplaceSettings(router: Router): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/(tabs)/settings');
  }
}
