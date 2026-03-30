/**
 * Single source of truth for iOS Info.plist *UsageDescription purpose strings.
 * Keep in sync with privacy preflight audit (see repo docs or app.config.ts header).
 * Add keys here only when a dependency or app code actually triggers the permission.
 */

module.exports = {
  NSLocationWhenInUseUsageDescription:
    'PropFolio uses your location to show nearby properties and improve map-based property discovery while you are using the app.',
};
