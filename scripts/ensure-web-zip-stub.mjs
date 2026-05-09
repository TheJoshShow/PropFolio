import { createWriteStream } from "node:fs";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import archiver from "archiver";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const repoRoot = join(__dirname, "..");
const outZip = join(repoRoot, "assets", "web-app.zip");

if (existsSync(outZip) && statSync(outZip).size > 500) {
  process.exit(0);
}

mkdirSync(join(repoRoot, "assets"), { recursive: true });

const html = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>PropFolio shell</title></head><body style="font-family:system-ui;padding:24px"><p>Embedded bundle missing. Run <code>npm run build:web</code> or an EAS build.</p></body></html>`;

await new Promise((resolve, reject) => {
  const output = createWriteStream(outZip);
  const archive = archiver("zip", { zlib: { level: 9 } });
  output.on("close", resolve);
  archive.on("error", reject);
  archive.pipe(output);
  archive.append(html, { name: "index.html" });
  archive.finalize();
});
