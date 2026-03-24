/**
 * Required for react-native-reanimated (worklets). Plugin must be listed last.
 * babel-preset-expo includes expo-router and RN transforms for SDK 55.
 * @see https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/#step-2-add-reanimateds-babel-plugin
 */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
