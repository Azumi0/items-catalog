import { getUserCount } from '@/lib/services/users';
import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import SetupForm from './SetupForm';
import { Container, Paper, Title, Text, Center, Box } from '@mantine/core';
import { IconShieldCheck } from '@tabler/icons-react';

export const dynamic = 'force-dynamic';

export default async function SetupPage() {
  const count = await getUserCount();
  if (count > 0) {
    const user = await getCurrentUser();
    if (user) {
      redirect('/');
    } else {
      redirect('/login');
    }
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
}
