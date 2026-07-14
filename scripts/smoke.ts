const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";

const checks = [
  { path: "/api/live", expectedStatus: 200 },
  { path: "/api/ready", expectedStatus: 200 },
  { path: "/robots.txt", expectedStatus: 200 },
  { path: "/sitemap.xml", expectedStatus: 200 },
  { path: "/manifest.webmanifest", expectedStatus: 200 }
];

async function requestWithTimeout(url: string, timeoutMs = 5_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

for (const check of checks) {
  const url = new URL(check.path, baseUrl);
  const response = await requestWithTimeout(url.toString());

  if (response.status !== check.expectedStatus) {
    const body = await response.text();
    throw new Error(`Smoke check failed for ${check.path}: expected ${check.expectedStatus}, got ${response.status}. ${body}`);
  }
}

console.log(`Smoke checks passed for ${baseUrl}`);

export {};
