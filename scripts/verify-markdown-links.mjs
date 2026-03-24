/**
 * Resolve relative markdown links in tracked .md files and report missing targets.
 * Skips http(s), mailto, anchors-only. Run from repo root: node scripts/verify-markdown-links.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.expo',
  'ios',
  'android',
]);

function walkMdFiles(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkMdFiles(p, out);
    else if (e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

const LINK_RE = /\[([^\]]*)\]\(([^)]+)\)/g;

function checkFile(mdPath) {
  const text = fs.readFileSync(mdPath, 'utf8');
  const baseDir = path.dirname(mdPath);
  const issues = [];
  let m;
  while ((m = LINK_RE.exec(text)) !== null) {
    let href = m[2].trim();
    if (!href || href.startsWith('#')) continue;
    if (/^https?:\/\//i.test(href) || href.startsWith('mailto:')) continue;
    const hash = href.indexOf('#');
    if (hash >= 0) href = href.slice(0, hash);
    if (!href) continue;
    const target = path.resolve(baseDir, href);
    if (!fs.existsSync(target)) {
      issues.push({ href: m[2], resolved: target });
    }
  }
  return issues;
}

function main() {
  const files = walkMdFiles(repoRoot);
  const broken = [];
  for (const f of files) {
    const issues = checkFile(f);
    for (const i of issues) {
      broken.push({ file: f, ...i });
    }
  }
  if (broken.length === 0) {
    console.log(`OK: ${files.length} markdown files, no broken relative links.`);
    process.exit(0);
  }
  console.error(`Broken relative links (${broken.length}):`);
  for (const b of broken) {
    console.error(`- ${path.relative(repoRoot, b.file)}`);
    console.error(`    href: ${b.href}`);
    console.error(`    -> ${b.resolved}`);
  }
  process.exit(1);
}

main();
