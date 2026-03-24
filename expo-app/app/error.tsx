/**
 * Route-level error UI (Expo Router). Reports once per error via monitoring; deduped with global handler.
 */
import React, { useEffect, useRef } from 'react';

import { AppErrorFallback } from '../src/components/AppErrorFallback';
import { reportCapturedError } from '../src/services/monitoring';

export default function RouteErrorScreen({
  error,
  retry,
}: {
  error: Error;
  retry: () => void;
}) {
  const reportedRef = useRef(false);

  useEffect(() => {
    if (reportedRef.current) {
      return;
    }
    reportedRef.current = true;
    reportCapturedError(error, 'route_error_ui');
  }, [error]);

  return <AppErrorFallback error={error} onRetry={retry} recoveryMode="route" />;
}
