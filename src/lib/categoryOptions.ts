import type { CategoryWithCount } from '@/lib/services/categories';

/**
 * Category list in the shape Mantine's Select expects.
 *
 * Lives here rather than beside the service so client components can import it
 * without pulling drizzle and better-sqlite3 into the browser bundle — the
 * service module is server-only, and only its types are safe to import there.
 */
export function toCategoryOptions(categories: CategoryWithCount[]) {
  return categories.map((c) => ({ value: c.id, label: c.name }));
}
