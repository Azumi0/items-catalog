import { Box, Text } from '@mantine/core';

interface EmptyStateProps {
  /** Bold line: what is missing. */
  title: string;
  /** Dimmed line under it: why, or what to do about it. */
  message: string;
}

/**
 * The bordered "there is nothing here" panel, shared by the category tiles,
 * the category item list and the category management screen — all three drew
 * the same 48/24 padded, centred, bordered box.
 */
export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <Box
      py={48}
      px={24}
      ta="center"
      style={{
        border: '1px solid var(--mantine-color-default-border)',
        borderRadius: 'var(--mantine-radius-md)',
      }}
    >
      <Text fw={700} mb={6}>
        {title}
      </Text>
      <Text fz={14} c="dimmed">
        {message}
      </Text>
    </Box>
  );
}
