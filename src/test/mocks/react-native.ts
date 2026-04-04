/**
 * Minimal stub so Vitest (Node) can parse modules that import `react-native`.
 * Native behavior is not simulated.
 */
export const Platform = { OS: 'ios', select: <T>(s: { ios?: T; default?: T }) => s.ios ?? s.default };
