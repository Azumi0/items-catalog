/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['better-sqlite3', 'sharp', 'bcryptjs'],
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
