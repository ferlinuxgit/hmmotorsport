const appUrl = process.env.APP_URL ?? "http://localhost:3000";
const secret = process.env.JOB_RUNNER_SECRET;

if (!secret || secret.length < 32) throw new Error("JOB_RUNNER_SECRET must contain at least 32 characters");

const response = await fetch(new URL("/api/internal/jobs/run", appUrl), {
  method: "POST",
  headers: { authorization: `Bearer ${secret}` }
});
const body = await response.text();
if (!response.ok) throw new Error(`Job runner failed with ${response.status}: ${body}`);
console.log(body);
