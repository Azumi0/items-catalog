// Design-sync stub for `next/link`.
//
// AppLayout and ItemsCatalog pass Link into Mantine's polymorphic `component`
// prop, so it must accept every anchor prop AND forward a ref — Mantine's
// Button/NavLink/Card set one on the rendered element. The real next/link
// needs the App Router context that no preview provides.
//
// Rendering a plain <a> keeps hrefs visible and hoverable in a design without
// navigating anywhere useful.
//
// Wired in via `paths` in ../tsconfig.sync.json.

import { forwardRef } from 'react';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string | { pathname?: string };
  children?: ReactNode;
  /** Accepted and ignored — the real next/link's routing options. */
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  passHref?: boolean;
  legacyBehavior?: boolean;
}

const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  {
    href,
    children,
    // Destructured only to keep next/link's routing props off the <a>.
    prefetch: _prefetch,
    replace: _replace,
    scroll: _scroll,
    shallow: _shallow,
    passHref: _passHref,
    legacyBehavior: _legacyBehavior,
    ...rest
  },
  ref,
) {
  const resolved = typeof href === 'string' ? href : (href?.pathname ?? '#');
  return (
    <a ref={ref} href={resolved} {...rest}>
      {children}
    </a>
  );
});

export default Link;
