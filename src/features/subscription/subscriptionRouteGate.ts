/**
 * Routes reachable without `hasAppAccess` (active membership / trial).
 * Credit top-up is allowed so users can see balance and membership messaging; purchases still require membership.
 */
export function isRouteExemptFromSubscriptionGate(pathname: string): boolean {
  const p = pathname.split('?')[0] ?? pathname;

  if (p === '/paywall' || p.startsWith('/paywall/')) {
    return true;
  }
  if (p === '/credit-top-up' || p.startsWith('/credit-top-up/')) {
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
