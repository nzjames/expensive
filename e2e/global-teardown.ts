import fs from 'node:fs';
import path from 'node:path';

async function globalTeardown() {
  const dir = process.env.PLAYWRIGHT_TEST_DB_DIR;
  if (dir) {
    try {
      // Double-check we only delete inside system temp directories for safety
      const resolved = path.resolve(dir);
      if (resolved.includes(path.resolve(require('node:os').tmpdir()))) {
        fs.rmSync(resolved, { recursive: true, force: true });
      }
    } catch {}
  }
}

export default globalTeardown;

