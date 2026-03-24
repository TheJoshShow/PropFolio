/** Jest config for unit testing src/lib (pure TypeScript). */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Some suites leave handles open; without this, Jest can hang or warn on worker teardown.
  // Root cause: npm run test:open-handles
  forceExit: true,
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  moduleNameMapper: {
    '^~/(.*)$': '<rootDir>/src/$1',
    '^react-native$': '<rootDir>/src/test/react-native-mock.js',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  collectCoverageFrom: ['src/lib/**/*.ts', '!src/lib/**/*.d.ts', '!**/index.ts'],
  coverageDirectory: 'coverage',
};
