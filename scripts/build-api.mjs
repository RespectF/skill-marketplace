import { build } from "esbuild";
import { mkdirSync } from "fs";
import { join } from "path";

// Ensure dist directory exists
mkdirSync(join(process.cwd(), "dist"), { recursive: true });

// Bundle the API handler to dist/api-handler.js
// Using CJS format so it works without ESM .js extension requirements
await build({
  entryPoints: ["api/[...slug].ts"],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "cjs",
  outfile: join(process.cwd(), "dist", "api-handler.js"),
  external: ["aws-crt"],
});

console.log("✓ API function bundled to dist/api-handler.js");
