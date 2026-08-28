import { LoginForm } from 'home-item-catalog';
import { Box, Center, Container, Paper, Text, Title } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';

/** The form on its own — username, password and the submit button. */
export const Form = () => (
  <Container size="xs" py="xl">
    <Paper withBorder shadow="md" p={30} radius="md">
      <LoginForm />
    </Paper>
  </Container>
);

/** The /login page in full: lock badge, heading and card, as src/app/login/page.tsx composes it. */
export const LoginPage = () => (
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
        <IconLock size={48} />
      </Box>
    </Center>
    <Title ta="center" order={2} mb="xs">
      Logowanie
    </Title>
    <Text c="dimmed" size="sm" ta="center" mb={30}>
      Wprowadź swoje dane, aby uzyskać dostęp do Katalogu Przedmiotów.
    </Text>
    <Paper withBorder shadow="md" p={30} radius="md">
      <LoginForm />
    </Paper>
  </Container>
);
