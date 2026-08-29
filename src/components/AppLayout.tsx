'use client';

import {
  ActionIcon,
  Box,
  Group,
  Paper,
  Text,
  UnstyledButton,
  useComputedColorScheme,
  useMantineColorScheme,
} from '@mantine/core';
import {
  IconSun,
  IconMoon,
  IconHome,
  IconCategory,
  IconUsers,
  IconLogout,
  IconPlus,
  IconChevronLeft,
} from '@tabler/icons-react';
import Link from 'next/link';
import { logoutAction } from '@/app/actions/auth';

/** Which bottom-nav entry is lit, and therefore what the FAB does. */
export type AppTab = 'catalog' | 'categories' | 'users';

interface TabConfig {
  label: string;
  icon: typeof IconHome;
  href: string;
  /** aria-label and title of the FAB while this tab is active. */
  fabLabel: string;
  fabHref: string;
}

const TABS: Record<AppTab, TabConfig> = {
  catalog: {
    label: 'Katalog',
    icon: IconHome,
    href: '/',
    fabLabel: 'Dodaj przedmiot',
    fabHref: '/items/new',
  },
  categories: {
    label: 'Kategorie',
    icon: IconCategory,
    href: '/categories',
    fabLabel: 'Nowa kategoria',
    fabHref: '/categories/new',
  },
  users: {
    label: 'Użytkownicy',
    icon: IconUsers,
    href: '/users',
    fabLabel: 'Dodaj użytkownika',
    fabHref: '/users/new',
  },
};

const TAB_ORDER: AppTab[] = ['catalog', 'categories', 'users'];

/** Clears the fixed bottom bar so nothing at the end of a screen hides under it. */
const NAV_CLEARANCE = 104;
/** Clears a form's own sticky action bar instead. */
const ACTION_BAR_CLEARANCE = 96;

interface AppLayoutProps {
  children: React.ReactNode;
  user: {
    id: string;
    username: string;
  };
  /** 17px/700 line in the top bar. */
  title: string;
  /** 12px dimmed line under it — the screen's context. */
  subtitle?: string;
  /** Where the back chevron goes. Omitted on the three top-level screens. */
  backHref?: string;
  tab?: AppTab;
  /**
   * Form screens pass false: they carry their own sticky action bar, and a
   * floating "+" on top of a half-filled form is an invitation to lose it.
   */
  chrome?: boolean;
  /** Overrides the FAB target — the catalog FAB prefills the open category. */
  fabHref?: string;
}

export function AppLayout({
  children,
  user,
  title,
  subtitle,
  backHref,
  tab = 'catalog',
  chrome = true,
  fabHref,
}: AppLayoutProps) {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', {
    getInitialValueInEffect: true,
  });
  const isDark = computedColorScheme === 'dark';

  const activeTab = TABS[tab];

  return (
    <Box
      mih="100vh"
      pb={chrome ? NAV_CLEARANCE : ACTION_BAR_CLEARANCE}
      c="var(--mantine-color-text)"
    >
      <Group
        component="header"
        justify="space-between"
        wrap="nowrap"
        gap={8}
        px={12}
        py={10}
        mih={60}
        pos="sticky"
        top={0}
        style={{
          zIndex: 20,
          background: 'var(--mantine-color-body)',
          borderBottom: '1px solid var(--mantine-color-default-border)',
        }}
      >
        <Group gap={8} wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          {backHref && (
            <ActionIcon
              component={Link}
              href={backHref}
              variant="subtle"
              color="gray"
              w={44}
              h={44}
              radius="md"
              aria-label="Wróć"
              title="Wróć"
              style={{ flex: 'none', color: 'var(--mantine-color-text)' }}
            >
              <IconChevronLeft size={24} />
            </ActionIcon>
          )}
          <Box style={{ minWidth: 0 }}>
            <Text fz={17} fw={700} lh={1.2} truncate>
              {title}
            </Text>
            {subtitle && (
              <Text fz={12} c="dimmed" truncate>
                {subtitle}
              </Text>
            )}
          </Box>
        </Group>

        <Group gap={2} wrap="nowrap" style={{ flex: 'none' }}>
          <Text
            component="span"
            title="Zalogowany użytkownik"
            fz={12}
            fw={600}
            truncate
            maw={96}
            px={10}
            py={6}
            mr={2}
            style={{
              borderRadius: 999,
              background: 'var(--mantine-color-teal-light)',
              color: 'var(--mantine-color-teal-filled)',
            }}
          >
            {user.username}
          </Text>

          <ActionIcon
            onClick={() => setColorScheme(isDark ? 'light' : 'dark')}
            variant="subtle"
            color="gray"
            w={44}
            h={44}
            radius="md"
            aria-label={isDark ? 'Włącz motyw jasny' : 'Włącz motyw ciemny'}
            title={isDark ? 'Włącz motyw jasny' : 'Włącz motyw ciemny'}
          >
            {isDark ? <IconSun size={21} /> : <IconMoon size={21} />}
          </ActionIcon>

          <form action={logoutAction}>
            <ActionIcon
              type="submit"
              variant="subtle"
              color="red"
              w={44}
              h={44}
              radius="md"
              aria-label="Wyloguj się"
              title="Wyloguj się"
            >
              <IconLogout size={21} />
            </ActionIcon>
          </form>
        </Group>
      </Group>

      <Box component="main" maw={1120} mx="auto" p={16}>
        {children}
      </Box>

      {chrome && (
        <Group
          pos="fixed"
          left={12}
          right={12}
          bottom={12}
          maw={600}
          mx="auto"
          gap={10}
          wrap="nowrap"
          style={{ zIndex: 30 }}
        >
          <Paper
            component="nav"
            withBorder
            shadow="md"
            radius={20}
            p={6}
            style={{ flex: 1, minWidth: 0, display: 'flex', gap: 4 }}
          >
            {TAB_ORDER.map((key) => {
              const entry = TABS[key];
              const Icon = entry.icon;
              const isActive = key === tab;

              return (
                <UnstyledButton
                  key={key}
                  component={Link}
                  href={entry.href}
                  mih={52}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    borderRadius: 14,
                    background: isActive
                      ? 'var(--mantine-color-teal-light)'
                      : 'transparent',
                    color: isActive
                      ? 'var(--mantine-color-teal-filled)'
                      : 'var(--mantine-color-dimmed)',
                  }}
                >
                  <Icon size={22} />
                  <Text fz={11} fw={600} c="inherit" maw="100%" truncate>
                    {entry.label}
                  </Text>
                </UnstyledButton>
              );
            })}
          </Paper>

          <ActionIcon
            component={Link}
            href={fabHref ?? activeTab.fabHref}
            variant="filled"
            color="teal"
            radius="50%"
            w={64}
            h={64}
            aria-label={activeTab.fabLabel}
            title={activeTab.fabLabel}
            style={{ flex: 'none', boxShadow: 'var(--mantine-shadow-md)' }}
          >
            <IconPlus size={28} />
          </ActionIcon>
        </Group>
      )}
    </Box>
  );
}
