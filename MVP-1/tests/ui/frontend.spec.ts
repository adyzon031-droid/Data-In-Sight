import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("switch").first()).toBeEnabled();
});

test("opciones, navegación y temas sin protección ficticia", async ({
  page,
}) => {
  await expect(
    page.getByRole("heading", { name: "Configuración general" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Detección", exact: true }).click();
  await expect(page.getByText("Bloqueo crítico", { exact: true })).toHaveCount(
    2,
  );
  await page.getByRole("button", { name: "Sitios web", exact: true }).click();
  await expect(page.getByText("Experimental", { exact: true })).toHaveCount(3);
  await page.getByRole("button", { name: "Apariencia", exact: true }).click();
  await page.getByRole("radio", { name: "Oscuro" }).check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(
    page.getByRole("status", { name: "Estado de ajustes" }),
  ).toContainText("solo en esta vista previa");
  await page.screenshot({
    path: "docs/diseno/capturas/apariencia-oscura.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "General", exact: true }).click();
  await page.screenshot({
    path: "docs/diseno/capturas/redisenio-v2-oscuro.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Apariencia", exact: true }).click();
  await page.getByRole("radio", { name: "Claro" }).check();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("logo con alfa real y tipografías empaquetadas disponibles", async ({
  page,
}) => {
  await page.evaluate(() => document.fonts.ready);
  const logo = page.locator(".dis-sidebar .dis-brand-symbol img");
  await expect(logo).toBeVisible();
  const alpha = await logo.evaluate(async (element) => {
    const image = element as HTMLImageElement;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(image, 0, 0);
    return ctx.getImageData(0, 0, 1, 1).data[3];
  });
  expect(alpha).toBe(0);
  expect(
    await logo
      .locator("..")
      .evaluate((element) => getComputedStyle(element).backgroundColor),
  ).toBe("rgba(0, 0, 0, 0)");
  const fonts = await page.evaluate(async () => {
    const display = await document.fonts.load(
      '600 20px "Space Grotesk Variable"',
    );
    const body = await document.fonts.load('500 14px "Manrope Variable"');
    return { display: display.length, body: body.length };
  });
  expect(fonts.display).toBeGreaterThan(0);
  expect(fonts.body).toBeGreaterThan(0);
  expect(
    await page
      .getByRole("heading", { name: "Configuración general" })
      .evaluate((element) => getComputedStyle(element).fontFamily),
  ).toContain("Space Grotesk");
  expect(
    await page
      .locator(".dis-security-hero .dis-security-core")
      .evaluate((element) => getComputedStyle(element).backgroundColor),
  ).toBe("rgba(0, 0, 0, 0)");
});

test("advertencia en Shadow DOM enmascara datos, atrapa foco y cancela con Escape", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Demostración", exact: true }).click();
  await page.getByLabel("Ejemplo para probar").selectOption("personal");
  await page.getByRole("button", { name: "Evaluar mensaje" }).click();
  const modal = page.getByRole("dialog");
  await expect(modal).toBeVisible();
  await expect(modal).toContainText("Información sensible detectada");
  await expect(modal).not.toContainText("alumno@example.com");
  await expect(
    modal.getByRole("button", { name: "Simular continuación sin proteger" }),
  ).toBeVisible();
  await expect(
    modal.getByRole("button", { name: "Proteger y revisar" }),
  ).toBeFocused();
  for (let index = 0; index < 10; index++) {
    await page.keyboard.press("Tab");
    expect(
      await modal.evaluate((element) => {
        const root = element.getRootNode() as ShadowRoot;
        return !!root.activeElement && element.contains(root.activeElement);
      }),
    ).toBe(true);
  }
  await page.screenshot({
    path: "docs/diseno/capturas/advertencia.png",
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await expect(modal).toHaveCount(0);
  await expect(page.getByLabel("Mensaje de prueba")).toBeFocused();
  await expect(
    page.getByRole("status", { name: "Resultado de demostración" }),
  ).toContainText("Revisión cancelada");
});

test("bloqueo crítico, sustitución y reevaluación sin petición externa", async ({
  page,
}) => {
  const outside: string[] = [];
  page.on("request", (request) => {
    if (
      !request.url().startsWith("http://127.0.0.1:5173") &&
      !request.url().startsWith("data:")
    )
      outside.push(request.url());
  });
  await page.getByRole("button", { name: "Demostración", exact: true }).click();
  await page.getByLabel("Ejemplo para probar").selectOption("critical");
  await page.getByRole("button", { name: "Evaluar mensaje" }).click();
  const modal = page.getByRole("dialog");
  await expect(
    modal.getByRole("heading", { name: "Envío bloqueado" }),
  ).toBeVisible();
  await expect(modal).not.toContainText("synthetic-example-key-123");
  await expect(
    modal.getByRole("button", { name: /continuar|continuación/i }),
  ).toHaveCount(0);
  await page.screenshot({
    path: "docs/diseno/capturas/bloqueo.png",
    fullPage: true,
  });
  await modal.getByRole("button", { name: "Proteger y revisar" }).click();
  await expect(
    modal.getByRole("heading", { name: "Revisa el texto protegido" }),
  ).toBeVisible();
  await expect(
    modal.getByLabel("Texto protegido", { exact: true }),
  ).toContainText("[CREDENCIAL_1]");
  await expect(modal).not.toContainText("synthetic-example-key-123");
  await page.screenshot({
    path: "docs/diseno/capturas/vista-previa.png",
    fullPage: true,
  });
  await modal.getByRole("button", { name: "Volver al editor" }).click();
  await expect(page.getByLabel("Mensaje de prueba")).toHaveValue(
    /\[CREDENCIAL_1\]/,
  );
  await page.getByRole("button", { name: "Evaluar mensaje" }).click();
  await expect(
    page.getByRole("status", { name: "Resultado de demostración" }),
  ).toContainText("No se detectaron coincidencias");
  expect(outside).toEqual([]);
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
    })),
  ).toEqual({ local: 0, session: 0 });
});

test("continuación no crítica solo se simula y ajustes personales no desactivan críticos", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Demostración", exact: true }).click();
  await page.getByLabel("Ejemplo para probar").selectOption("personal");
  await page.getByRole("button", { name: "Evaluar mensaje" }).click();
  await page
    .getByRole("button", { name: "Simular continuación sin proteger" })
    .click();
  await expect(
    page.getByRole("status", { name: "Resultado de demostración" }),
  ).toContainText("Continuación simulada");
  await page.getByRole("button", { name: "General", exact: true }).click();
  await page
    .getByRole("switch", { name: "Advertir sobre datos personales" })
    .uncheck();
  await page.getByRole("button", { name: "Demostración", exact: true }).click();
  await page.getByLabel("Ejemplo para probar").selectOption("critical");
  await page.getByRole("button", { name: "Evaluar mensaje" }).click();
  await expect(
    page.getByRole("dialog").getByRole("heading", { name: "Envío bloqueado" }),
  ).toBeVisible();
});

test("texto largo explica análisis no realizado y permite volver a editar", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Demostración", exact: true }).click();
  await page.getByLabel("Mensaje de prueba").fill("x".repeat(20_001));
  await page.getByRole("button", { name: "Evaluar mensaje" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "El mensaje es demasiado largo",
  );
  await expect(
    page.getByRole("button", { name: "Proteger y revisar" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Reducir el texto" }).click();
  await expect(page.getByLabel("Mensaje de prueba")).toBeFocused();
});

test("diseño móvil sin desbordamiento y popup compacto", async ({ page }) => {
  await page.setViewportSize({ width: 707, height: 582 });
  await page.goto("/?theme=dark");
  await expect(
    page.getByRole("heading", { name: "Configuración general" }),
  ).toBeVisible();
  const nav = page.getByRole("navigation", {
    name: "Secciones de configuración",
  });
  expect(
    await nav.evaluate((element) => element.scrollWidth <= element.clientWidth),
  ).toBe(true);
  const box = await nav.locator('[data-icon="settings"]').boundingBox();
  expect(box?.width).toBe(box?.height);
  await expect(page.locator(".dis-hero-disclaimer")).toHaveCount(0);
  await expect(page.locator("footer")).toHaveText("");
  await page.screenshot({
    path: "docs/diseno/capturas/ajustes-707px.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Detección", exact: true }).click();
  await expect(page.getByText(/quedan fuera de este MVP/)).toHaveCount(0);
  await page.screenshot({
    path: "docs/diseno/capturas/deteccion-color.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  for (const section of [
    "General",
    "Detección",
    "Sitios web",
    "Privacidad",
    "Apariencia",
    "Demostración",
    "Acerca de",
  ]) {
    await page.getByRole("button", { name: section, exact: true }).click();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto("/?view=popup");
  await expect(
    page.getByRole("heading", { name: "Protección no disponible" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "docs/diseno/capturas/popup.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Ver configuración" }).click();
  await expect(
    page.getByRole("heading", { name: "Configuración general" }),
  ).toBeVisible();
});

test("errores de consola y marcado HTML en el editor se tratan como texto", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.getByRole("button", { name: "Demostración", exact: true }).click();
  await page
    .getByLabel("Mensaje de prueba")
    .fill('<img src=x onerror="alert(1)"> correo: a@example.com');
  await page.getByRole("button", { name: "Evaluar mensaje" }).click();
  await page.getByRole("button", { name: "Proteger y revisar" }).click();
  const preview = page.getByLabel("Texto protegido", { exact: true });
  await expect(preview).toContainText('<img src=x onerror="alert(1)">');
  await expect(preview.locator("img")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("modal oscuro con muchos hallazgos mantiene acciones accesibles en móvil", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Apariencia", exact: true }).click();
  await page.getByRole("radio", { name: "Oscuro" }).check();
  await page.getByRole("button", { name: "Demostración", exact: true }).click();
  await page.getByLabel("Mensaje de prueba").fill("a@example.com\n".repeat(20));
  await page.getByRole("button", { name: "Evaluar mensaje" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  expect(
    await dialog.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    ),
  ).toBe("rgb(16, 35, 43)");
  expect(
    await dialog.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  await dialog.getByRole("button", { name: "Proteger y revisar" }).click();
  await expect(
    dialog.getByLabel("Texto protegido", { exact: true }),
  ).toContainText("[CORREO_20]");
  await page.screenshot({
    path: "docs/diseno/capturas/modal-oscuro-movil.png",
    fullPage: true,
  });
  await dialog.getByRole("button", { name: "Volver al editor" }).click();
  await expect(page.getByLabel("Mensaje de prueba")).toBeFocused();
});

test("comparación de datos personales muestra antes y después y se adapta a pantalla estrecha", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 720 });
  await page.getByRole("button", { name: "Demostración", exact: true }).click();
  await page
    .getByLabel("Mensaje de prueba")
    .fill("[CORREO_1] 🙂 alumno@example.com y alumno@example.com");
  await page.getByRole("button", { name: "Evaluar mensaje" }).click();
  const modal = page.getByRole("dialog");
  await modal.getByRole("button", { name: "Proteger y revisar" }).click();
  const report = modal.getByRole("region", { name: "Cambios realizados" });
  await expect(
    modal.getByRole("heading", { name: "Revisa el texto protegido" }),
  ).toBeInViewport();
  await expect(report).toContainText("2 datos protegidos");
  await expect(report).toContainText("1 categoría");
  await expect(report.locator("li")).toHaveCount(2);
  await expect(report.locator("li").first()).toContainText(
    "alumno@example.com",
  );
  await expect(report.locator("li").first()).toContainText("[CORREO_2]");
  await expect(report.locator("li").last()).toContainText("[CORREO_3]");
  expect(
    await modal.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "docs/diseno/capturas/comparacion-movil.png",
    fullPage: true,
  });
  await modal.getByRole("button", { name: "Volver al editor" }).click();
  await expect(report).toHaveCount(0);
});

test("categorías financieras visibles y demostración con comparación completa", async ({
  page,
}) => {
  await page.goto("/?theme=dark");
  await page.getByRole("button", { name: "Detección", exact: true }).click();
  await expect(
    page.getByText("CLABE interbancaria", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Tarjetas bancarias", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("NSS de México", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Demostración", exact: true }).click();
  await page.getByLabel("Ejemplo para probar").selectOption("financial");
  await page.getByRole("button", { name: "Evaluar mensaje" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading")).toHaveText(
    "Información sensible detectada",
  );
  await dialog.getByRole("button", { name: "Proteger y revisar" }).click();
  const report = dialog.getByRole("region", { name: "Cambios realizados" });
  await expect(report).toContainText("3 datos protegidos");
  await expect(report).toContainText("3 categorías");
  await expect(
    dialog.getByLabel("Texto protegido", { exact: true }),
  ).toContainText("CLABE: [CLABE_1]\nTarjeta: [TARJETA_1]\nNSS: [NSS_1]");
  await page.screenshot({
    path: "docs/diseno/capturas/cobertura-financiera.png",
    fullPage: true,
  });
  await dialog.getByRole("button", { name: "Volver al editor" }).click();
  await page.getByRole("button", { name: "Evaluar mensaje" }).click();
  await expect(
    page.getByRole("status", { name: "Resultado de demostración" }),
  ).toContainText("No se detectaron coincidencias");
});

test("demostración de identidad y salud permite revisar las siete categorías de texto", async ({
  page,
}) => {
  await page.goto("/?theme=dark");
  await page.getByRole("button", { name: "Detección", exact: true }).click();
  await expect(
    page.getByText("INE, pasaporte y licencia", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Nombres completos", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Fecha de nacimiento", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Salud y expedientes clínicos", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Demostración", exact: true }).click();
  await page.getByLabel("Ejemplo para probar").selectOption("identity");
  await page.getByRole("button", { name: "Evaluar mensaje" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).not.toContainText("María del Carmen López");
  await expect(dialog).not.toContainText("alergia al polen");
  await dialog.getByRole("button", { name: "Proteger y revisar" }).click();
  const report = dialog.getByRole("region", { name: "Cambios realizados" });
  await expect(report).toContainText("7 datos protegidos");
  await expect(report).toContainText("7 categorías");
  await expect(report.locator("li")).toHaveCount(7);
  await expect(report).toContainText("[SALUD_1]");
  await page.screenshot({
    path: "docs/diseno/capturas/cobertura-identidad-salud.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await dialog.evaluate(
      (element) => element.scrollWidth <= element.clientWidth,
    ),
  ).toBe(true);
  await dialog.getByRole("button", { name: "Volver al editor" }).click();
  await page.getByRole("button", { name: "Evaluar mensaje" }).click();
  await expect(
    page.getByRole("status", { name: "Resultado de demostración" }),
  ).toContainText("No se detectaron coincidencias");
});

test("país nacional y demostración internacional sin plantilla", async ({
  page,
}) => {
  const region = page.getByLabel("País de los teléfonos sin prefijo");
  await expect(region).toHaveValue("MX");
  await region.selectOption("GB");
  await expect(region).toHaveValue("GB");
  await page.getByRole("button", { name: "Demostración", exact: true }).click();
  await page.getByLabel("Mensaje de prueba").fill("020 7946 0018");
  await page.getByRole("button", { name: "Evaluar mensaje" }).click();
  await expect(page.getByRole("dialog")).toContainText("Número de teléfono");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancelar", exact: true })
    .click();
  await page.getByRole("button", { name: "General", exact: true }).click();
  await region.selectOption("MX");
  await page.getByRole("button", { name: "Demostración", exact: true }).click();
  await page.getByLabel("Ejemplo para probar").selectOption("natural");
  await page.getByRole("button", { name: "Evaluar mensaje" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Proteger y revisar" }).click();
  await expect(
    dialog.getByRole("region", { name: "Cambios realizados" }),
  ).toContainText("6 datos protegidos");
  await expect(
    dialog.getByLabel("Texto protegido", { exact: true }),
  ).toContainText("[NOMBRE_1], [TELEFONO_1]");
  await expect(
    dialog.getByLabel("Texto protegido", { exact: true }),
  ).toContainText("[TELEFONO_2] o al [TELEFONO_3]");
  await page.screenshot({
    path: "docs/diseno/capturas/texto-libre-internacional.png",
    fullPage: true,
  });
});
