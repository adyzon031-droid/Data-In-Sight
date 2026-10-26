import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  inspectPrompt,
  protectPrompt,
  settingsSchema,
} from "../../src/application";
import type { CountryCode } from "libphonenumber-js";
import {
  createRepository,
  SETTINGS_KEY,
} from "../../src/infrastructure/storage/repository";

const phones: Array<[string, CountryCode?]> = [
  ["7731112030"],
  ["55 1234 5678"],
  ["Llámenme al 7731112030 cuando puedan"],
  ["+1 213 373 4253"],
  ["+1 (213) 373-4253 ext. 42"],
  ["+34 612 345 678"],
  ["+44 20 7946 0018"],
  ["+57 300 123 4567"],
  ["+54 9 11 2345 6789"],
  ["+55 11 91234 5678"],
  ["+49 30 901820"],
  ["+33 6 12 34 56 78"],
  ["+61 412 345 678"],
  ["+91 98765 43210"],
  ["0044 20 7946 0018"],
  ["0034 612 345 678", "US"],
  ["+34 612 345 678 extensión 123"],
  ["+44 20 7946 0018 anexo 42"],
  ["+1 213 373 4253 interno 42"],
  ["+1 213 373 4253 x42"],
  ["020 7946 0018", "GB"],
  ["612 345 678", "ES"],
  ["213 373 4253", "US"],
  ["+44 20 7946 0018", "US"],
];
describe("teléfonos internacionales y texto libre", () => {
  it.each(phones)(
    "detecta todo el teléfono %s con región %s",
    (text, phoneRegion) => {
      const settings = {
        ...DEFAULT_SETTINGS,
        phoneRegion: phoneRegion ?? "MX",
      };
      const result = inspectPrompt(text, settings);
      const finding = result.findings.find((item) => item.category === "phone");
      expect(finding).toBeDefined();
      const protectedResult = protectPrompt(text, settings);
      expect(protectedResult.inspection.decision).toBe("ALLOW");
      expect(protectedResult.replacementCount).toBe(1);
      const value = text.slice(finding!.start, finding!.end);
      if (!text.startsWith("Llámenme")) expect(value).toBe(text);
      expect(protectedResult.changes[0]?.before).toBe(value);
      expect(
        protectPrompt(protectedResult.text, settings).replacementCount,
      ).toBe(0);
    },
  );
  it.each([
    "El pedido es 5512345678.",
    "Referencia: 7711234567",
    "Factura: 7731112030",
    "NSS: 12345678903",
    "CIC: 123456789",
    "2026-10-20",
    "12345",
    "+999 123456789",
    "Texto7731112030",
    "7731112030texto",
    "1237731112030123",
    "[TELEFONO_1]",
  ])("no inventa un teléfono en %s", (text) => {
    expect(
      inspectPrompt(text).findings.filter((item) => item.category === "phone"),
    ).toEqual([]);
  });
  it("no interpreta todos los países a la vez cuando un número no tiene prefijo", () => {
    expect(inspectPrompt("020 7946 0018").findings).toEqual([]);
    expect(
      inspectPrompt("020 7946 0018", {
        ...DEFAULT_SETTINGS,
        phoneRegion: "GB",
      }).findings.map((f) => f.category),
    ).toEqual(["phone"]);
  });
});
const cases = [
  ["daniel cornejo", "name", "daniel cornejo"],
  ["🙂 daniel cornejo, 7731112030", "name", "daniel cornejo"],
  [
    "Me llamo daniel cornejo y mi teléfono es 7731112030",
    "name",
    "daniel cornejo",
  ],
  ["Soy daniel cornejo.", "name", "daniel cornejo"],
  ["nombre completo juan pérez", "name", "juan pérez"],
  ["nombre: maría del carmen lópez", "name", "maría del carmen lópez"],
  ["juan carlos pérez gómez", "name", "juan carlos pérez gómez"],
  ["Háblame de Juan Pérez y la diabetes.", "name", "Juan Pérez"],
  ["Vivo en Calle Ejemplo 123.", "address", "Calle Ejemplo 123"],
  ["calle 5 de Mayo 123", "address", "calle 5 de Mayo 123"],
  [
    "avenida reforma 123, colonia centro",
    "address",
    "avenida reforma 123, colonia centro",
  ],
  ["mi pasaporte G12345678", "passport", "G12345678"],
  ["licencia de manejo CDMX-1234567", "license", "CDMX-1234567"],
  ["mi seguro social es 12345678903", "nss", "12345678903"],
  ["fecha de nacimiento 14/02/1990", "birth-date", "14/02/1990"],
  ["Tengo diabetes tipo 2.", "health", "diabetes tipo 2"],
  ["Padezco asma y necesito una cita", "health", "asma"],
] as const;
describe("datos personales fuera de una plantilla", () => {
  it.each(cases)("revisa %s", (text, category, value) => {
    const inspection = inspectPrompt(text);
    const finding = inspection.findings.find(
      (item) => item.category === category,
    );
    expect(finding).toBeDefined();
    expect(text.slice(finding!.start, finding!.end)).toBe(value);
    const protectedResult = protectPrompt(text);
    expect(protectedResult.inspection.findings).toEqual([]);
    expect(
      protectedResult.changes.find((item) => item.category === category)
        ?.before,
    ).toBe(value);
  });
  it("conserva el texto exterior y sustituye los dos ejemplos sin etiquetas", () => {
    const result = protectPrompt("🙂 daniel cornejo, 7731112030. Gracias.");
    expect(result.text).toBe("🙂 [NOMBRE_1], [TELEFONO_1]. Gracias.");
    expect(result.replacementCount).toBe(2);
    expect(result.inspection.decision).toBe("ALLOW");
  });
  it.each([
    "luz solar",
    "rosa roja",
    "clara explicación",
    "San Luis Potosí",
    "Soy director general",
    "Qué es la diabetes",
    "Explícame el diagnóstico de diabetes.",
    "La reunión es el 14/02/1990",
    "nombre de la variable",
    "Juan necesita ayuda",
  ])("evita marcar frases generales: %s", (text) =>
    expect(inspectPrompt(text).findings).toEqual([]),
  );
  it("las credenciales siguen bloqueándose y no aparecen en el informe", () => {
    const result = protectPrompt(
      "daniel cornejo, 7731112030; password=synthetic-private-value",
    );
    expect(
      inspectPrompt("7731112030 password=synthetic-private-value").decision,
    ).toBe("BLOCK");
    expect(JSON.stringify(result.changes)).not.toContain(
      "synthetic-private-value",
    );
    expect(result.inspection.decision).toBe("ALLOW");
  });
});
describe("compatibilidad del país de teléfonos", () => {
  it("aplica MX a ajustes existentes y valida regiones soportadas", async () => {
    const { phoneRegion: _, ...legacy } = DEFAULT_SETTINGS;
    expect(settingsSchema.parse(legacy).phoneRegion).toBe("MX");
    const repository = createRepository({
      get: async () => ({ [SETTINGS_KEY]: legacy }),
      set: async () => undefined,
      remove: async () => undefined,
    });
    expect((await repository.getSettings()).phoneRegion).toBe("MX");
    expect(
      settingsSchema.safeParse({ ...legacy, phoneRegion: "ZZ" }).success,
    ).toBe(false);
    expect(
      settingsSchema.safeParse({ ...legacy, phoneRegion: "ES" }).success,
    ).toBe(true);
  });
});
