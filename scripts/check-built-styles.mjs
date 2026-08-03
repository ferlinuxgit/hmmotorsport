import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const chunksDirectory = join(process.cwd(), ".next", "static", "chunks");
const entries = await readdir(chunksDirectory, { withFileTypes: true });
const cssFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".css"));

if (cssFiles.length === 0) {
  throw new Error("No compiled CSS files were found in .next/static/chunks");
}

const compiledCss = (
  await Promise.all(cssFiles.map((entry) => readFile(join(chunksDirectory, entry.name), "utf8")))
).join("\n");

const requiredUtilities = [".max-w-7xl", ".px-6", ".bg-primary", ".sm\\:text-5xl", ".lg\\:grid-cols-5"];
const missingUtilities = requiredUtilities.filter((utility) => !compiledCss.includes(utility));

if (missingUtilities.length > 0) {
  throw new Error(`Tailwind build is missing required utilities: ${missingUtilities.join(", ")}`);
}

console.log(`Verified ${requiredUtilities.length} required Tailwind utilities in the production CSS.`);
