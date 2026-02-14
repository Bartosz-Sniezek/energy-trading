import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    typecheck: {
      enabled: true,
      checker: 'tsc',
      include: ['**/*.e2e-spec.ts'],
    },
    include: ['**/*.e2e-spec.ts'],
    exclude: ['./test/setup'],
    globals: true,
    globalSetup: './test/setup/setup.ts',
    setupFiles: ['./test/setup/setup-jest-extended'],
    alias: {
      '@src': './src',
      '@test': './test',
    },
    root: './',
  },
  resolve: {
    alias: {
      src: './src',
      '@modules': './src/modules',
    },
  },
  plugins: [swc.vite()],
});
