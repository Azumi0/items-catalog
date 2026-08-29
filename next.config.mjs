/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['better-sqlite3', 'sharp', 'bcryptjs'],
  // Next 16 regression, pnpm-specific: packages listed in
  // serverExternalPackages are copied into .next/standalone under
  // node_modules/.pnpm/, but the node_modules/<pkg> symlink that makes them
  // resolvable is no longer created. Next 15 created it. Without these
  // includes the runner image throws MODULE_NOT_FOUND for better-sqlite3
  // (in both entrypoint.sh's migrator and the server) and for bcryptjs, so
  // the container builds and then dies on boot.
  //
  // sharp escapes this because Next depends on it itself and traces it
  // separately. Re-check on the next Next upgrade: when the symlinks come
  // back, this block can go.
  outputFileTracingIncludes: {
    '/**/*': [
      './node_modules/better-sqlite3/**/*',
      './node_modules/bcryptjs/**/*',
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
    optimizePackageImports: [
      '@mantine/core',
      '@mantine/hooks',
      '@mantine/notifications',
      '@mantine/dropzone',
      '@tabler/icons-react',
    ],
  },
};

export default nextConfig;
