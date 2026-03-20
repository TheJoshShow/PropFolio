# PropFolio public website (legal pages)

Static **Privacy Policy** and **Terms of Service** built from `../docs/legal/*.md`. Deploy the **`dist/`** output to your domain root (e.g. `propfolio.app`) so URLs match the app defaults in `expo-app/src/config/legalUrls.ts`.

**Content updates do not require a mobile release** — edit the markdown under `docs/legal/`, run `npm run build`, and redeploy this site.

## Public URL paths (HTTPS, stable)

| Path | Page | Browser `<title>` |
|------|------|-------------------|
| `/` | Legal hub | PropFolio — Legal |
| `/privacy/` | Privacy Policy | **PropFolio Privacy Policy** |
| `/terms/` | Terms of Service | **PropFolio Terms of Service** |

Also generated: **`/robots.txt`**, **`/sitemap.xml`** (for SEO; update sitemap dates when legal content changes materially).

Trailing slashes work; hosts often redirect `/privacy` → `/privacy/`.

**App / store submission URLs** (defaults in the Expo app):

- `https://propfolio.app/privacy`
- `https://propfolio.app/terms`

## Build

```bash
cd website
npm install
npm run build
```

Output: `dist/` — `index.html`, `privacy/index.html`, `terms/index.html`, `assets/legal.css`, `robots.txt`, `sitemap.xml`.

## Styling & placeholders

- Shared styles: `assets/legal.css` (PropFolio navy/blue header accent, readable `max-width`, mobile-friendly type).
- Tokens like `[INSERT EFFECTIVE DATE]` in markdown render as **highlighted placeholders** in HTML until you replace them in the source `.md` files.

## Local preview

```bash
npm run preview
```

Serves `http://localhost:3333` (requires `dist/` from `npm run build`).

## Deploy

### Vercel

1. New Project → Import this repo → **Root Directory:** `website`
2. Framework: **Other** / static
3. **Build Command:** `npm run build` — **Output Directory:** `dist`
4. Attach custom domain (e.g. `propfolio.app`) and enable HTTPS

`vercel.json` adds security headers.

### Netlify

**Base directory:** `website` — use `netlify.toml` (build → `dist`).

### Any static host

Upload the **contents** of `dist/` to the site root (S3/CloudFront, GitHub Pages with custom domain, etc.).

## Editing legal text

1. Edit `docs/legal/privacy-policy.md` and/or `docs/legal/terms-of-service.md` (public sections after `**BEGIN PUBLIC …**`).
2. Run `npm run build` in `website/`.
3. Deploy `dist/`.
