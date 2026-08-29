import path from 'path';

const ROOT = path.resolve(__dirname, '..');

/** Throwaway DB + uploads, wiped per run. Never ./data. `tmp/` is gitignored. */
export const E2E_DATA_DIR = path.join(ROOT, 'tmp/e2e-data');
/** Generated image fixtures (see global-setup.ts), kept out of the repo. */
export const E2E_FIXTURE_DIR = path.join(ROOT, 'tmp/e2e-fixtures');
/** Session saved by auth.setup.ts and replayed by the main project. */
export const AUTH_FILE = path.join(ROOT, 'tmp/e2e-auth.json');

/** The first-run account every test authenticates as. */
export const ACCOUNT = {
  username: 'domownik',
  password: 'tajne-haslo-123',
};
