import { FormActionBar } from 'home-item-catalog';

// The bar is fixed to the viewport, so each story needs room of its own to
// sit in rather than stacking at the bottom of a shared preview.
const Frame = ({ children }: { children: React.ReactNode }) => (
  <div style={{ position: 'relative', height: 140, overflow: 'hidden' }}>{children}</div>
);

/** How every create form ends. */
export const Create = () => (
  <Frame>
    <FormActionBar cancelHref="/categories" submitLabel="Utwórz kategorię" />
  </Frame>
);

/** The edit wording, and the primary action mid-request. */
export const Saving = () => (
  <Frame>
    <FormActionBar cancelHref="/users" submitLabel="Zapisz zmiany" loading />
  </Frame>
);

/** Nothing to submit yet — the primary action is unavailable. */
export const Disabled = () => (
  <Frame>
    <FormActionBar cancelHref="/" submitLabel="Dodaj przedmiot" disabled />
  </Frame>
);
