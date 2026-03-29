/**
 * Builds static HTML for /privacy, /terms, and /support from docs/legal/*.md (plus a static support page).
 * Run from repo: cd website && npm install && npm run build
 */

import { readFileSync, mkdirSync, writeFileSync, cpSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

const __dirname = dirname(fileURLToPath(import.meta.url));
const websiteRoot = join(__dirname, '..');
/** Repo root (parent of website/) */
const repoRoot = join(websiteRoot, '..');
/** Public site origin for canonical, Open Graph, robots, and sitemap (no trailing slash). */
const PUBLIC_SITE_ORIGIN = 'https://prop-folio.vercel.app';
const dist = join(websiteRoot, 'dist');
const docsLegal = join(repoRoot, 'docs', 'legal');

marked.setOptions({
  gfm: true,
  breaks: false,
});

/** Shared header nav + inline footer links (trailing paths use slash for static hosts). */
const NAV_LINKS_HTML = `
          <a href="/privacy/">Privacy</a>
          <a href="/terms/">Terms</a>
          <a href="/support/">Support</a>
`;
const FOOTER_INLINE_LINKS = `<a href="/">Home</a> · <a href="/privacy/">Privacy</a> · <a href="/terms/">Terms</a> · <a href="/support/">Support</a>`;

function extractPublicMarkdown(filename, beginMarker) {
  const raw = readFileSync(join(docsLegal, filename), 'utf8');
  const idx = raw.indexOf(beginMarker);
  if (idx === -1) {
    throw new Error(`Missing marker ${beginMarker} in ${filename}`);
  }
  let body = raw.slice(idx + beginMarker.length).trim();
  return body;
}

function wrapPage({ metaTitle, description, bodyHtml, canonicalPath }) {
  const safeMetaTitle = escapeAttr(metaTitle);
  const safeDesc = escapeAttr(description);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="${safeDesc}" />
  <meta name="robots" content="index, follow" />
  <meta name="theme-color" content="#0d47a1" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="PropFolio" />
  <meta property="og:title" content="${safeMetaTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:url" content="${PUBLIC_SITE_ORIGIN}${canonicalPath}" />
  <meta name="twitter:card" content="summary" />
  <meta name="twitter:title" content="${safeMetaTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <title>${safeMetaTitle}</title>
  <link rel="stylesheet" href="/assets/legal.css" />
  <link rel="canonical" href="${PUBLIC_SITE_ORIGIN}${canonicalPath}" />
</head>
<body>
  <div class="legal-shell">
    <header class="legal-header">
      <div class="legal-header-accent" aria-hidden="true"></div>
      <div class="legal-header-inner">
        <a class="legal-brand" href="/">PropFolio</a>
        <span class="legal-tagline">Real estate investment intelligence</span>
        <nav class="legal-nav" aria-label="Legal and support">
          ${NAV_LINKS_HTML}
        </nav>
      </div>
    </header>
    <main class="legal-main" id="main">
      <article class="legal-doc" aria-labelledby="doc-title">
        <p class="legal-skip-note"><a class="legal-skip-link" href="#doc-title">Skip to content</a></p>
        ${bodyHtml}
        <footer class="legal-page-footer">
          <p>© ${new Date().getFullYear()} PropFolio. ${FOOTER_INLINE_LINKS}</p>
        </footer>
      </article>
    </main>
  </div>
</body>
</html>
`;
}

function escapeAttr(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function htmlFromMd(md) {
  return marked.parse(md);
}

/**
 * Wrap [INSERT …] tokens in HTML so placeholders are visually distinct on the public site.
 */
function markPlaceholders(html) {
  return html.replace(/\[INSERT[^\]]+\]/g, (match) => {
    return `<span class="legal-placeholder" title="Replace before publishing">${match}</span>`;
  });
}

/** First h1 gets id for skip link and aria-labelledby. */
function addDocTitleId(html) {
  return html.replace('<h1>', '<h1 id="doc-title">');
}

function buildHub() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="PropFolio legal hub — Privacy Policy and Terms of Service for the real estate investment intelligence app." />
  <meta name="robots" content="index, follow" />
  <meta name="theme-color" content="#0d47a1" />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="PropFolio" />
  <meta property="og:title" content="PropFolio — Legal" />
  <meta property="og:description" content="Privacy Policy and Terms of Service for PropFolio." />
  <meta property="og:url" content="${PUBLIC_SITE_ORIGIN}/" />
  <title>PropFolio — Legal</title>
  <link rel="stylesheet" href="/assets/legal.css" />
  <link rel="canonical" href="${PUBLIC_SITE_ORIGIN}/" />
</head>
<body>
  <div class="legal-shell">
    <header class="legal-header">
      <div class="legal-header-accent" aria-hidden="true"></div>
      <div class="legal-header-inner">
        <a class="legal-brand" href="/">PropFolio</a>
        <span class="legal-tagline">Real estate investment intelligence</span>
        <nav class="legal-nav" aria-label="Legal and support">
          ${NAV_LINKS_HTML}
        </nav>
      </div>
    </header>
    <main class="legal-main legal-hub" id="main">
      <article class="legal-doc legal-doc--hub">
        <h1 id="doc-title">Legal</h1>
        <p class="legal-hub-lead">Official policies for the PropFolio app. Update these documents without updating the mobile app.</p>
        <ul class="legal-hub-list">
          <li><a href="/privacy/">Privacy Policy</a> — how we handle your information</li>
          <li><a href="/terms/">Terms of Service</a> — rules for using PropFolio</li>
          <li><a href="/support/">Support</a> — contact and help</li>
        </ul>
        <footer class="legal-page-footer">
          <p>© ${new Date().getFullYear()} PropFolio. ${FOOTER_INLINE_LINKS}</p>
        </footer>
      </article>
    </main>
  </div>
</body>
</html>`;
  writeFileSync(join(dist, 'index.html'), html, 'utf8');
}

function buildRobots() {
  const body = `User-agent: *
Allow: /

Sitemap: ${PUBLIC_SITE_ORIGIN}/sitemap.xml
`;
  writeFileSync(join(dist, 'robots.txt'), body, 'utf8');
}

function buildSitemap() {
  const lastmod = new Date().toISOString().split('T')[0];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${PUBLIC_SITE_ORIGIN}/</loc><lastmod>${lastmod}</lastmod></url>
  <url><loc>${PUBLIC_SITE_ORIGIN}/privacy/</loc><lastmod>${lastmod}</lastmod></url>
  <url><loc>${PUBLIC_SITE_ORIGIN}/terms/</loc><lastmod>${lastmod}</lastmod></url>
  <url><loc>${PUBLIC_SITE_ORIGIN}/support/</loc><lastmod>${lastmod}</lastmod></url>
</urlset>
`;
  writeFileSync(join(dist, 'sitemap.xml'), xml.trim(), 'utf8');
}

mkdirSync(join(dist, 'privacy'), { recursive: true });
mkdirSync(join(dist, 'terms'), { recursive: true });
mkdirSync(join(dist, 'support'), { recursive: true });
mkdirSync(join(dist, 'assets'), { recursive: true });

cpSync(join(websiteRoot, 'assets', 'legal.css'), join(dist, 'assets', 'legal.css'));

const privacyMd = extractPublicMarkdown('privacy-policy.md', '**BEGIN PUBLIC PRIVACY POLICY**');
const termsMd = extractPublicMarkdown('terms-of-service.md', '**BEGIN PUBLIC TERMS OF SERVICE**');

const privacyBody = addDocTitleId(markPlaceholders(htmlFromMd(privacyMd)));
const termsBody = addDocTitleId(markPlaceholders(htmlFromMd(termsMd)));

writeFileSync(
  join(dist, 'privacy', 'index.html'),
  wrapPage({
    metaTitle: 'PropFolio Privacy Policy',
    description:
      'PropFolio Privacy Policy — how we collect, use, disclose, and protect your information when you use our real estate analysis app.',
    bodyHtml: privacyBody,
    canonicalPath: '/privacy/',
  }),
  'utf8'
);

writeFileSync(
  join(dist, 'terms', 'index.html'),
  wrapPage({
    metaTitle: 'PropFolio Terms of Service',
    description:
      'PropFolio Terms of Service — rules and limitations for using the PropFolio mobile application.',
    bodyHtml: termsBody,
    canonicalPath: '/terms/',
  }),
  'utf8'
);

const supportBody = `<h1 id="doc-title">Support</h1>
<p>Need help with <strong>PropFolio</strong> — account access, imports, analysis, or subscriptions? We’re here to assist.</p>
<h2>Contact us</h2>
<p>The fastest way to reach us is by email:</p>
<p><a href="mailto:support@propfolio.app">support@propfolio.app</a></p>
<p>Please include your account email (if applicable) and a short description of the issue. We aim to respond within a few business days.</p>
<h2>In the app</h2>
<p>For subscription and billing questions, check <strong>Settings</strong> in the PropFolio app for account and help options.</p>`;

writeFileSync(
  join(dist, 'support', 'index.html'),
  wrapPage({
    metaTitle: 'PropFolio — Support',
    description:
      'Contact PropFolio support for help with the real estate investment intelligence app — account, technical, and billing questions.',
    bodyHtml: supportBody,
    canonicalPath: '/support/',
  }),
  'utf8'
);

buildHub();
buildRobots();
buildSitemap();

console.log('Built:', join(dist, 'index.html'));
console.log('Built:', join(dist, 'robots.txt'));
console.log('Built:', join(dist, 'sitemap.xml'));
console.log('Built:', join(dist, 'privacy', 'index.html'));
console.log('Built:', join(dist, 'terms', 'index.html'));
console.log('Built:', join(dist, 'support', 'index.html'));
