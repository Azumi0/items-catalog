import { Box, Card, Text } from '@mantine/core';
import Link from 'next/link';
import type { CategoryWithCount } from '@/lib/services/categories';
import { itemCountLabel } from '@/lib/itemCount';
import { AutoGrid } from './AutoGrid';
import { CategoryVisual } from './CategoryVisual';

interface CategoryTilesProps {
  categories: CategoryWithCount[];
}

/**
 * The catalog's entry screen: one tile per category, each a link into that
 * category's items. Replaces the global item list — the category is chosen
 * here instead of through a select in the filter bar.
 */
export function CategoryTiles({ categories }: CategoryTilesProps) {
  if (categories.length === 0) {
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
          Brak kategorii
        </Text>
        <Text fz={14} c="dimmed">
          Dodaj pierwszą kategorię przyciskiem „+”.
        </Text>
      </Box>
    );
  }

  return (
    <AutoGrid min={150}>
      {categories.map((category) => (
        <Card
          key={category.id}
          component={Link}
          href={`/categories/${category.id}/items`}
          withBorder
          radius="md"
          shadow="xs"
          p={0}
          style={{
            overflow: 'hidden',
            textAlign: 'left',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <CategoryVisual category={category} variant="tile" />
          <Box pt={10} px={12} pb={12}>
            <Text fz={15} fw={600} lh={1.25} truncate>
              {category.name}
            </Text>
            <Text fz={12} c="dimmed" mt={4}>
              {itemCountLabel(category.itemCount)}
            </Text>
          </Box>
        </Card>
      ))}
    </AutoGrid>
  );
}
