import { expect, test } from "@playwright/test";

test("public shell, auth recovery and security headers are usable", async ({ page, request }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Universal Boilerplate/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const response = await request.get("/");
  expect(response.headers()["content-security-policy"]).toContain("default-src 'self'");
  expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  await page.goto("/forgot-password");
  await expect(page.getByRole("heading", { name: "Recuperar contraseña" })).toBeVisible();
  await expect(page.getByLabel("Email")).toBeEditable();
});

test("protected pages redirect and preserve a safe next destination", async ({ page }) => {
  await page.goto("/admin/configuration");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fadmin%2Fconfiguration/);
  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
});

test("global navigation progress is visible during a delayed route transition", async ({ page }) => {
  await page.goto("/");
  const originalSignInLink = page.locator('a[href="/sign-in"]').first();
  await originalSignInLink.evaluate((element: HTMLAnchorElement) => {
    element.dataset.testid = "delayed-navigation-link";
    element.href = `/sign-in?e2e-navigation=${crypto.randomUUID()}`;
  });
  const signInLink = page.getByTestId("delayed-navigation-link");
  await page.route("**/sign-in?e2e-navigation=**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1_500));
    await route.continue();
  });
  const navigation = signInLink.click();
  await expect(page.getByRole("progressbar", { name: "Cargando nueva página" })).toBeVisible();
  await navigation;
  await expect(page).toHaveURL(/\/sign-in/);
});

test("state-changing APIs reject cross-origin requests before auth", async ({ request }) => {
  const checkout = await request.post("/api/payments/checkout", { headers: { origin: "https://attacker.example", "content-type": "application/json" }, data: { provider: "stripe", priceId: "00000000-0000-4000-8000-000000000000" } });
  expect(checkout.status()).toBe(403);
  const files = await request.post("/api/files", { headers: { origin: "https://attacker.example", "content-type": "application/json" }, data: { filename: "x.txt", mimeType: "text/plain", sizeBytes: 1 } });
  expect(files.status()).toBe(403);
});
