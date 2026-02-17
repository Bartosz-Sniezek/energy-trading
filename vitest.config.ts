import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    typecheck: {
      enabled: true,
      checker: 'tsc',
    },
    globals: true,
    setupFiles: ['./test/setup/setup-jest-extended'],
    root: './',
    logHeapUsage: true,
  },
  resolve: {
    alias: {
      'test': './test',
      '@src': './src',
      '@modules': './src/modules',
      '@technical': './src/technical',
      '@utils': './src/utils',
      '@domain': './src/domain',
    },
  },
  plugins: [swc.vite()],
});
