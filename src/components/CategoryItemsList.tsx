'use client';

import { useMemo, useState } from 'react';
import {
  ActionIcon,
  Box,
  Card,
  Group,
  Image,
  SegmentedControl,
  Text,
  TextInput,
} from '@mantine/core';
import { IconSearch, IconX } from '@tabler/icons-react';
import Link from 'next/link';
import type { ItemWithCategory } from '@/lib/services/items';
import { thumbUrl, THUMB_PLACEHOLDER } from '@/lib/images';
import { AutoGrid } from './AutoGrid';

interface CategoryItemsListProps {
  items: ItemWithCategory[];
}

/**
 * The items of one category. Filtering and sorting stay on the client, over
 * the rows the page already loaded.
 *
 * There is deliberately no category select here: the category was chosen by
 * the tile that led to this screen, and the back chevron changes it.
 */
export function CategoryItemsList({ items }: CategoryItemsListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const visibleItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return items
      .filter(
        (item) =>
          !query || (item.description || '').toLowerCase().includes(query)
      )
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
      });
  }, [items, searchQuery, sortOrder]);

  return (
    <>
      <Group gap={8} mb={16} align="center">
        <TextInput
          placeholder="Szukaj po opisie…"
          aria-label="Szukaj po opisie"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.currentTarget.value)}
          leftSection={<IconSearch size={18} />}
          rightSection={
            searchQuery ? (
              <ActionIcon
                size="sm"
                variant="subtle"
                color="gray"
                onClick={() => setSearchQuery('')}
                aria-label="Wyczyść wyszukiwanie"
              >
                <IconX size={14} />
              </ActionIcon>
            ) : null
          }
          style={{ flex: '1 1 220px' }}
          styles={{
            // 16px keeps iOS Safari from zooming the page on focus.
            input: { height: 48, fontSize: 16 },
            section: { color: 'var(--mantine-color-dimmed)' },
          }}
        />

        <SegmentedControl
          value={sortOrder}
          onChange={(value) => setSortOrder(value as 'newest' | 'oldest')}
          aria-label="Kolejność"
          data={[
            { value: 'newest', label: 'Najnowsze' },
            { value: 'oldest', label: 'Najstarsze' },
          ]}
          styles={{
            root: { padding: 4, background: 'var(--mantine-color-gray-light)' },
            label: {
              height: 40,
              display: 'flex',
              alignItems: 'center',
              padding: '0 14px',
              fontSize: 14,
              fontWeight: 600,
            },
            indicator: { boxShadow: 'var(--mantine-shadow-xs)' },
          }}
        />
      </Group>

      {visibleItems.length === 0 ? (
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
            Brak przedmiotów
          </Text>
          <Text fz={14} c="dimmed">
            Nie znaleziono przedmiotów spełniających kryteria.
          </Text>
        </Box>
      ) : (
        <AutoGrid min={260}>
          {visibleItems.map((item) => {
            const dateStr = new Date(item.createdAt).toLocaleDateString(
              'pl-PL',
              { day: '2-digit', month: '2-digit', year: 'numeric' }
            );

            return (
              <Card
                key={item.id}
                component={Link}
                href={`/items/${item.id}`}
                withBorder
                radius="md"
                shadow="xs"
                p={10}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  gap: 12,
                  textAlign: 'left',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <Image
                  src={thumbUrl(item.mainImage)}
                  alt=""
                  fallbackSrc={THUMB_PLACEHOLDER}
                  w={88}
                  h={88}
                  radius="sm"
                  style={{ flex: 'none', objectFit: 'cover' }}
                />
                <Box
                  style={{
                    minWidth: 0,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <Text fz={14} fw={500} lh={1.35} lineClamp={2}>
                    {item.description || 'Bez opisu'}
                  </Text>
                  <Group gap={10} fz={12} c="dimmed" mt="auto" wrap="nowrap">
                    <Text fz={12} c="dimmed" truncate>
                      {item.createdByName}
                    </Text>
                    <Text fz={12} c="dimmed" style={{ flex: 'none' }}>
                      {dateStr}
                    </Text>
                  </Group>
                </Box>
              </Card>
            );
          })}
        </AutoGrid>
      )}
    </>
  );
}
