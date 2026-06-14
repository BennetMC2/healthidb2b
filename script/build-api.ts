import { build as esbuild } from "esbuild";
import path from "node:path";

// Only native modules stay external — everything else gets bundled
const external = [
  "better-sqlite3",
];

async function buildApi() {
  console.log("building vercel api...");

  await esbuild({
    entryPoints: ["server/vercel.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "api/index.js",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external,
    logLevel: "info",
  });
}

buildApi().catch((err) => {
  console.error(err);
  process.exit(1);
});
