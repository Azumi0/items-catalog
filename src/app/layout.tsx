import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dropzone/styles.css';

import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { theme } from '@/theme';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Katalog Przedmiotów Domowych',
  description: 'Aplikacja PWA do katalogowania i ewidencjonowania przedmiotów domowych',
  manifest: '/manifest.json',
  // Served from public/icons/ rather than through the app/icon.png convention:
  // src/proxy.ts only waves through /icons, /_next, /api and four literal
  // paths, so Next's generated /icon0.png would be redirected to /login for
  // the one visitor who has no session — and /login is where the favicon is
  // most visible. Regenerate these with `pnpm run icons`.
  icons: {
    icon: [
      { url: '/icons/app-icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/app-icon-48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [{ url: '/icons/app-icon-180.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Katalog',
  },
};

export const viewport: Viewport = {
  themeColor: '#0ca678',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="auto" />
      </head>
      <body>
        <MantineProvider theme={theme} defaultColorScheme="auto">
          <Notifications position="top-right" zIndex={1000} />
          <ServiceWorkerRegistration />
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
