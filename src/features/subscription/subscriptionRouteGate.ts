/**
 * Routes reachable without an active subscription (trial/paid).
 * Align with product policy: credits alone do not unlock the app.
 */
export function isRouteExemptFromSubscriptionGate(pathname: string): boolean {
  const p = pathname.split('?')[0] ?? pathname;

  if (p === '/paywall' || p.startsWith('/paywall/')) {
    return true;
  }
  if (p === '/access-restricted' || p.startsWith('/access-restricted/')) {
    return true;
  }
  if (p.startsWith('/settings')) {
    return true;
  }

  return false;
}
