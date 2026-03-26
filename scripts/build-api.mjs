import { build } from "esbuild";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const outputDir = join(process.cwd(), ".vercel", "output");
const funcDir = join(outputDir, "functions", "api", "[...slug].func");

// Ensure output directory exists (required for Build Output API)
mkdirSync(outputDir, { recursive: true });
// Write Build Output API config
writeFileSync(join(outputDir, "config.json"), JSON.stringify({ version: 3 }));
// Ensure function directory exists
mkdirSync(funcDir, { recursive: true });

// Bundle the API handler
await build({
  entryPoints: ["api/[...slug].ts"],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "cjs",
  outfile: join(funcDir, "index.js"),
  external: ["aws-crt"],
});

// Write Vercel runtime config
writeFileSync(
  join(funcDir, "vcconfig.json"),
  JSON.stringify({ runtime: "nodejs18.x" })
);

console.log("✓ API function bundled to .vercel/output/functions/api/[...slug].func/");
