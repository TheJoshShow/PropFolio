# Global error capture (monitoring)

## What runs at startup

1. `initMonitoring()` in `app/_layout.tsx` initializes Crashlytics (iOS) and `installGlobalErrorHandlers()`.
2. **ErrorUtils** (`global.ErrorUtils`): wraps the React Native global handler to call `reportCapturedError` with `global_js` or `global_js_fatal`.
3. **`unhandledrejection`**: if `globalThis.addEventListener` exists, rejections are reported as `unhandled_promise_rejection` (availability varies by Hermes/RN).
4. **Root error boundary** (`RootErrorBoundary`): catches React render errors under providers; reports `root_error_boundary`.
5. **Route error UI** (`app/error.tsx`): Expo Router’s route-level failures; reports `route_error_ui` once per mount.

Duplicate reports for the **same** exception (message + stack prefix) within ~2.5s are dropped (`reportDedupe.ts`).

## Verify in development

### Render error (boundary / route)

Temporarily add to any screen component body (remove after testing):

```tsx
if (__DEV__) {
  throw new Error('PropFolio monitoring test: intentional render error');
}
```

You should see the recovery UI (Try again / Go to home), console output in dev, and a non-fatal in Crashlytics on a **release** iOS build.

### Non-fatal without crashing UI

From any code path (e.g. a dev-only button handler):

```ts
import { recordNonFatal } from '@/services/monitoring';

recordNonFatal(new Error('PropFolio monitoring test: non-fatal'), 'manual_test');
```

Or use `logErrorSafe('manual_test', new Error('...'))` from `diagnostics` (forwards to monitoring).

### Unhandled promise (if the runtime fires the event)

```ts
void Promise.reject(new Error('PropFolio monitoring test: promise rejection'));
```

## Production notes

- Fallback copy avoids technical jargon; stack traces only in `__DEV__`.
- “Go to home” navigates to `/(tabs)`; unauthenticated users are redirected to auth by existing tab layout logic.
