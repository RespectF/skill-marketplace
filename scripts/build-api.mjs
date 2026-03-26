import { build } from "esbuild";

await build({
  entryPoints: ["api/[...slug].ts"],
  bundle: true,
  platform: "node",
  target: "node18",
  format: "cjs",
  outfile: "api/[...slug].js",
  external: [
    "aws-crt",
  ],
});

console.log("✓ API function bundled to api/[...slug].js");
