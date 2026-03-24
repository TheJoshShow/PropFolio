# Windows — repo paths and shells

PropFolio docs use **repo-relative** paths (e.g. `expo-app/`, `docs/`). After you **move or rename** the project folder, update your terminal to the **new** path — nothing in the repo should embed your old `C:\Users\...` or OneDrive location.

## Open the right folder

| Goal | What to do |
|------|------------|
| Run Expo / npm | `cd` to **`expo-app`** (contains `package.json` for the app). |
| Run repo scripts (e.g. link check) | `cd` to **repo root** (contains `README.md`, often parent of `expo-app`). |

In **PowerShell**, prefer:

```powershell
Set-Location -LiteralPath 'D:\your\new\path\PropFolio\expo-app'
```

Use **`-LiteralPath`** when the path contains **`&`**, **`[`**, or other characters that confuse the parser.

## `&` in folder names (e.g. `Realty & Holdings`)

Some shells treat `&` as a command separator. That breaks **`npx expo`** and can resolve the wrong `expo` binary.

**Fix:** From `expo-app`, use **npm scripts** (see `expo-app/README.md`): `npm run expo-cli -- …`, or **`run-expo.cmd`** in `expo-app`, which uses `%~dp0` so the install directory is always correct.

## Secrets and absolute paths (e.g. App Store Connect `.p8`)

Do not commit machine-specific paths, **`AuthKey_*.p8` files**, or EAS submit **debug logs** (they often echo full key paths). In PowerShell, build paths from **`$env:USERPROFILE`** or **`Join-Path`**:

```powershell
$env:ASC_API_KEY_PATH = (Join-Path $env:USERPROFILE 'Downloads\AuthKey_XXXXXXXXXX.p8')
```

See **`expo-app/docs/ENV_SETUP.md`** for EAS submit variables.

## Cursor / tooling

If your editor still opens an **old** workspace path after a move, use **File → Open Folder** and select the **new** project root so search and terminals match the clone on disk.
