import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from './vitest.config';

const unitConfig = defineConfig({
  test: {
    typecheck: {
      enabled: true,
      checker: 'tsc',
      include: ['**/*.spec.ts'],
    },
    include: ['./src/**/*.spec.ts'],
    testTimeout: 5000,
    hookTimeout: 5000,
    teardownTimeout: 5000,
  },
});

export default mergeConfig(baseConfig, unitConfig);
