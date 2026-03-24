/**
 * Jest setup: globals expected by React Native / Expo code paths.
 */

(globalThis as unknown as { __DEV__: boolean }).__DEV__ = true;

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: { version: '1.0.0' },
    nativeAppVersion: '1.0.0',
  },
}));

jest.mock('@react-native-firebase/crashlytics', () => ({
  __esModule: true,
  default: () => ({
    log: jest.fn(),
    recordError: jest.fn(),
    setAttribute: jest.fn().mockResolvedValue(null),
    setUserId: jest.fn().mockResolvedValue(null),
    setCrashlyticsCollectionEnabled: jest.fn().mockResolvedValue(null),
  }),
}));

export {};
