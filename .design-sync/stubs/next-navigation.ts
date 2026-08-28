// Design-sync stub for `next/navigation`.
//
// AppLayout reads usePathname() to mark the active NavLink, and
// useActionRunner calls router.refresh() after every successful action. The
// real module needs Next's App Router context, which no preview or generated
// design provides — without this stub every screen throws on mount.
//
// usePathname returns '/' so AppLayout highlights its first nav entry, which is
// the state a design should show by default.
//
// Wired in via `paths` in ../tsconfig.sync.json.

export function usePathname(): string {
  return '/';
}

export function useSearchParams(): URLSearchParams {
  return new URLSearchParams();
}

export function useParams(): Record<string, string> {
  return {};
}

export interface StubRouter {
  push(href: string): void;
  replace(href: string): void;
  refresh(): void;
  back(): void;
  forward(): void;
  prefetch(href: string): void;
}

const router: StubRouter = {
  push: () => {},
  replace: () => {},
  refresh: () => {},
  back: () => {},
  forward: () => {},
  prefetch: () => {},
};

export function useRouter(): StubRouter {
  return router;
}

export function redirect(_href: string): never {
  throw new Error('redirect() is not available in a design preview');
}

export function notFound(): never {
  throw new Error('notFound() is not available in a design preview');
}
