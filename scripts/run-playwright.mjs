import { spawn } from "node:child_process";

const environment = { ...process.env };
delete environment.NO_COLOR;

const executable = process.platform === "win32" ? "playwright.cmd" : "playwright";
const child = spawn(executable, process.argv.slice(2), { stdio: "inherit", env: environment });

child.once("error", (error) => { throw error; });
child.once("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exitCode = code ?? 1;
});
