import {
  chromium,
  expect,
  test,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const fixture = await readFile("tests/fixtures/platforms/chatgpt.html", "utf8");
let context: BrowserContext;
let page: Page;
let profile: string;
let extensionId: string;
let requests: string[];
let errors: string[];
test.beforeEach(async () => {
  const path = await realpath(".output/chrome-mv3");
  extensionId = createHash("sha256")
    .update(path)
    .digest("hex")
    .slice(0, 32)
    .replace(/[0-9a-f]/gu, (hex) =>
      String.fromCharCode(97 + parseInt(hex, 16)),
    );
  profile = await mkdtemp(join(tmpdir(), "dis-integration-"));
  context = await chromium.launchPersistentContext(profile, {
    channel: "chromium",
    headless: true,
    args: [`--disable-extensions-except=${path}`, `--load-extension=${path}`],
    viewport: { width: 1280, height: 900 },
  });
  requests = [];
  errors = [];
  await context.route("https://**/*", async (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== "https://chatgpt.com") {
      await route.abort();
      return;
    }
    if (url.pathname === "/fixture-submit") {
      requests.push(route.request().postData() ?? "");
      await route.fulfill({
        contentType: "application/json",
        body: '{"ok":true}',
      });
    } else await route.fulfill({ contentType: "text/html", body: fixture });
  });
  page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("https://chatgpt.com/?dis-fixture=1");
  await expect(page.getByRole("status")).toContainText("Revisión activa");
});
test.afterEach(async () => {
  await context?.close();
  if (profile) await rm(profile, { recursive: true, force: true });
});

async function storage() {
  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  const data = await options.evaluate(async () => {
    return (
      globalThis as unknown as {
        chrome: {
          storage: {
            local: { get(key: null): Promise<Record<string, unknown>> };
          };
        };
      }
    ).chrome.storage.local.get(null);
  });
  await options.close();
  return data;
}
async function fill(text: string) {
  await page.getByRole("textbox", { name: "Mensaje de prueba" }).fill(text);
}

for (const method of ["click", "enter", "submit"] as const) {
  test(`fixture: credencial crítica no genera petición mediante ${method}`, async () => {
    await fill("API_KEY=synthetic-test-value-123");
    if (method === "click")
      await page
        .getByRole("button", { name: "Enviar mensaje", exact: true })
        .click();
    else if (method === "enter") await page.getByRole("textbox").press("Enter");
    else
      await page
        .locator("form")
        .evaluate((form) => (form as HTMLFormElement).requestSubmit());
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: "Envío bloqueado" }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: /continuar/i }),
    ).toHaveCount(0);
    expect(requests).toEqual([]);
    if (method === "click")
      await page.screenshot({
        path: "docs/diseno/capturas/fase4-fixture-bloqueo.png",
        fullPage: true,
      });
    await dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
    await expect(page.locator("#count")).toHaveText("0 envíos");
    expect(requests).toEqual([]);
  });
}
test("fixture: mensaje benigno por clic/Enter y doble clic sin duplicación", async () => {
  await fill("Explica DHCP.");
  await page
    .getByRole("button", { name: "Enviar mensaje", exact: true })
    .dblclick();
  await expect.poll(() => requests.length).toBe(1);
  await fill("Explica DNS.");
  await page.getByRole("textbox").press("Enter");
  await expect.poll(() => requests.length).toBe(2);
  expect(requests).toEqual(["Explica DHCP.", "Explica DNS."]);
  expect(errors).toEqual([]);
});
test("fixture: advertencia cancelada no envía; continuación autoriza una sola cadena", async () => {
  await fill("Correo: alumno@example.com");
  await page
    .getByRole("button", { name: "Enviar mensaje", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancelar", exact: true })
    .click();
  expect(requests).toEqual([]);
  await page.getByRole("textbox").press("Enter");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Continuar sin proteger", exact: true })
    .click();
  await expect.poll(() => requests.length).toBe(1);
  await fill("Correo: otra@example.com");
  await page
    .getByRole("button", { name: "Enviar mensaje", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(requests).toHaveLength(1);
});
test("fixture: sustitución actualiza el editor y obliga a revisar antes de enviar", async () => {
  await fill("API_KEY=synthetic-test-value-123\nCorreo: alumno@example.com");
  await page
    .getByRole("button", { name: "Enviar mensaje", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Proteger y revisar" }).click();
  await expect(
    dialog.getByLabel("Texto protegido", { exact: true }),
  ).toContainText("[CREDENCIAL_1]");
  const changes = dialog.getByRole("region", { name: "Cambios realizados" });
  await expect(changes).toContainText("2 datos protegidos");
  await expect(changes).toContainText("2 categorías");
  await expect(changes).toContainText("alumno@example.com");
  await expect(changes).toContainText("[CORREO_1]");
  await expect(changes).toContainText("Credencial oculta");
  await expect(dialog).not.toContainText("synthetic-test-value-123");
  expect(requests).toEqual([]);
  await page.screenshot({
    path: "docs/diseno/capturas/comparacion-cambios.png",
    fullPage: true,
  });
  await dialog.getByRole("button", { name: "Volver al editor" }).click();
  await expect(
    page.getByRole("region", { name: "Cambios realizados" }),
  ).toHaveCount(0);
  await expect(page.getByRole("textbox")).toHaveValue(
    "API_KEY=[CREDENCIAL_1]\nCorreo: [CORREO_1]",
  );
  await page
    .getByRole("button", { name: "Enviar mensaje", exact: true })
    .click();
  await expect.poll(() => requests.length).toBe(1);
  expect(requests[0]).not.toContain("synthetic-test-value");
  await expect
    .poll(async () => Object.keys(await storage()).includes("dis.events.v1"))
    .toBe(true);
  const saved = JSON.stringify(await storage());
  expect(saved).not.toMatch(
    /synthetic-test-value|alumno@example|CREDENCIAL_1|CORREO_1/,
  );
  expect(errors).toEqual([]);
});
test("fixture: cambiar el texto sin input invalida la confirmación anterior", async () => {
  await fill("Correo: alumno@example.com");
  await page.getByRole("textbox").press("Enter");
  await page.getByRole("textbox").evaluate((editor) => {
    (editor as HTMLTextAreaElement).value = "password=synthetic-secret";
  });
  await page
    .getByRole("button", { name: "Continuar sin proteger", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("textbox").press("Enter");
  await expect(
    page.getByRole("dialog").getByRole("heading", { name: "Envío bloqueado" }),
  ).toBeVisible();
  expect(requests).toEqual([]);
});
test("fixture: Shift+Enter e IME no se confunden con enviar", async () => {
  await fill("password=synthetic-secret");
  await page.getByRole("textbox").press("Shift+Enter");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("textbox").dispatchEvent("compositionstart");
  await page.getByRole("textbox").press("Enter");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(requests).toEqual([]);
  await page.getByRole("textbox").dispatchEvent("compositionend");
  await page.getByRole("textbox").press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
});
test("fixture: navegación interna reconecta; editor incompatible muestra indisponibilidad", async () => {
  await fill("Correo: alumno@example.com");
  await page.getByRole("textbox").press("Enter");
  // Programmatic navigation models reconstruction without interacting behind a modal.
  await page
    .locator("#replace")
    .evaluate((button) => (button as HTMLButtonElement).click());
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("status")).toContainText("Revisión activa");
  await fill("password=synthetic-secret");
  await page.getByRole("textbox").press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await page
    .getByRole("button", { name: "Cambiar a editor incompatible" })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Protección no disponible",
  );
  expect(requests).toEqual([]);
});
test("fixture: popup consulta disponibilidad real de la pestaña activa", async () => {
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/popup.html`);
  await page.bringToFront();
  await popup.reload();
  await expect(
    popup.getByRole("heading", { name: "Protección activa" }),
  ).toBeVisible();
});

test("fixture: cambiar ajustes invalida una advertencia abierta; críticos siguen bloqueados", async () => {
  await fill("Correo: alumno@example.com");
  await page.getByRole("textbox").press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await options
    .getByRole("switch", { name: "Advertir sobre datos personales" })
    .uncheck();
  await expect(
    options.getByRole("status", { name: "Estado de ajustes" }),
  ).toContainText("Ajustes guardados");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await fill("password=synthetic-settings-test");
  await page.getByRole("textbox").press("Enter");
  await expect(
    page.getByRole("dialog").getByRole("heading", { name: "Envío bloqueado" }),
  ).toBeVisible();
  expect(requests).toEqual([]);
});

test("fixture: política ilegible no permite enviar un mensaje sin evaluar", async () => {
  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  await options.evaluate(async () => {
    const api = (
      globalThis as unknown as {
        chrome: {
          storage: {
            local: { set(value: Record<string, unknown>): Promise<void> };
          };
        };
      }
    ).chrome;
    await api.storage.local.set({ "dis.settings.v1": { schemaVersion: -1 } });
  });
  await expect(page.getByRole("status")).toContainText(
    "Protección no disponible",
  );
  await fill("password=synthetic-unreadable-policy");
  await page
    .getByRole("button", { name: "Enviar mensaje", exact: true })
    .click();
  await expect(page.locator("#count")).toHaveText("0 envíos");
  expect(requests).toEqual([]);
});

test("fixture: un botón transformado en detener no se trata como envío", async () => {
  await fill("password=synthetic-stop-test");
  await page
    .getByRole("button", { name: "Enviar mensaje", exact: true })
    .evaluate((button) => {
      const stopIcon = document.createElement("span");
      stopIcon.dataset.composerStopIcon = "";
      button.append(stopIcon);
      button.addEventListener("click", (event) => {
        event.preventDefault();
        button.setAttribute("data-stop-accepted", "true");
      });
    });
  await expect(page.getByRole("status")).toContainText(
    "Protección no disponible",
  );
  await page
    .getByRole("button", { name: "Enviar mensaje", exact: true })
    .click();
  await expect(page.locator('[data-stop-accepted="true"]')).toHaveCount(1);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(requests).toEqual([]);
});

test("servicio: rechaza contenido adicional y eventos emitidos desde una página de opciones", async () => {
  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  const responses = await options.evaluate(async () => {
    const api = (
      globalThis as unknown as {
        chrome: { runtime: { sendMessage(value: unknown): Promise<unknown> } };
      }
    ).chrome;
    return Promise.all([
      api.runtime.sendMessage({
        type: "DIS_RECORD_EVENTS",
        events: [{ category: "email", action: "WARN", ruleVersion: "1.0.0" }],
      }),
      api.runtime.sendMessage({
        type: "DIS_GET_SETTINGS",
        prompt: "synthetic-message-must-not-cross",
      }),
    ]);
  });
  expect(responses).toEqual([{ ok: false }, { ok: false }]);
  const saved = JSON.stringify(await storage());
  expect(saved).not.toContain("synthetic-message-must-not-cross");
  expect(saved).not.toContain("dis.events.v1");
});

test("fixture: CLABE, tarjeta y NSS se revisan, sustituyen y registran solo como metadatos", async () => {
  await fill(
    "CLABE: 103150124152345786\nTarjeta: 4242 4242 4242 4242\nNSS: 12345678903",
  );
  await page
    .getByRole("button", { name: "Enviar mensaje", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading")).toHaveText(
    "Información sensible detectada",
  );
  await expect(dialog).not.toContainText("103150124152345786");
  await expect(dialog).toContainText("Posible NSS");
  expect(requests).toEqual([]);
  await dialog.getByRole("button", { name: "Proteger y revisar" }).click();
  const report = dialog.getByRole("region", { name: "Cambios realizados" });
  await expect(report).toContainText("3 datos protegidos");
  await expect(report).toContainText("3 categorías");
  await expect(report).toContainText("[CLABE_1]");
  await expect(report).toContainText("[TARJETA_1]");
  await expect(report).toContainText("[NSS_1]");
  await expect(report).toContainText("103150124152345786");
  expect(requests).toEqual([]);
  await dialog.getByRole("button", { name: "Volver al editor" }).click();
  await expect(page.getByRole("textbox")).toHaveValue(
    "CLABE: [CLABE_1]\nTarjeta: [TARJETA_1]\nNSS: [NSS_1]",
  );
  await page
    .getByRole("button", { name: "Enviar mensaje", exact: true })
    .click();
  await expect.poll(() => requests.length).toBe(1);
  expect(requests[0]).not.toMatch(/103150124152345786|4242|12345678903/);
  await expect
    .poll(async () => JSON.stringify(await storage()))
    .toContain('"SANITIZE"');
  const saved = JSON.stringify(await storage());
  for (const category of ["clabe", "card", "nss"])
    expect(saved).toContain(`"${category}"`);
  expect(saved).not.toMatch(
    /103150124152345786|4242|12345678903|CLABE_1|TARJETA_1|NSS_1/,
  );
  expect(errors).toEqual([]);
});

test("fixture: identidad, domicilio, nacimiento y salud se sustituyen sin guardar valores", async () => {
  const original =
    "Nombre completo: María del Carmen López\nFecha de nacimiento: 14/02/1990\nDomicilio: Calle Ejemplo 123, Colonia Centro\nCIC del INE: 123456789\nPasaporte: G12345678\nLicencia de conducir: CDMX-1234567\nDiagnóstico del paciente: alergia al polen";
  await fill(original);
  await page
    .getByRole("button", { name: "Enviar mensaje", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading")).toHaveText(
    "Información sensible detectada",
  );
  await expect(dialog).not.toContainText("María del Carmen López");
  await expect(dialog).not.toContainText("alergia al polen");
  expect(requests).toEqual([]);
  await dialog.getByRole("button", { name: "Proteger y revisar" }).click();
  const report = dialog.getByRole("region", { name: "Cambios realizados" });
  await expect(report).toContainText("7 datos protegidos");
  await expect(report).toContainText("7 categorías");
  for (const label of [
    "NOMBRE",
    "NACIMIENTO",
    "DOMICILIO",
    "INE",
    "PASAPORTE",
    "LICENCIA",
    "SALUD",
  ]) {
    await expect(
      dialog.getByLabel("Texto protegido", { exact: true }),
    ).toContainText(`[${label}_1]`);
  }
  await expect(report).toContainText("María del Carmen López");
  await expect(report).toContainText("alergia al polen");
  await dialog.getByRole("button", { name: "Volver al editor" }).click();
  await expect(page.getByRole("textbox")).not.toHaveValue(original);
  await page
    .getByRole("button", { name: "Enviar mensaje", exact: true })
    .click();
  await expect.poll(() => requests.length).toBe(1);
  expect(requests[0]).not.toMatch(
    /María|1990|Calle Ejemplo|123456789|G12345678|CDMX|alergia/,
  );
  await expect
    .poll(async () => JSON.stringify(await storage()))
    .toContain('"SANITIZE"');
  const saved = JSON.stringify(await storage());
  for (const category of [
    "name",
    "birth-date",
    "address",
    "ine",
    "passport",
    "license",
    "health",
  ])
    expect(saved).toContain(`"${category}"`);
  expect(saved).not.toMatch(
    /María|1990|Calle Ejemplo|123456789|G12345678|CDMX|alergia|NOMBRE_1|SALUD_1/,
  );
  expect(errors).toEqual([]);
});

test("fixture: nombre en minúsculas y teléfonos sin plantilla se protegen completos", async () => {
  await fill("daniel cornejo, 7731112030; +1 213 373 4253 ext. 42");
  await page
    .getByRole("button", { name: "Enviar mensaje", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading")).toHaveText(
    "Información sensible detectada",
  );
  await dialog.getByRole("button", { name: "Proteger y revisar" }).click();
  await expect(
    dialog.getByRole("region", { name: "Cambios realizados" }),
  ).toContainText("3 datos protegidos");
  await expect(
    dialog.getByLabel("Texto protegido", { exact: true }),
  ).toHaveText("[NOMBRE_1], [TELEFONO_1]; [TELEFONO_2]");
  expect(requests).toEqual([]);
  await dialog.getByRole("button", { name: "Volver al editor" }).click();
  await page
    .getByRole("button", { name: "Enviar mensaje", exact: true })
    .click();
  await expect.poll(() => requests.length).toBe(1);
  expect(requests[0]).toBe("[NOMBRE_1], [TELEFONO_1]; [TELEFONO_2]");
  expect(JSON.stringify(await storage())).not.toMatch(
    /daniel|cornejo|7731112030|213 373|TELEFONO_1/,
  );
});

test("fixture: país de teléfonos persiste y su cambio invalida revisiones anteriores", async () => {
  const options = await context.newPage();
  await options.goto(`chrome-extension://${extensionId}/options.html`);
  const region = options.getByLabel("País de los teléfonos sin prefijo");
  await expect(region).toHaveValue("MX");
  await region.selectOption("GB");
  await expect(
    options.getByRole("status", { name: "Estado de ajustes" }),
  ).toContainText("Ajustes guardados");
  await options.reload();
  await expect(region).toHaveValue("GB");
  await fill("020 7946 0018");
  await page
    .getByRole("button", { name: "Enviar mensaje", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Información sensible detectada",
  );
  await region.selectOption("ES");
  await expect(
    options.getByRole("status", { name: "Estado de ajustes" }),
  ).toContainText("Ajustes guardados");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await fill("612 345 678");
  await page
    .getByRole("button", { name: "Enviar mensaje", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Información sensible detectada",
  );
  expect(requests).toEqual([]);
  await expect(page.getByRole("dialog")).toContainText("región ES");
  expect(errors).toEqual([]);
});

test("fixture: Unicode y credencial multilínea se sustituyen antes del envío", async () => {
  await fill('ｐａｓｓｗｏｒｄ="first\nsecond"; alumno@exam\u200bple.com');
  await page
    .getByRole("button", { name: "Enviar mensaje", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Envío bloqueado");
  await dialog.getByRole("button", { name: "Proteger y revisar" }).click();
  await expect(dialog).toContainText("2 datos protegidos");
  await expect(dialog).not.toContainText("first");
  await dialog.getByRole("button", { name: "Volver al editor" }).click();
  await page
    .getByRole("button", { name: "Enviar mensaje", exact: true })
    .click();
  await expect.poll(() => requests.length).toBe(1);
  expect(requests[0]).toBe('ｐａｓｓｗｏｒｄ="[CREDENCIAL_1]"; [CORREO_1]');
  expect(JSON.stringify(await storage())).not.toMatch(
    /first|second|alumno|exam/,
  );
});
test("fixture: límite de longitud bloquea sin continuar", async () => {
  await fill("x".repeat(20001));
  await page.getByRole("textbox").press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("El mensaje es demasiado largo");
  await expect(dialog.getByRole("button", { name: /continuar/i })).toHaveCount(
    0,
  );
  expect(requests).toEqual([]);
});
