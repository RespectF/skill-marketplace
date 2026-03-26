import { build } from "esbuild";
import { mkdirSync } from "fs";
import { join } from "path";

// Bundle the API handler for Vercel (CJS format, self-contained)
mkdirSync(join(process.cwd(), "vercel-api"), { recursive: true });

await build({
  entryPoints: ["api/index.ts"],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "cjs",
  outfile: join(process.cwd(), "vercel-api", "index.js"),
  external: [],
});

console.log("✓ API bundled to vercel-api/index.js");
