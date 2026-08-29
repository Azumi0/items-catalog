import { UserForm } from 'home-item-catalog';

/**
 * `/users/new` — a login and the password the account starts with.
 *
 * FormActionBar is `position: fixed`, which the card harness contains inside
 * itself rather than letting it escape to the page. With only two short
 * fields, the form's own content is shorter than the bar needs to clear, so
 * the bar pins to the bottom of that short box and paints over the password
 * field. Real usage never sees this — the page always wraps UserForm in
 * AppLayout, whose full mobile-viewport height leaves the bar plenty of room
 * — so the minHeight below is preview-only scaffolding, matched to a mobile
 * screen.
 */
export const Create = () => (
  <div style={{ minHeight: 420 }}>
    <UserForm />
  </div>
);
