'use client';

import { useState, useMemo } from 'react';
import {
  SimpleGrid,
  Card,
  Image,
  Text,
  Badge,
  Group,
  TextInput,
  SegmentedControl,
  Stack,
  Button,
  Title,
  Paper,
  Center,
  Box,
  Select,
  ActionIcon,
} from '@mantine/core';
import {
  IconSearch,
  IconPlus,
  IconPackageOff,
  IconCalendar,
  IconUser,
  IconSortDescending,
  IconSortAscending,
  IconX,
} from '@tabler/icons-react';
import Link from 'next/link';
import type { CategoryWithCount } from '@/lib/services/categories';
import type { ItemWithCategory } from '@/lib/services/items';
import { thumbUrl } from '@/lib/images';

interface ItemsCatalogProps {
  initialCategories: CategoryWithCount[];
  initialItems: ItemWithCategory[];
}

export function ItemsCatalog({
  initialCategories,
  initialItems,
}: ItemsCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const totalItemsCount = initialItems.length;

  const filteredItems = useMemo(() => {
    return initialItems
      .filter((item) => {
        // Category filter
        if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) {
          return false;
        }

        // Search query filter (matches description)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const descMatch = (item.description || '').toLowerCase().includes(q);
          if (!descMatch) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
      });
  }, [initialItems, selectedCategory, searchQuery, sortOrder]);

  const categoryOptions = [
    { value: 'all', label: `Wszystkie (${totalItemsCount})` },
    ...initialCategories.map((cat) => ({
      value: cat.id,
      label: `${cat.name} (${cat.itemCount})`,
    })),
  ];

  return (
    <Stack gap="lg">
      {/* Top Bar: Search, Category & Sort Controls */}
      <Paper p="md" radius="md" withBorder shadow="xs">
        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <Title order={2} size="h3">
              Katalog Przedmiotów
            </Title>
            <Button
              component={Link}
              href="/items/new"
              color="teal"
              leftSection={<IconPlus size={18} />}
            >
              Dodaj przedmiot
            </Button>
          </Group>

          <Group grow align="flex-end">
            <TextInput
              placeholder="Szukaj po opisie przedmiotu..."
              leftSection={<IconSearch size={18} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
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
            />

            <Select
              data={categoryOptions}
              value={selectedCategory}
              onChange={(val) => setSelectedCategory(val || 'all')}
              placeholder="Wybierz kategorię"
              allowDeselect={false}
            />

            <SegmentedControl
              value={sortOrder}
              onChange={(val) => setSortOrder(val as 'newest' | 'oldest')}
              data={[
                {
                  value: 'newest',
                  label: (
                    <Center style={{ gap: 6 }}>
                      <IconSortDescending size={16} />
                      <span>Najnowsze</span>
                    </Center>
                  ),
                },
                {
                  value: 'oldest',
                  label: (
                    <Center style={{ gap: 6 }}>
                      <IconSortAscending size={16} />
                      <span>Najstarsze</span>
                    </Center>
                  ),
                },
              ]}
            />
          </Group>
        </Stack>
      </Paper>

      {/* Items Grid */}
      {filteredItems.length === 0 ? (
        <Paper p={50} radius="md" withBorder ta="center">
          <Center mb="md">
            <Box
              p="md"
              style={{
                background: 'var(--mantine-color-gray-light)',
                borderRadius: '50%',
                color: 'var(--mantine-color-gray-6)',
              }}
            >
              <IconPackageOff size={48} />
            </Box>
          </Center>
          <Title order={3} mb="xs">
            Brak przedmiotów
          </Title>
          <Text c="dimmed" size="sm" mb="lg">
            {searchQuery || selectedCategory !== 'all'
              ? 'Nie znaleziono przedmiotów spełniających wybrane kryteria.'
              : 'Nie dodałeś jeszcze żadnych przedmiotów do katalogu.'}
          </Text>
          <Button
            component={Link}
            href="/items/new"
            color="teal"
            leftSection={<IconPlus size={18} />}
          >
            Dodaj pierwszy przedmiot
          </Button>
        </Paper>
      ) : (
        <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 4 }} spacing="md">
          {filteredItems.map((item) => {
            const dateStr = new Date(item.createdAt).toLocaleDateString('pl-PL', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            });

            return (
              <Card
                key={item.id}
                component={Link}
                href={`/items/${item.id}`}
                shadow="sm"
                padding="md"
                radius="md"
                withBorder
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = 'var(--mantine-shadow-md)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'var(--mantine-shadow-sm)';
                }}
              >
                <Card.Section>
                  <Image
                    src={thumbUrl(item.mainImage)}
                    height={190}
                    alt={item.description || item.categoryName}
                    fallbackSrc="https://placehold.co/400x300?text=Brak+zdjęcia"
                    style={{ objectFit: 'cover' }}
                  />
                </Card.Section>

                <Stack gap="xs" mt="md">
                  <Group justify="space-between" align="center">
                    <Badge color="teal" variant="light" size="sm">
                      {item.categoryName}
                    </Badge>
                    {item.additionalImages && item.additionalImages.length > 0 && (
                      <Badge color="gray" variant="outline" size="xs">
                        +{item.additionalImages.length} zdjęć
                      </Badge>
                    )}
                  </Group>

                  <Text
                    fw={500}
                    size="sm"
                    lineClamp={2}
                    style={{ minHeight: 42 }}
                  >
                    {item.description || (
                      <Text span c="dimmed" fs="italic">
                        Bez opisu
                      </Text>
                    )}
                  </Text>

                  <Group justify="space-between" mt="xs" pt="xs" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
                    <Group gap={4}>
                      <IconUser size={14} color="var(--mantine-color-dimmed)" />
                      <Text size="xs" c="dimmed">
                        {item.createdByName}
                      </Text>
                    </Group>
                    <Group gap={4}>
                      <IconCalendar size={14} color="var(--mantine-color-dimmed)" />
                      <Text size="xs" c="dimmed">
                        {dateStr}
                      </Text>
                    </Group>
                  </Group>
                </Stack>
              </Card>
            );
          })}
        </SimpleGrid>
      )}
    </Stack>
  );
}
