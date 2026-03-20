# App icon and splash assets

**Required for App Store build.** `app.json` references:

- **`icon.png`** — App icon. Use **1024×1024 px** PNG (Expo generates other sizes).
- **`splash-icon.png`** — Launch/splash screen image. Use a logo or wordmark; will be shown with `resizeMode: contain` on white (`#ffffff`) background.

Add these files to this folder before building for TestFlight or App Store. Without them, the build may fail or use Expo defaults.

See also: `/app_store_release/submission_audit.md`.
