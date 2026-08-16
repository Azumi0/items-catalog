/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  serverExternalPackages: ['better-sqlite3', 'sharp', 'bcryptjs'],
  experimental: {
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
