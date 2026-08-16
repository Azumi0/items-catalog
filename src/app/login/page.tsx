import { getUserCount } from '@/lib/services/users';
import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import LoginForm from './LoginForm';
import { Container, Paper, Title, Text, Center, Box } from '@mantine/core';
import { IconLock } from '@tabler/icons-react';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const count = await getUserCount();
  if (count === 0) {
    redirect('/setup');
  }

  const user = await getCurrentUser();
  if (user) {
    redirect('/');
  }

  return (
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
}
