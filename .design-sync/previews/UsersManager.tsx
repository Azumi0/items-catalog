import { UsersManager } from 'home-item-catalog';

const created = new Date('2025-09-21T08:00:00Z');
const later = new Date('2026-01-30T19:45:00Z');

const users = [
  { id: 'u-1', username: 'kasia', createdAt: created },
  { id: 'u-2', username: 'piotr', createdAt: created },
  { id: 'u-3', username: 'mama', createdAt: later },
  { id: 'u-4', username: 'tata', createdAt: later },
];

/** The household member table. The signed-in row is badged and its delete button is disabled. */
export const Users = () => (
  <UsersManager initialUsers={users} currentUserId="u-1" />
);

/** A single-member household, just after setup created the first administrator. */
export const OnlyCurrentUser = () => (
  <UsersManager initialUsers={[users[0]]} currentUserId="u-1" />
);
