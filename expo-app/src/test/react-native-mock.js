/**
 * Minimal react-native stub for Jest (node testEnvironment).
 * Extend when tests need more APIs from react-native.
 */
module.exports = {
  Platform: {
    OS: 'ios',
    select: (spec) => spec.ios,
    Version: 17,
  },
};
