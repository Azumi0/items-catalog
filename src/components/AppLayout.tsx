'use client';

import {
  AppShell,
  Burger,
  Group,
  Title,
  Button,
  ActionIcon,
  useMantineColorScheme,
  useComputedColorScheme,
  Text,
  Badge,
  NavLink,
  Drawer,
  Stack,
  Container,
  Box,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconSun,
  IconMoon,
  IconHome,
  IconCategory,
  IconUsers,
  IconLogout,
  IconPlus,
  IconBox,
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logoutAction } from '@/app/actions/auth';

interface AppLayoutProps {
  children: React.ReactNode;
  user: {
    id: string;
    username: string;
  };
}

export function AppLayout({ children, user }: AppLayoutProps) {
  const [opened, { toggle, close }] = useDisclosure();
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', {
    getInitialValueInEffect: true,
  });
  const pathname = usePathname();

  const toggleColorScheme = () => {
    setColorScheme(computedColorScheme === 'dark' ? 'light' : 'dark');
  };

  const navLinks = [
    { label: 'Katalog', href: '/', icon: IconHome },
    { label: 'Kategorie', href: '/categories', icon: IconCategory },
    { label: 'Użytkownicy', href: '/users', icon: IconUsers },
  ];

  return (
    <AppShell
      header={{ height: 64 }}
      padding="md"
    >
      <AppShell.Header>
        <Container size="xl" h="100%">
          <Group h="100%" justify="space-between">
            <Group>
              <Burger
                opened={opened}
                onClick={toggle}
                hiddenFrom="sm"
                size="sm"
                aria-label="Toggle navigation"
              />
              <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                <Group gap="xs">
                  <ActionIcon variant="light" color="teal" size="lg" radius="md">
                    <IconBox size={24} />
                  </ActionIcon>
                  <Title order={3} style={{ fontWeight: 700 }}>
                    Katalog
                  </Title>
                </Group>
              </Link>
            </Group>

            {/* Desktop Navigation Links */}
            <Group visibleFrom="sm" gap="xs">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Button
                    key={link.href}
                    component={Link}
                    href={link.href}
                    variant={isActive ? 'filled' : 'subtle'}
                    color={isActive ? 'teal' : 'gray'}
                    leftSection={<Icon size={18} />}
                    size="sm"
                  >
                    {link.label}
                  </Button>
                );
              })}
            </Group>

            {/* User info, Dark Mode Toggle & Logout */}
            <Group gap="xs">
              <Button
                component={Link}
                href="/items/new"
                variant="light"
                color="teal"
                leftSection={<IconPlus size={16} />}
                size="sm"
                visibleFrom="sm"
              >
                Dodaj
              </Button>

              <Badge
                variant="dot"
                color="teal"
                size="lg"
                visibleFrom="md"
                title="Zalogowany użytkownik"
              >
                {user.username}
              </Badge>

              <ActionIcon
                onClick={toggleColorScheme}
                variant="default"
                size="lg"
                aria-label="Przełącz motyw"
                title="Przełącz motyw"
              >
                {computedColorScheme === 'dark' ? (
                  <IconSun size={18} stroke={1.5} />
                ) : (
                  <IconMoon size={18} stroke={1.5} />
                )}
              </ActionIcon>

              <form action={logoutAction}>
                <ActionIcon
                  type="submit"
                  variant="subtle"
                  color="red"
                  size="lg"
                  title="Wyloguj się"
                  aria-label="Wyloguj się"
                >
                  <IconLogout size={18} stroke={1.5} />
                </ActionIcon>
              </form>
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      {/* Mobile Drawer */}
      <Drawer
        opened={opened}
        onClose={close}
        title={
          <Group gap="xs">
            <ActionIcon variant="light" color="teal" size="md">
              <IconBox size={18} />
            </ActionIcon>
            <Text fw={700}>Katalog Domowy</Text>
          </Group>
        }
        padding="md"
        size="xs"
      >
        <Stack gap="md">
          <Box p="xs" style={{ background: 'var(--mantine-color-gray-light)', borderRadius: 8 }}>
            <Text size="xs" c="dimmed">
              Zalogowany jako
            </Text>
            <Text fw={600}>{user.username}</Text>
          </Box>

          <Button
            component={Link}
            href="/items/new"
            variant="filled"
            color="teal"
            leftSection={<IconPlus size={18} />}
            onClick={close}
            fullWidth
          >
            Dodaj przedmiot
          </Button>

          <Stack gap="xs">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <NavLink
                  key={link.href}
                  component={Link}
                  href={link.href}
                  label={link.label}
                  leftSection={<Icon size={20} />}
                  active={isActive}
                  onClick={close}
                  style={{ borderRadius: 8 }}
                />
              );
            })}
          </Stack>

          <form action={logoutAction}>
            <Button
              type="submit"
              variant="light"
              color="red"
              leftSection={<IconLogout size={18} />}
              fullWidth
            >
              Wyloguj się
            </Button>
          </form>
        </Stack>
      </Drawer>

      <AppShell.Main>
        <Container size="xl" py="md">
          {children}
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
