import { chromium, expect, test } from "@playwright/test";
import { createHash } from "node:crypto";
import { mkdtemp, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

test("extensión compilada: opciones, persistencia real y demo sin guardar contenido", async () => {
  const extensionPath = await realpath(".output/chrome-mv3");
  const profile = await mkdtemp(join(tmpdir(), "dis-ui-"));
  const id = createHash("sha256")
    .update(extensionPath)
    .digest("hex")
    .slice(0, 32)
    .replace(/[0-9a-f]/gu, (hex) =>
      String.fromCharCode(97 + parseInt(hex, 16)),
    );
  const context = await chromium.launchPersistentContext(profile, {
    channel: "chromium",
    headless: true,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
    ],
    viewport: { width: 1280, height: 900 },
    colorScheme: "light",
  });
  try {
    const popup = await context.newPage();
    const errors: string[] = [];
    popup.on("pageerror", (error) => errors.push(error.message));
    await popup.goto(`chrome-extension://${id}/popup.html`);
    await expect(
      popup.getByRole("heading", { name: "Sitio no compatible" }),
    ).toBeVisible();
    await popup.setViewportSize({ width: 390, height: 700 });
    await popup.screenshot({
      path: "docs/diseno/capturas/popup-extension.png",
      fullPage: true,
    });
    const opened = context.waitForEvent("page");
    await popup.getByRole("button", { name: "Ver configuración" }).click();
    const options = await opened;
    options.on("pageerror", (error) => errors.push(error.message));
    await expect(
      options.getByRole("heading", { name: "Configuración general" }),
    ).toBeVisible();
    await options.screenshot({
      path: "docs/diseno/capturas/configuracion-extension.png",
      fullPage: true,
    });
    await options
      .getByRole("button", { name: "Apariencia", exact: true })
      .click();
    await options.getByRole("radio", { name: "Oscuro" }).check();
    await expect(
      options.getByRole("status", { name: "Estado de ajustes" }),
    ).toContainText("Ajustes guardados");
    await options.reload();
    await expect(options.locator("html")).toHaveAttribute("data-theme", "dark");
    await options.getByRole("button", { name: "General", exact: true }).click();
    await options
      .getByRole("switch", { name: "Advertir sobre datos personales" })
      .uncheck();
    await expect(
      options.getByRole("status", { name: "Estado de ajustes" }),
    ).toContainText("Ajustes guardados");
    await options.reload();
    await expect(
      options.getByRole("switch", { name: "Advertir sobre datos personales" }),
    ).not.toBeChecked();
    await options
      .getByRole("button", { name: "Demostración", exact: true })
      .click();
    await options.getByLabel("Ejemplo para probar").selectOption("critical");
    await options.getByRole("button", { name: "Evaluar mensaje" }).click();
    await expect(
      options
        .getByRole("dialog")
        .getByRole("heading", { name: "Envío bloqueado" }),
    ).toBeVisible();
    await options.getByRole("button", { name: "Proteger y revisar" }).click();
    await expect(
      options.getByLabel("Texto protegido", { exact: true }),
    ).toContainText("[CREDENCIAL_1]");
    await options.getByRole("button", { name: "Volver al editor" }).click();
    const stored = await options.evaluate(async () => {
      const chromeApi = (
        globalThis as unknown as {
          chrome: {
            storage: {
              local: { get(key: null): Promise<Record<string, unknown>> };
            };
          };
        }
      ).chrome;
      return chromeApi.storage.local.get(null);
    });
    expect(Object.keys(stored)).toEqual(["dis.settings.v1"]);
    expect(JSON.stringify(stored)).not.toMatch(
      /synthetic-example|alumno@example|CREDENCIAL/,
    );
    expect(errors).toEqual([]);
  } finally {
    await context.close();
    await rm(profile, { recursive: true, force: true });
  }
});
