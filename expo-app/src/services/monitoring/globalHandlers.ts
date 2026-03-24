/**
 * React Native global JS error handler (ErrorUtils). Does not replace native crashes.
 * Unhandled promise rejections: Hermes/RN may not expose a stable hook; sync/async
 * errors that surface through ErrorUtils are covered here.
 */

import { reportCapturedError } from './capturedError';

type GlobalErrorHandler = (error: Error, isFatal?: boolean) => void;

type ErrorUtilsShape = {
  getGlobalHandler: () => GlobalErrorHandler | undefined;
  setGlobalHandler: (handler: GlobalErrorHandler) => void;
};

function getErrorUtils(): ErrorUtilsShape | null {
  try {
    const g = globalThis as unknown as { ErrorUtils?: ErrorUtilsShape };
    if (
      g.ErrorUtils &&
      typeof g.ErrorUtils.getGlobalHandler === 'function' &&
      typeof g.ErrorUtils.setGlobalHandler === 'function'
    ) {
      return g.ErrorUtils;
    }
  } catch {
    /* noop */
  }
  return null;
}

let installed = false;

/**
 * Wrap the RN global handler once to forward errors to monitoring (deduped).
 * Safe to call multiple times; only the first call installs.
 */
export function installGlobalErrorHandlers(): void {
  if (installed) {
    return;
  }
  installed = true;

  const utils = getErrorUtils();
  if (utils) {
    let previous: GlobalErrorHandler | undefined;
    try {
      previous = utils.getGlobalHandler();
    } catch {
      previous = undefined;
    }

    utils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      try {
        const source = isFatal ? 'global_js_fatal' : 'global_js';
        reportCapturedError(error, source);
      } catch {
        /* never break the chain */
      }

      try {
        if (typeof previous === 'function') {
          previous(error, isFatal);
        }
      } catch {
        /* noop */
      }
    });
  } else if (__DEV__) {
    console.warn('[PropFolio][Monitoring] ErrorUtils not available; global JS errors not forwarded');
  }

  try {
    const g = globalThis as unknown as {
      addEventListener?: (type: string, listener: (e: unknown) => void) => void;
    };
    if (typeof g.addEventListener === 'function') {
      g.addEventListener('unhandledrejection', (evt: unknown) => {
        try {
          const reason =
            evt != null && typeof evt === 'object' && 'reason' in evt
              ? (evt as { reason: unknown }).reason
              : evt;
          const err = reason instanceof Error ? reason : new Error(String(reason));
          reportCapturedError(err, 'unhandled_promise_rejection');
        } catch {
          /* noop */
        }
      });
    }
  } catch {
    /* optional on RN / Hermes */
  }
}
