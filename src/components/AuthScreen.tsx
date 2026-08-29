import { Box, Stack, Text } from '@mantine/core';
import { IconBox } from '@tabler/icons-react';

interface AuthScreenProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

/**
 * The single centred column behind /login and /setup. No app shell: there is
 * no user yet to name, no tab to be on and nothing to navigate back to.
 */
export function AuthScreen({ title, subtitle, children }: AuthScreenProps) {
  return (
    <Box
      mih="100vh"
      pt={24}
      px={16}
      pb={40}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: 'var(--mantine-color-body)',
      }}
    >
      <Stack gap={24} w="100%" maw={420} mx="auto">
        <Stack align="center" gap={10} ta="center">
          <Box
            w={64}
            h={64}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 18,
              background: 'var(--mantine-color-teal-light)',
              color: 'var(--mantine-color-teal-filled)',
            }}
          >
            <IconBox size={34} />
          </Box>
          <Text fz={24} fw={700} lh={1.15}>
            {title}
          </Text>
          <Text fz={14} c="dimmed" style={{ textWrap: 'pretty' }}>
            {subtitle}
          </Text>
        </Stack>

        {children}
      </Stack>
    </Box>
  );
}
