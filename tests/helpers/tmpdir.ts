import path from 'path';
import { fileURLToPath } from 'url';

// Anchored to this file, not to process.cwd(). Two checkouts of the repo launched
// from the same working directory would otherwise resolve their fixtures to the
// same tmp/ path and wipe each other mid-run. The pid suffix keeps concurrent
// runs of the same checkout apart as well.
const REPO_ROOT = fileURLToPath(new URL('../..', import.meta.url));

export function testTmpDir(name: string): string {
  return path.join(REPO_ROOT, 'tmp', `${name}-${process.pid}`);
}
