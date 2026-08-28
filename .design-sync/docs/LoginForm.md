---
category: Auth
---

# LoginForm

The sign-in form: username, password, a full-width submit button and an inline
`Alert` for a failed attempt. It is only the form — the `/login` page supplies
the surrounding lock icon, heading and `Paper` card:

```jsx
<Container size="xs" py={80}>
  <Center mb="lg">
    <Box p="md" style={{ background: 'var(--mantine-color-teal-light)', borderRadius: '50%', color: 'var(--mantine-color-teal-filled)' }}>
      <IconLock size={48} />
    </Box>
  </Center>
  <Title ta="center" order={2} mb="xs">Logowanie</Title>
  <Text c="dimmed" size="sm" ta="center" mb={30}>
    Wprowadź swoje dane, aby uzyskać dostęp do Katalogu Przedmiotów.
  </Text>
  <Paper withBorder shadow="md" p={30} radius="md">
    <LoginForm />
  </Paper>
</Container>
```

Takes no props. It renders outside `AppLayout` — a signed-out visitor has no
navigation.
