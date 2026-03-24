/**
 * Part C — Verify Expo resolves ios.googleServicesFile (and plist on disk).
 * Run from expo-app:
 *   npm run verify:firebase-config
 *   npm run verify:firebase-config:strict   # fails if template plist (REPLACE_ME / propfolio-placeholder)
 *
 * Flags: --strict  (same as :strict npm script)
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

function isTemplatePlist(text) {
  return text.includes('REPLACE_ME') || text.includes('propfolio-placeholder');
}

function main() {
  const strict = process.argv.includes('--strict');
  const expoCli = path.join(projectRoot, 'node_modules', 'expo', 'bin', 'cli');
  let raw;
  try {
    raw = execFileSync(process.execPath, [expoCli, 'config', '--json'], {
      cwd: projectRoot,
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch (e) {
    console.error('[verify:firebase-config] expo config --json failed:', e?.message ?? e);
    process.exit(1);
  }

  let config;
  try {
    config = JSON.parse(raw);
  } catch {
    console.error('[verify:firebase-config] invalid JSON from expo config');
    process.exit(1);
  }

  const ios = config?.ios;
  const bundleId = ios?.bundleIdentifier;
  const gs = ios?.googleServicesFile;

  if (bundleId !== 'com.propfolio.mobile') {
    console.error(
      `[verify:firebase-config] expected ios.bundleIdentifier com.propfolio.mobile, got ${JSON.stringify(bundleId)}`
    );
    process.exit(1);
  }

  if (typeof gs !== 'string' || gs.trim() === '') {
    console.error('[verify:firebase-config] ios.googleServicesFile is missing or empty in resolved config.');
    process.exit(1);
  }

  const plistPath = path.isAbsolute(gs) ? gs : path.join(projectRoot, gs);
  if (!existsSync(plistPath)) {
    console.error(`[verify:firebase-config] plist not found at resolved path:\n  ${plistPath}`);
    process.exit(1);
  }

  const plistText = readFileSync(plistPath, 'utf8');
  if (isTemplatePlist(plistText)) {
    const msg =
      '[verify:firebase-config] plist still looks like a template (REPLACE_ME / propfolio-placeholder). Replace with Firebase download — see docs/FIREBASE_CONSOLE_PLIST.md';
    if (strict) {
      console.error(msg);
      process.exit(1);
    }
    console.warn(`${msg} (non-strict: warning only)`);
  }

  console.log('[verify:firebase-config] OK');
  console.log(`  ios.bundleIdentifier: ${bundleId}`);
  console.log(`  ios.googleServicesFile: ${gs}`);
  console.log(`  resolved plist path: ${plistPath}`);
  process.exit(0);
}

main();
