import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@listingUrlCore': path.resolve(__dirname, './supabase/functions/_shared/listingUrlCore.ts'),
      'react-native': path.resolve(__dirname, './src/test/mocks/react-native.ts'),
      'react-native-purchases': path.resolve(__dirname, './src/test/mocks/react-native-purchases.ts'),
    },
  },
});
