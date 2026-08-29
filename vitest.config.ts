import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Collect only this checkout's suite. Without an explicit scope Vitest also
    // picks up `tests/` inside nested checkouts (e.g. agent worktrees under
    // .claude/), which then race against this run over the shared tmp/ fixtures.
    include: ['tests/**/*.test.ts'],
    exclude: [
      '**/node_modules/**',
      '**/.claude/**',
      '**/dist/**',
      '**/.next/**',
      // Playwright owns e2e/ — Vitest cannot run its specs.
      '**/e2e/**',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
