import { build as esbuild } from "esbuild";
import { readFile } from "node:fs/promises";

const allowlist = [
  "express",
  "zod",
  "zod-validation-error",
  "dotenv",
  "date-fns",
];

// Native or heavy packages not in package.json but imported by server code
const alwaysExternal = [
  "better-sqlite3",
];

async function buildApi() {
  console.log("building vercel api...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = [
    ...allDeps.filter((dep) => !allowlist.includes(dep)),
    ...alwaysExternal,
  ];

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
    external: externals,
    logLevel: "info",
  });
}

buildApi().catch((err) => {
  console.error(err);
  process.exit(1);
});
