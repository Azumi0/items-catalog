---
category: Auth
---

# SetupForm

The first-run form that creates the first administrator: administrator name,
password, password confirmation, and an inline `Alert` when the two do not
match. Reached only while the database has no users at all.

Like `LoginForm` it is the form alone — the `/setup` page supplies the shield
icon, the "Konfiguracja Początkowa" heading and the `Paper` card:

```jsx
<Container size="xs" py={80}>
  <Center mb="lg">
    <Box p="md" style={{ background: 'var(--mantine-color-teal-light)', borderRadius: '50%', color: 'var(--mantine-color-teal-filled)' }}>
      <IconShieldCheck size={48} />
    </Box>
  </Center>
  <Title ta="center" order={2} mb="xs">Konfiguracja Początkowa</Title>
  <Text c="dimmed" size="sm" ta="center" mb={30}>
    Utwórz konto pierwszego administratora systemu Katalogu Przedmiotów.
  </Text>
  <Paper withBorder shadow="md" p={30} radius="md">
    <SetupForm />
  </Paper>
</Container>
```

Takes no props, and renders outside `AppLayout`.
