import { expect, test } from "@playwright/test";

test("public shell, auth recovery and security headers are usable", async ({ page, request }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/HM Motorsport/);
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
  const originalContactLink = page.locator('a[href="/contacto"]').first();
  await originalContactLink.evaluate((element: HTMLAnchorElement) => {
    element.dataset.testid = "delayed-navigation-link";
    element.href = `/contacto?e2e-navigation=${crypto.randomUUID()}`;
  });
  const contactLink = page.getByTestId("delayed-navigation-link");
  await page.route("**/contacto?e2e-navigation=**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1_500));
    await route.continue();
  });
  const navigation = contactLink.click();
  await expect(page.getByRole("progressbar", { name: "Cargando nueva página" })).toBeVisible();
  await navigation;
  await expect(page).toHaveURL(/\/contacto/);
});

test("state-changing APIs reject cross-origin requests before auth", async ({ request }) => {
  const checkout = await request.post("/api/payments/checkout", { headers: { origin: "https://attacker.example", "content-type": "application/json" }, data: { provider: "stripe", priceId: "00000000-0000-4000-8000-000000000000" } });
  expect(checkout.status()).toBe(403);
  const files = await request.post("/api/files", { headers: { origin: "https://attacker.example", "content-type": "application/json" }, data: { filename: "x.txt", mimeType: "text/plain", sizeBytes: 1 } });
  expect(files.status()).toBe(403);
});

test("every workshop service has a complete public page and legacy URLs redirect", async ({ page }) => {
  const servicePaths = [
    "/servicios/calibracion-ecu",
    "/servicios/banco-de-potencia",
    "/servicios/cableado-motorsport",
    "/servicios/preparacion-motor",
    "/servicios/fabricacion-y-montaje",
    "/servicios/jaulas-antivuelco",
    "/servicios/asistencia-en-carreras"
  ];

  for (const path of servicePaths) {
    const response = await page.goto(path);
    expect(response?.ok(), `${path} should return a successful response`).toBe(true);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Antes de empezar." })).toBeVisible();
  }

  await page.goto("/servicios/track-support");
  await expect(page).toHaveURL(/\/servicios\/asistencia-en-carreras$/);
  await page.goto("/cableado");
  await expect(page).toHaveURL(/\/servicios\/cableado-motorsport$/);
});

test("the professional footer exposes usable contact, service and legal links", async ({ page }) => {
  await page.goto("/");
  const footer = page.locator("footer");
  await expect(footer.getByRole("link", { name: "contacto@hmmotorsport.es" })).toHaveAttribute("href", "mailto:contacto@hmmotorsport.es");
  await expect(footer.getByRole("link", { name: /Electrónica/ })).toHaveAttribute("href", "tel:+34622323878");
  await expect(footer.getByRole("link", { name: /Mecánica/ })).toHaveAttribute("href", "tel:+34666052511");
  await expect(footer.getByRole("link", { name: "Aviso legal" })).toHaveAttribute("href", "/terms");
  await expect(footer.getByRole("link", { name: "Banco de potencia" })).toHaveAttribute("href", "/servicios/banco-de-potencia");
});
