import {
  chromium,
  expect,
  test,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import { createHash } from "node:crypto";
import { readFile, realpath, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const fixture = await readFile(
  "tests/fixtures/platforms/rich-editors.html",
  "utf8",
);
for (const platform of ["claude", "gemini"] as const) {
  test.describe(`${platform}: fixture independiente`, () => {
    let context: BrowserContext, page: Page, profile: string, id: string;
    let requests: string[], errors: string[];
    const origin =
      platform === "claude" ? "https://claude.ai" : "https://gemini.google.com";
    const route = platform === "claude" ? "/new" : "/app";
    test.beforeEach(async () => {
      const path = await realpath(".output/chrome-mv3");
      id = createHash("sha256")
        .update(path)
        .digest("hex")
        .slice(0, 32)
        .replace(/[0-9a-f]/gu, (h) =>
          String.fromCharCode(97 + parseInt(h, 16)),
        );
      profile = await mkdtemp(join(tmpdir(), `dis-${platform}-`));
      context = await chromium.launchPersistentContext(profile, {
        channel: "chromium",
        headless: true,
        args: [
          `--disable-extensions-except=${path}`,
          `--load-extension=${path}`,
        ],
        viewport: { width: 1280, height: 900 },
      });
      requests = [];
      errors = [];
      await context.route("https://**/*", async (route) => {
        const url = new URL(route.request().url());
        if (url.origin !== origin) {
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
      await page.goto(origin + route);
      await expect(page.getByRole("status")).toContainText("Revisión activa");
    });
    test.afterEach(async () => {
      await context?.close();
      if (profile) await rm(profile, { recursive: true, force: true });
    });
    const textbox = () =>
      page.getByRole("textbox", { name: "Mensaje de prueba" });
    const send = () => page.locator("#mount button");
    async function storage() {
      const options = await context.newPage();
      await options.goto(`chrome-extension://${id}/options.html`);
      const result = await options.evaluate(async () =>
        (
          globalThis as unknown as {
            chrome: {
              storage: {
                local: { get(key: null): Promise<Record<string, unknown>> };
              };
            };
          }
        ).chrome.storage.local.get(null),
      );
      await options.close();
      return result;
    }
    for (const method of ["click", "enter", "nested"] as const) {
      test(`bloquea credencial por ${method} sin petición`, async () => {
        await textbox().fill("API_KEY=synthetic-rich-secret-123");
        if (method === "enter") await textbox().press("Enter");
        else if (method === "nested") await send().locator("span").click();
        else await send().click();
        await expect(page.getByRole("dialog")).toContainText("Envío bloqueado");
        await expect(page.getByRole("dialog")).not.toContainText(
          "synthetic-rich-secret-123",
        );
        await expect(
          page.getByRole("button", {
            name: "Continuar sin proteger",
            exact: true,
          }),
        ).toHaveCount(0);
        expect(requests).toEqual([]);
      });
    }
    test("mensaje benigno por clic y Enter mantiene el modelo y no duplica", async () => {
      await textbox().fill("Hola equipo");
      await send().click();
      await expect.poll(() => requests.length).toBe(1);
      await textbox().fill("Otra consulta segura");
      await textbox().press("Enter");
      await expect.poll(() => requests.length).toBe(2);
      expect(requests).toEqual(["Hola equipo", "Otra consulta segura"]);
      expect(errors).toEqual([]);
    });
    test("continuación explícita sirve una sola vez y cancelar no envía", async () => {
      await textbox().fill("Correo: alumno@example.com");
      await send().click();
      await page.getByRole("button", { name: "Cancelar", exact: true }).click();
      expect(requests).toEqual([]);
      await send().click();
      await page
        .getByRole("button", { name: "Continuar sin proteger", exact: true })
        .click();
      await expect.poll(() => requests.length).toBe(1);
      await send().click();
      expect(requests).toHaveLength(1);
      await textbox().fill("Correo: otra@example.com");
      await send().click();
      await expect(page.getByRole("dialog")).toBeVisible();
      expect(requests).toHaveLength(1);
    });
    test("sustituye con entrada nativa, conserva saltos y envía solo el modelo protegido", async () => {
      await textbox().fill(
        "API_KEY=synthetic-rich-secret-123\nCorreo: alumno@example.com\nNombre completo: María López",
      );
      const original = await textbox().evaluate(
        (editor) => (editor as HTMLElement).innerText,
      );
      const expected = original
        .replace("synthetic-rich-secret-123", "[CREDENCIAL_1]")
        .replace("alumno@example.com", "[CORREO_1]")
        .replace("María López", "[NOMBRE_1]");
      await send().click();
      const dialog = page.getByRole("dialog");
      await dialog.getByRole("button", { name: "Proteger y revisar" }).click();
      await expect(
        dialog.getByRole("region", { name: "Cambios realizados" }),
      ).toContainText("3 datos protegidos");
      await expect(dialog).not.toContainText("synthetic-rich-secret-123");
      await expect(
        dialog.getByLabel("Texto protegido", { exact: true }),
      ).toContainText(expected);
      expect(requests).toEqual([]);
      await page.screenshot({
        path: `docs/diseno/capturas/fase5-${platform}-fixture.png`,
        fullPage: true,
      });
      await dialog.getByRole("button", { name: "Volver al editor" }).click();
      await send().click();
      await expect.poll(() => requests.length).toBe(1);
      expect(requests[0]).toBe(expected);
      await expect
        .poll(async () => JSON.stringify(await storage()))
        .toContain('"SANITIZE"');
      const saved = JSON.stringify(await storage());
      expect(saved).toContain(`"${platform}"`);
      expect(saved).not.toMatch(
        /synthetic-rich|alumno@|María|CORREO_1|NOMBRE_1/,
      );
      expect(errors).toEqual([]);
    });
    test("cambiar texto sin input o navegar invalida la revisión", async () => {
      await textbox().fill("alumno@example.com");
      await send().click();
      await textbox().evaluate(
        (editor) => (editor.textContent = "password=synthetic-stale-secret"),
      );
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await send().click();
      await expect(page.getByRole("dialog")).toContainText("Envío bloqueado");
      await page.getByRole("button", { name: "Cancelar", exact: true }).click();
      await page.getByRole("button", { name: "Cambiar conversación" }).click();
      await textbox().fill("password=synthetic-route-secret");
      await textbox().press("Enter");
      await expect(page.getByRole("dialog")).toContainText("Envío bloqueado");
      expect(requests).toEqual([]);
    });
    test("editor ambiguo, elementos ajenos y botón de detener muestran indisponibilidad", async () => {
      await textbox().fill("Consulta segura");
      await page.evaluate(() => {
        const editor = document.querySelector('[role="textbox"]')!;
        editor.append(
          Object.assign(document.createElement("span"), {
            contentEditable: "false",
            textContent: "Archivo",
          }),
        );
      });
      await expect(page.getByRole("status")).toContainText(
        "Protección no disponible",
      );
      await page.getByRole("button", { name: "Cambiar conversación" }).click();
      await expect(page.getByRole("status")).toContainText("Revisión activa");
      await textbox().fill("password=synthetic-stop-secret");
      await page.getByRole("button", { name: "Simular generación" }).click();
      await expect(page.getByRole("status")).toContainText(
        "Protección no disponible",
      );
      await send().click();
      await expect(page.locator("body")).toHaveAttribute(
        "data-stop-clicked",
        "true",
      );
      expect(requests).toEqual([]);
      await page.getByRole("button", { name: "Cambiar conversación" }).click();
      await page.getByRole("button", { name: "Editor incompatible" }).click();
      await expect(page.getByRole("status")).toContainText(
        "Protección no disponible",
      );
    });
    test("Shift+Enter, IME y tecla desde un nodo del editor mantienen la revisión", async () => {
      await textbox().fill("password=synthetic-composition-secret");
      await textbox().press("Shift+Enter");
      await expect(page.getByRole("dialog")).toHaveCount(0);
      expect(requests).toEqual([]);
      await textbox().evaluate((editor) => {
        editor.dispatchEvent(
          new CompositionEvent("compositionstart", { bubbles: true }),
        );
        editor.dispatchEvent(
          new KeyboardEvent("keydown", {
            bubbles: true,
            key: "Enter",
            isComposing: true,
          }),
        );
        editor.dispatchEvent(
          new CompositionEvent("compositionend", { bubbles: true }),
        );
      });
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await textbox().evaluate((editor) => {
        const child = document.createElement("span");
        child.textContent = "password=synthetic-composition-secret";
        editor.replaceChildren(child);
        child.dispatchEvent(new InputEvent("input", { bubbles: true }));
        child.dispatchEvent(
          new KeyboardEvent("keydown", {
            bubbles: true,
            cancelable: true,
            key: "Enter",
          }),
        );
      });
      await expect(page.getByRole("dialog")).toContainText("Envío bloqueado");
      expect(requests).toEqual([]);
    });
    test("sustitución cancelada por el editor no habilita el envío", async () => {
      await textbox().fill("password=synthetic-cancelled-edit");
      await textbox().evaluate((editor) =>
        editor.addEventListener("beforeinput", (event) =>
          event.preventDefault(),
        ),
      );
      await send().click();
      await page.getByRole("button", { name: "Proteger y revisar" }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(textbox()).toContainText(
        "password=synthetic-cancelled-edit",
      );
      await send().click();
      await expect(page.getByRole("dialog")).toContainText("Envío bloqueado");
      expect(requests).toEqual([]);
    });
    test("dos editores visibles suspenden la revisión y retirarlos la recupera", async () => {
      await textbox().fill("password=synthetic-ambiguous");
      await textbox().evaluate((editor) => {
        const clone = editor.cloneNode(true) as HTMLElement;
        clone.id = "ambiguous-editor";
        editor.parentElement!.append(clone);
      });
      await expect(page.getByRole("status")).toContainText(
        "Protección no disponible",
      );
      await page
        .locator("#ambiguous-editor")
        .evaluate((editor) => editor.remove());
      await expect(page.getByRole("status")).toContainText("Revisión activa");
      await send().click();
      await expect(page.getByRole("dialog")).toContainText("Envío bloqueado");
      expect(requests).toEqual([]);
    });
    test("Unicode y credencial multilínea se protegen en el modelo enviado", async () => {
      await textbox().fill(
        'ｐａｓｓｗｏｒｄ="first\nsecond"; alumno@exam\u200bple.com',
      );
      await send().click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toContainText("Envío bloqueado");
      await dialog.getByRole("button", { name: "Proteger y revisar" }).click();
      await expect(dialog).toContainText("2 datos protegidos");
      await expect(dialog).not.toContainText("first");
      await dialog.getByRole("button", { name: "Volver al editor" }).click();
      await send().click();
      await expect.poll(() => requests.length).toBe(1);
      expect(requests[0]).toBe('ｐａｓｓｗｏｒｄ="[CREDENCIAL_1]"; [CORREO_1]');
      expect(JSON.stringify(await storage())).not.toMatch(
        /first|second|alumno|exam/,
      );
    });
    test("mensajes de más de 20000 unidades UTF-16 se bloquean sin continuar", async () => {
      await textbox().fill("x".repeat(20001));
      await send().click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toContainText("El mensaje es demasiado largo");
      await expect(
        dialog.getByRole("button", { name: /continuar/i }),
      ).toHaveCount(0);
      expect(requests).toEqual([]);
    });
    test("popup obtiene estado de la plataforma correcta", async () => {
      const popup = await context.newPage();
      await popup.goto(`chrome-extension://${id}/popup.html`);
      await page.bringToFront();
      await popup.reload();
      await expect(
        popup.getByRole("heading", { name: "Protección activa" }),
      ).toBeVisible();
      await popup.close();
    });
  });
}
