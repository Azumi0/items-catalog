// eslint-config-next 16 publishes real flat configs, so they are spread
// straight in. The @eslint/eslintrc FlatCompat shim that used to bridge the
// old eslintrc format cannot consume them and has been dropped.
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
// eslint-config-next 16 no longer registers eslint-plugin-import for us, and
// import/first below is a rule this repo relies on, so it is declared here.
import importPlugin from 'eslint-plugin-import';

const config = [
  {
    ignores: [
      '.next/**',
      'dist/**',
      'node_modules/**',
      'drizzle/**',
      '.claude/**',
      // design-sync: the staged converter and the bundle it builds. Both are
      // generated, gitignored, and full of vendored code.
      '.ds-sync/**',
      'ds-bundle/**',
      // Design handoffs ship their prototypes as runnable HTML plus the design
      // tool's own runtime (support.js, ds-base.js). Vendored, not ours, and
      // written against React 17 — linting it reports deprecations in someone
      // else's code. The prototypes are read as specifications, never built.
      'docs/**/design/**',
      'next-env.d.ts',
      'tsconfig.tsbuildinfo',
    ],
  },

  ...nextCoreWebVitals,
  ...nextTypescript,

  {
    plugins: { import: importPlugin },
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
