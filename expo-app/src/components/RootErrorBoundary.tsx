/**
 * Top-level React error boundary: catches render errors in subtree without
 * replacing Expo Router's route-level error.tsx (which still handles nested routes).
 */

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import Constants from 'expo-constants';

import { recordMessage, reportCapturedError } from '../services/monitoring';
import { AppErrorFallback } from './AppErrorFallback';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class RootErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    try {
      const detail = info.componentStack?.slice(0, 400) ?? '';
      reportCapturedError(error, 'root_error_boundary');
      const ver =
        typeof Constants.expoConfig?.version === 'string' ? Constants.expoConfig.version : 'unknown';
      try {
        recordMessage(`root_boundary v=${ver} msg=${error.message.slice(0, 120)}`, 'error_boundary');
      } catch {
        /* non-fatal */
      }
      if (__DEV__ && detail) {
        console.warn('[PropFolio][RootErrorBoundary]', error.message, detail);
      }
    } catch {
      /* never break the tree */
    }
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      return (
        <AppErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
          recoveryMode="root"
        />
      );
    }

    return this.props.children;
  }
}
