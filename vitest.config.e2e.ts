import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from './vitest.config';

const e2eConfig = defineConfig({
  test: {
    typecheck: {
      enabled: true,
      checker: 'tsc',
      include: ['./test/**/*.e2e-spec.ts'],
    },
    include: ['./test/**/*.e2e-spec.ts'],
    globalSetup: ['./test/setup/setup.ts'],
    isolate: false,
    // remove that line with first e2e tests
    passWithNoTests: true,
    maxWorkers: 1,
    maxConcurrency: 1,
    testTimeout: 10000,
    hookTimeout: 5000,
    teardownTimeout: 5000,
  },
});

export default mergeConfig(baseConfig, e2eConfig);
