import { promises as fs } from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const extensionsDir = path.join(projectRoot, "src", "extensions");
const outputFile = path.join(projectRoot, "src", "modules", "generated.ts");

async function getModuleEntries() {
  try {
    const entries = await fs.readdir(extensionsDir, { withFileTypes: true });
    const modules = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const folder = path.join(extensionsDir, entry.name);
      const tsPath = path.join(folder, "module.ts");
      const tsxPath = path.join(folder, "module.tsx");

      try {
        await fs.access(tsPath);
        modules.push({
          name: entry.name,
          importPath: `@/extensions/${entry.name}/module`
        });
        continue;
      } catch {}

      try {
        await fs.access(tsxPath);
        modules.push({
          name: entry.name,
          importPath: `@/extensions/${entry.name}/module`
        });
      } catch {}
    }

    return modules.sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

async function writeGeneratedFile() {
  const modules = await getModuleEntries();
  await fs.mkdir(path.dirname(outputFile), { recursive: true });

  const imports = modules
    .map((module, index) => `import { moduleDefinition as module${index} } from "${module.importPath}";`)
    .join("\n");

  const content = `import type { AppModule } from "@/lib/modules/contracts";

${imports || "// No extension modules detected."}

export const installedModules: AppModule[] = [${modules
    .map((_, index) => `module${index}`)
    .join(", ")}];
`;

  await fs.writeFile(outputFile, content, "utf8");
  console.log(`Synced ${modules.length} module(s) into src/modules/generated.ts`);
}

writeGeneratedFile().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

