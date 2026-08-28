import { SetupForm } from 'home-item-catalog';
import { Box, Center, Container, Paper, Text, Title } from '@mantine/core';
import { IconShieldCheck } from '@tabler/icons-react';

/** The form on its own — administrator name, password and confirmation. */
export const Form = () => (
  <Container size="xs" py="xl">
    <Paper withBorder shadow="md" p={30} radius="md">
      <SetupForm />
    </Paper>
  </Container>
);

/** The /setup page in full: shield badge, heading and card, as src/app/setup/page.tsx composes it. */
export const SetupPage = () => (
  <Container size="xs" py={80}>
    <Center mb="lg">
      <Box
        p="md"
        style={{
          background: 'var(--mantine-color-teal-light)',
          borderRadius: '50%',
          color: 'var(--mantine-color-teal-filled)',
        }}
      >
        <IconShieldCheck size={48} />
      </Box>
    </Center>
    <Title ta="center" order={2} mb="xs">
      Konfiguracja Początkowa
    </Title>
    <Text c="dimmed" size="sm" ta="center" mb={30}>
      Utwórz konto pierwszego administratora systemu Katalogu Przedmiotów.
    </Text>
    <Paper withBorder shadow="md" p={30} radius="md">
      <SetupForm />
    </Paper>
  </Container>
);
