import { execSync } from "node:child_process";

/**
 * EAS sets EAS_BUILD=true during the job. Writing under `assets/` during `npm ci`
 * can hit EACCES on the builder; a committed `assets/web-app.zip` stub is used instead.
 * Local installs still run ensure-web-zip-stub when the bundle is missing/small.
 */
if (process.env.EAS_BUILD === "true") {
  console.log("[postinstall] EAS_BUILD=true: skip ensure-web-zip-stub (use committed assets/web-app.zip).");
} else {
  execSync("node scripts/ensure-web-zip-stub.mjs", { stdio: "inherit" });
}

execSync("npx patch-package", { stdio: "inherit" });
