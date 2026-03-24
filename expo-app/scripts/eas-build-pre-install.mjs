/**
 * EAS cloud build pre-install (Linux worker). Removes `node_modules` before a fresh install.
 * Uses Node fs only — no bash/chmod — so behavior is predictable and path-safe on any worker OS.
 *
 * Optional Unix chmod: on non-Windows, best-effort `chmod -R u+w .` for odd permission bits from uploads.
 */
import { execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const nm = path.join(projectRoot, 'node_modules');

if (process.env.EAS_BUILD !== 'true') {
  process.exit(0);
}

if (process.platform !== 'win32') {
  try {
    execSync('chmod -R u+w .', { cwd: projectRoot, stdio: 'pipe' });
  } catch {
    /* ignore */
  }
}

if (existsSync(nm)) {
  try {
    rmSync(nm, { recursive: true, force: true });
  } catch (e) {
    console.error('[eas-build-pre-install] Failed to remove node_modules:', e?.message ?? e);
    process.exit(1);
  }
}
