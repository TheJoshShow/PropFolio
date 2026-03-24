/**
 * One-shot and refreshable app-level Crashlytics attributes (no user PII).
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

import { MonitoringAttr } from './attributeKeys';
import { setCrashlyticsAttributes } from './crashlytics';

function readVersion(): string {
  try {
    const v = Constants.expoConfig?.version;
    return typeof v === 'string' && v.length > 0 ? v : 'unknown';
  } catch {
    return 'unknown';
  }
}

function readBuildNumber(): string {
  try {
    const iosBuild =
      Constants.expoConfig?.ios?.buildNumber ??
      (Constants as { iosBuildNumber?: string }).iosBuildNumber ??
      (Constants as { nativeBuildVersion?: string }).nativeBuildVersion;
    if (typeof iosBuild === 'string' && iosBuild.length > 0) return iosBuild;
    const n = (Constants as { nativeBuildVersion?: string }).nativeBuildVersion;
    return typeof n === 'string' && n.length > 0 ? n : '0';
  } catch {
    return '0';
  }
}

/**
 * Sets static app/platform attributes. Safe if Constants is partial (returns fallbacks).
 */
export function applyStartupMonitoringAttributes(): void {
  const attrs: Record<string, string> = {
    [MonitoringAttr.appEnv]: __DEV__ ? 'development' : 'production',
    [MonitoringAttr.appVersion]: readVersion(),
    [MonitoringAttr.buildNumber]: readBuildNumber(),
    [MonitoringAttr.platform]: Platform.OS === 'ios' ? 'ios' : Platform.OS,
  };
  setCrashlyticsAttributes(attrs);
  if (__DEV__) {
    console.log('[PropFolio][Monitoring] startup attributes', attrs);
  }
}
