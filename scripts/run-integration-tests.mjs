import { readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join } from "node:path";

async function collectIntegrationTests(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectIntegrationTests(path));
    else if (entry.name.endsWith(".integration.test.ts")) files.push(path);
  }
  return files;
}

const files = (await collectIntegrationTests("tests")).sort();
if (files.length === 0) throw new Error("No integration test files were found");

const child = spawn(process.execPath, ["--import", "tsx", "--test", "--test-concurrency=1", ...files], {
  stdio: "inherit",
  env: { ...process.env, LOG_LEVEL: "silent" }
});
child.once("error", (error) => { throw error; });
child.once("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exitCode = code ?? 1;
});
