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
      '@modules': './src/modules',
      '@technical': './src/technical',
      '@utils': './src/utils',
      '@domain': './src/domain',
      '@common': './src/common',
      '@config': './src/config',
      test: './test',
      src: './src',
    },
  },
  plugins: [swc.vite()],
});
