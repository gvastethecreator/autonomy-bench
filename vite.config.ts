import { defineConfig } from 'vite-plus';

const generated = [
  'gallery/**',
  'runs/**',
  'exports/**',
  'receipts/**',
  '.wrangler/**',
  'dist/**',
  'node_modules/**',
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
    ignorePatterns: [...generated, '**/*.html'],
    singleQuote: true,
  },
});
