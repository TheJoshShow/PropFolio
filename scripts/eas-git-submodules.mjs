import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * EAS often uploads a tarball without `.git`. In that case we rely on the working
 * copy already containing `propfolios/` (run `npm run sync:propfolios` before `eas build` locally).
 * When `.git` exists (e.g. some CI), initialize submodules.
 */
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const propfoliosPkg = join(root, "propfolios", "package.json");

if (!existsSync(join(root, ".git"))) {
  console.log("[eas-git-submodules] No .git in build context; expecting propfolios/ from upload.");
  if (!existsSync(propfoliosPkg)) {
    console.error(
      "[eas-git-submodules] Missing propfolios/package.json. Run `npm run sync:propfolios` before eas build, or fix submodule checkout.",
    );
    process.exit(1);
  }
  process.exit(0);
}

try {
  execSync("git submodule update --init --recursive", { cwd: root, stdio: "inherit" });
} catch {
  console.warn("[eas-git-submodules] git submodule update failed; checking propfolios/ …");
  if (!existsSync(propfoliosPkg)) {
    console.error("[eas-git-submodules] propfolios/ is missing after submodule init failure.");
    process.exit(1);
  }
}

if (!existsSync(propfoliosPkg)) {
  console.error("[eas-git-submodules] propfolios/package.json not found.");
  process.exit(1);
}
