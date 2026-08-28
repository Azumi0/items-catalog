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
