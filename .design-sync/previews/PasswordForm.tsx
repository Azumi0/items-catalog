import { PasswordForm } from 'home-item-catalog';

/**
 * `/users/[id]/password` — whose password, then the one field that changes it.
 *
 * FormActionBar is `position: fixed`, which the card harness contains inside
 * itself rather than letting it escape to the page. With only one field, the
 * form's own content is shorter than the bar needs to clear, so the bar pins
 * to the bottom of that short box and paints over the password input. Real
 * usage never sees this — the page always wraps PasswordForm in AppLayout,
 * whose full mobile-viewport height leaves the bar plenty of room — so the
 * minHeight below is preview-only scaffolding, matched to a mobile screen.
 */
export const ChangePassword = () => (
  <div style={{ minHeight: 420 }}>
    <PasswordForm user={{ id: 'u-2', username: 'piotr' }} />
  </div>
);
