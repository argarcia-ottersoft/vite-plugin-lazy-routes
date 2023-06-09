import path from "node:path";
import url from "node:url";
import fs from "node:fs/promises";

import tsup from "tsup";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const dist = path.join(__dirname, "..", "dist");

const watch = process.argv.includes("--watch");

await fs
  .access(dist)
  .then(() => fs.rm(dist, { recursive: true }))
  .catch(() => {});

const nodeBuild = tsup.build({
  entryPoints: ["lib/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  outDir: "dist",
  watch,
});

await Promise.all([nodeBuild]);
