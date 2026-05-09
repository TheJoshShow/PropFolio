/**
 * EAS + local: build Propfolios (Vite) from ./propfolios and zip dist → assets/web-app.zip
 * for the Expo WebView shell. Pipeline: GitHub Propfolios → Cursor → Expo → EAS → TestFlight.
 */
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import archiver from "archiver";
import { createWriteStream } from "node:fs";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = join(__dirname, "..");
const webRoot = join(repoRoot, "propfolios");

const easProfile = process.env.EAS_BUILD_PROFILE ?? "";
if (easProfile === "development") {
  console.log(
    "[build-embedded-web] Skipping Vite build for EAS profile \"development\" (dev client). Using stub zip from postinstall.",
  );
  process.exit(0);
}
const distDir = join(webRoot, "dist");
const outZip = join(repoRoot, "assets", "web-app.zip");

function walkFiles(dir, base = dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkFiles(full, base, acc);
    else acc.push({ full, rel: relative(base, full).replace(/\\/g, "/") });
  }
  return acc;
}

if (!existsSync(join(webRoot, "package.json"))) {
  console.error(
    "[build-embedded-web] Missing propfolios/. Run: git submodule update --init --recursive",
  );
  process.exit(1);
}

console.log("[build-embedded-web] npm ci in propfolios/");
execSync("npm ci", { cwd: webRoot, stdio: "inherit" });

console.log("[build-embedded-web] vite build (base ./ for embedded file:// loading)");
execSync("npx vite build --base ./", {
  cwd: webRoot,
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: "production" },
});

if (!existsSync(join(distDir, "index.html"))) {
  console.error("[build-embedded-web] propfolios/dist/index.html not found after build.");
  process.exit(1);
}

mkdirSync(join(repoRoot, "assets"), { recursive: true });

const marker = {
  builtAt: new Date().toISOString(),
  easBuildId: process.env.EAS_BUILD_ID ?? null,
  gitSha: (() => {
    try {
      return execSync("git rev-parse HEAD", { cwd: repoRoot, encoding: "utf8" }).trim();
    } catch {
      return null;
    }
  })(),
  submoduleSha: (() => {
    try {
      return execSync("git rev-parse HEAD", { cwd: webRoot, encoding: "utf8" }).trim();
    } catch {
      return null;
    }
  })(),
};
writeFileSync(join(distDir, ".propfolios-build.json"), JSON.stringify(marker, null, 2), "utf8");

console.log("[build-embedded-web] zipping dist -> assets/web-app.zip");
if (existsSync(outZip)) {
  try {
    unlinkSync(outZip);
  } catch (e) {
    console.warn("[build-embedded-web] could not remove existing web-app.zip:", e);
  }
}
await new Promise((resolve, reject) => {
  const output = createWriteStream(outZip);
  const archive = archiver("zip", { zlib: { level: 9 } });
  output.on("close", resolve);
  archive.on("error", reject);
  archive.pipe(output);
  for (const { full, rel } of walkFiles(distDir)) {
    archive.file(full, { name: rel });
  }
  archive.finalize();
});

console.log("[build-embedded-web] done:", outZip);
