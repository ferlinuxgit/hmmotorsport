import { readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join } from "node:path";

async function collectTestFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectTestFiles(path));
    else if (entry.name.endsWith(".test.ts") && !entry.name.endsWith(".integration.test.ts")) files.push(path);
  }
  return files;
}

const files = (await collectTestFiles("tests")).sort();
if (files.length === 0) throw new Error("No unit test files were found");

const child = spawn(process.execPath, ["--import", "tsx", "--test", ...files], { stdio: "inherit" });
child.once("error", (error) => { throw error; });
child.once("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exitCode = code ?? 1;
});
