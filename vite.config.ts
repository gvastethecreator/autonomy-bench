import { defineConfig } from 'vite-plus';

const generated = [
  'gallery/**',
  'runs/**',
  'exports/**',
  'receipts/**',
  '.wrangler/**',
  'dist/**',
  'node_modules/**',
  'worker-configuration.d.ts',
  'workers/**',
];

export default defineConfig({
  publicDir: false,
  test: {
    include: ['test/**/*.test.ts'],
  },
  lint: {
    ignorePatterns: generated,
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    ignorePatterns: [...generated, '**/*.html', 'docs/codemap/**'],
    singleQuote: true,
  },
});
