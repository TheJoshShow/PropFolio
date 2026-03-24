/**
 * Crashlytics custom attribute names (short, searchable, stable).
 * Values are always strings; sanitize before set.
 */
export const MonitoringAttr = {
  appEnv: 'pf_app_env',
  appVersion: 'pf_app_version',
  buildNumber: 'pf_build_number',
  platform: 'pf_platform',
  authState: 'pf_auth_state',
  subscriptionTier: 'pf_sub_tier',
  routePath: 'pf_route',
  portfolioCount: 'pf_portfolio_n',
} as const;

export type MonitoringAttrName = (typeof MonitoringAttr)[keyof typeof MonitoringAttr];
