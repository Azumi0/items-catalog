import { PasswordForm } from 'home-item-catalog';

/** `/users/[id]/password` — whose password, then the one field that changes it. */
export const ChangePassword = () => (
  <PasswordForm user={{ id: 'u-2', username: 'piotr' }} />
);
