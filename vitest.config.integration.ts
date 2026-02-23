import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from './vitest.config';

const e2eConfig = defineConfig({
  test: {
    typecheck: {
      enabled: true,
      checker: 'tsc',
      include: ['./test/**/*.int-spec.ts'],
    },
    include: ['./test/**/*.int-spec.ts'],
    globalSetup: ['./test/setup/setup.ts'],
    isolate: false,
    maxWorkers: 1,
    maxConcurrency: 1,
    testTimeout: 5000,
    hookTimeout: 5000,
    teardownTimeout: 5000,
  },
});

export default mergeConfig(baseConfig, e2eConfig);
