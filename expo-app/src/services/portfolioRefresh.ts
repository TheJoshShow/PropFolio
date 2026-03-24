/**
 * Lightweight pub/sub so import success can refresh portfolio data without tight coupling
 * to navigation (tabs may not remount when pushing detail).
 *
 * Listeners are sync (`void fetchList()`); they must not throw. If one throws, others still run
 * and the error is logged (dev-safe).
 */

import { logErrorSafe } from './diagnostics';

type Listener = () => void;

const listeners = new Set<Listener>();

export function subscribePortfolioRefresh(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyPortfolioRefresh(): void {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      logErrorSafe('portfolioRefresh listener', e);
    }
  });
}
