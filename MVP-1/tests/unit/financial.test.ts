import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  inspectPrompt,
  protectPrompt,
} from "../../src/application";
import { eventInputSchema } from "../../src/infrastructure/messaging/contracts";
import { localEventSchema } from "../../src/infrastructure/storage/repository";

// CLABE: published FedGlobal worked example. Cards: Stripe test numbers. NSS: synthetic.
const cases = [
  ["103150124152345786", "clabe", "CLABE"],
  ["CLABE interbancaria: 103-150-12415234578-6", "clabe", "CLABE"],
  ["CLABE: 103 150 12415234578 6", "clabe", "CLABE"],
  ["4242424242424242", "card", "TARJETA"],
  ["Tarjeta: 4242 4242 4242 4242", "card", "TARJETA"],
  ["Tarjeta: 4242\u00a04242\u00a04242\u00a04242", "card", "TARJETA"],
  ["Tarjeta: 4242\u202f4242\u202f4242\u202f4242", "card", "TARJETA"],
  ["5555555555554444", "card", "TARJETA"],
  ["378282246310005", "card", "TARJETA"],
  ["6011111111111117", "card", "TARJETA"],
  ["2223003122003222", "card", "TARJETA"],
  ["Tarjeta: 30569309025904", "card", "TARJETA"],
  ["NSS: 12345678903", "nss", "NSS"],
  ["Mi número de seguridad social es 12-34-56-7890-3", "nss", "NSS"],
  ["NÚMERO DE SEGURO SOCIAL = 12345678903", "nss", "NSS"],
] as const;
describe("cobertura financiera y NSS", () => {
  it.each(cases)("detecta y sustituye %s", (text, category, label) => {
    const inspection = inspectPrompt(text);
    expect(inspection.decision).toBe("WARN");
    expect(inspection.findings.map((finding) => finding.category)).toEqual([
      category,
    ]);
    expect(inspection.findings[0]?.ruleVersion).toBe("1.3.1");
    const finding = inspection.findings[0]!;
    const result = protectPrompt(text);
    expect(result.text).toBe(
      text.slice(0, finding.start) + `[${label}_1]` + text.slice(finding.end),
    );
    expect(result.inspection.decision).toBe("ALLOW");
    expect(result.changes[0]?.before).toBe(
      text.slice(finding.start, finding.end),
    );
    expect(protectPrompt(result.text).replacementCount).toBe(0);
  });
  it.each([
    "CLABE: 103150124152345787",
    "Tarjeta: 4242424242424241",
    "Tarjeta: 0000000000000000",
    "CLABE: 000000000000000000",
    "NSS: 11111111111",
    "12345678903",
    "Folio: 12345678903",
    "NSS: 1234567890",
    "NSS: 123456789012",
    "NSS: 103150124152345786",
    "CLABE: 4242424242424242",
    "x4242424242424242",
    "4242424242424242x",
    "_103150124152345786",
    "942424242424242429999",
    "Tarjeta: 4242\n4242\n4242\n4242",
    "[TARJETA_1] [NSS_1] [CLABE_1]",
    "Pedido 1234567890123456",
  ])("no confunde valores incorrectos, folios y fragmentos: %s", (text) => {
    expect(inspectPrompt(text).findings).toEqual([]);
  });
  it("respeta offsets UTF-16, etiquetas previas y categorías mixtas", () => {
    const text =
      "🙂 [CLABE_1]\nCLABE: 103150124152345786\nTarjeta: 4242-4242-4242-4242\nNSS: 12345678903\na@example.com";
    const result = protectPrompt(text);
    expect(result.replacementCount).toBe(4);
    expect(result.text).toBe(
      "🙂 [CLABE_1]\nCLABE: [CLABE_2]\nTarjeta: [TARJETA_1]\nNSS: [NSS_1]\n[CORREO_1]",
    );
    expect(result.inspection.findings).toEqual([]);
  });
  it("conserva el bloqueo crítico y aplica el ajuste de advertencias a las categorías nuevas", () => {
    const text = "NSS: 12345678903\nTarjeta: 4242424242424242";
    const settings = { ...DEFAULT_SETTINGS, warnOnPersonalData: false };
    expect(inspectPrompt(text, settings).decision).toBe("ALLOW");
    expect(protectPrompt(text, settings).replacementCount).toBe(2);
    const withSecret = "password=4242424242424242\n" + text;
    const result = protectPrompt(withSecret, settings);
    expect(inspectPrompt(withSecret, settings).decision).toBe("BLOCK");
    expect(result.changes[0]?.concealed).toBe(true);
    expect(result.changes[0]?.before).toBe("••••••••");
    expect(result.text).toContain("password=[CREDENCIAL_1]");
  });
  it.each(["clabe", "card", "nss"])(
    "acepta metadatos de %s y rechaza contenido adicional",
    (category) => {
      const event = { category, action: "WARN", ruleVersion: "1.1.0" };
      expect(eventInputSchema.safeParse(event).success).toBe(true);
      expect(
        eventInputSchema.safeParse({ ...event, value: "no guardar" }).success,
      ).toBe(false);
      expect(
        localEventSchema.safeParse({
          ...event,
          timestamp: new Date().toISOString(),
          platform: "chatgpt",
        }).success,
      ).toBe(true);
    },
  );
});
