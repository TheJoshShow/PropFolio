/**
 * Ensures Info.plist purpose strings from iosPrivacyStrings.js after other config plugins.
 * react-native-maps + Google Maps link Core Location; App Store requires When-In-Use text.
 */
const { withInfoPlist } = require('expo/config-plugins');
const iosPrivacyStrings = require('./iosPrivacyStrings');

module.exports = function withIosLocationWhenInUse(config) {
  return withInfoPlist(config, (plist) => {
    Object.assign(plist, iosPrivacyStrings);
    return plist;
  });
};
