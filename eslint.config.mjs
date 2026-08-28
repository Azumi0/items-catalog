import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

const config = [
  {
    ignores: [
      '.next/**',
      'dist/**',
      'node_modules/**',
      'drizzle/**',
      '.claude/**',
      'next-env.d.ts',
      'tsconfig.tsbuildinfo',
    ],
  },

  ...compat.extends('next/core-web-vitals', 'next/typescript'),

  {
    rules: {
      // Imports belong at the top of the module. src/lib/session.ts had two
      // sitting mid-file, which hid a cycle risk against the users service.
      'import/first': 'error',

      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Server Action signatures (`prevState: any`) and `catch (err: any)` still
      // use it. Warn so it stays visible without blocking the build.
      '@typescript-eslint/no-explicit-any': 'warn',

      // Image URLs are a domain concept (CONTEXT.md: Original Image, Thumbnail).
      // Build them with thumbUrl()/originalUrl() from src/lib/images.ts.
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "TemplateLiteral > TemplateElement[value.raw=/^\\/api\\/images\\//]",
          message:
            'Do not hand-build image URLs. Use thumbUrl() / originalUrl() from @/lib/images.',
        },
      ],
    },
  },

  {
    files: ['tests/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];

export default config;
