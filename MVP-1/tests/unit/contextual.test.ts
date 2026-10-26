import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  MAX_INPUT_LENGTH,
  inspectPrompt,
  protectPrompt,
} from "../../src/application";
import { eventInputSchema } from "../../src/infrastructure/messaging/contracts";
import { localEventSchema } from "../../src/infrastructure/storage/repository";

const cases = [
  ["CIC del INE: 123456789", "ine", "123456789", "INE"],
  ["INE: 123456789", "ine", "123456789", "INE"],
  ["CIC: 012345678", "ine", "012345678", "INE"],
  ["OCR del INE: 1234567890123", "ine", "1234567890123", "INE"],
  ["INE OCR: 123456789012", "ine", "123456789012", "INE"],
  ["Clave de elector: ABCDEF90021409H123", "ine", "ABCDEF90021409H123", "INE"],
  ["Pasaporte: G12345678", "passport", "G12345678", "PASAPORTE"],
  [
    'Número de pasaporte mexicano = "G12345678"',
    "passport",
    "G12345678",
    "PASAPORTE",
  ],
  ["Licencia de conducir: CDMX-1234567", "license", "CDMX-1234567", "LICENCIA"],
  ["Licencia de conducir: 123456789", "license", "123456789", "LICENCIA"],
  [
    "Nombre completo: María del Carmen López",
    "name",
    "María del Carmen López",
    "NOMBRE",
  ],
  [
    "Mi nombre es Juan Pérez y mi correo es alumno@example.com",
    "name",
    "Juan Pérez",
    "NOMBRE",
  ],
  ['{"nombre completo": "ANA LÓPEZ"}', "name", "ANA LÓPEZ", "NOMBRE"],
  ["Paciente: José O’Connor", "name", "José O’Connor", "NOMBRE"],
  [
    "Domicilio: Calle Ejemplo 123, Colonia Centro.",
    "address",
    "Calle Ejemplo 123, Colonia Centro",
    "DOMICILIO",
  ],
  [
    "Mi dirección es Avenida Ejemplo 45 y mi correo es a@example.com",
    "address",
    "Avenida Ejemplo 45",
    "DOMICILIO",
  ],
  ["Fecha de nacimiento: 14/02/1990", "birth-date", "14/02/1990", "NACIMIENTO"],
  ["Nacimiento: 1990-02-14", "birth-date", "1990-02-14", "NACIMIENTO"],
  [
    "Nací el 29 de febrero de 2000",
    "birth-date",
    "29 de febrero de 2000",
    "NACIMIENTO",
  ],
  ["DOB: 29-02-2000", "birth-date", "29-02-2000", "NACIMIENTO"],
  [
    "Mi diagnóstico es alergia al polen.",
    "health",
    "alergia al polen",
    "SALUD",
  ],
  [
    "Diagnóstico del paciente: condición de prueba",
    "health",
    "condición de prueba",
    "SALUD",
  ],
  ["Mis alergias: penicilina", "health", "penicilina", "SALUD"],
  [
    "Tratamiento del paciente: medicamento de ejemplo",
    "health",
    "medicamento de ejemplo",
    "SALUD",
  ],
  ["Expediente clínico: EXP-123456", "health", "EXP-123456", "SALUD"],
] as const;

describe("identidad y contexto personal", () => {
  it("conserva comillas, separadores y campos ajenos al proteger campos JSON", () => {
    const input =
      '{"domicilio": "Calle Ejemplo 123, Centro", "diagnóstico del paciente": "alergia al polen", "nota": "revisar"}';
    const result = protectPrompt(input);
    expect(JSON.parse(result.text)).toEqual({
      domicilio: "[DOMICILIO_1]",
      "diagnóstico del paciente": "[SALUD_1]",
      nota: "revisar",
    });
    expect(result.replacementCount).toBe(2);
  });
  it.each(cases)("revisa %s", (text, category, value, label) => {
    const inspection = inspectPrompt(text);
    expect(inspection.decision).toBe("WARN");
    const finding = inspection.findings.find(
      (item) => item.category === category,
    );
    expect(finding).toBeDefined();
    expect(text.slice(finding!.start, finding!.end)).toBe(value);
    const result = protectPrompt(text);
    expect(
      result.changes.find((item) => item.category === category),
    ).toMatchObject({ before: value, after: `[${label}_1]` });
    expect(result.inspection.findings).toEqual([]);
    expect(protectPrompt(result.text).text).toBe(result.text);
  });
  it.each([
    "La reunión será el 14/02/1990.",
    "Pasaporte: documento",
    "Licencia de software: ABC123456",
    "Licencia de conducir: conducir",
    "CIC: 12345678",
    "CIC: 000000000",
    "OCR del INE: 12345678901234",
    "Clave de elector: ABCDEF90023109H123",
    "Pasaporte: G12345678901234567",
    "Nombre: de la variable",
    "Nombre completo: Sin Datos",
    "nombre del archivo: Reporte Final",
    "Dirección: https://ejemplo.com/calle123",
    "Domicilio: sin domicilio",
    "Dirección: Calle Ejemplo",
    "Fecha de nacimiento: 31/02/1990",
    "Fecha de nacimiento: 29/02/1900",
    "Fecha de nacimiento: 14/02/2099",
    "Fecha de nacimiento: 2000-13-01",
    "Fecha de nacimiento: 01/02-1990",
    "Diagnóstico: error de conexión",
    "Qué significa diagnóstico diferencial",
    "Expediente judicial: 123456789",
    "Mis alergias: ninguna",
    "Diagnóstico: pendiente",
    "[INE_1] [PASAPORTE_1] [SALUD_1] [NOMBRE_1]",
  ])("evita una falsa alarma: %s", (text) => {
    expect(inspectPrompt(text).findings).toEqual([]);
  });
  it("protege datos mixtos con offsets UTF-16, sin alterar etiquetas existentes ni filtrar secretos en el informe", () => {
    const text =
      "🙂 [NOMBRE_1]\nNombre completo: Juan Pérez\nDomicilio: Calle Ejemplo 1\nFecha de nacimiento: 29/02/2000\nPasaporte: G12345678\nLicencia de conducir: CDMX-1234567\nCIC del INE: 123456789\nMi diagnóstico es condición de prueba y mi contraseña es private-secret-123";
    const result = protectPrompt(text);
    expect(inspectPrompt(text).decision).toBe("BLOCK");
    expect(result.replacementCount).toBe(8);
    expect(result.text).toContain("Nombre completo: [NOMBRE_2]");
    expect(result.text).toContain(
      "Mi diagnóstico es [SALUD_1] y mi contraseña es [CREDENCIAL_1]",
    );
    expect(JSON.stringify(result.changes)).not.toContain("private-secret-123");
    expect(result.inspection.decision).toBe("ALLOW");
  });
  it("aplica el ajuste personal sin perder hallazgos ni permitir credenciales críticas", () => {
    const settings = { ...DEFAULT_SETTINGS, warnOnPersonalData: false };
    expect(
      inspectPrompt("Nombre completo: Juan Pérez", settings).decision,
    ).toBe("ALLOW");
    expect(
      protectPrompt("Nombre completo: Juan Pérez", settings).replacementCount,
    ).toBe(1);
    expect(
      inspectPrompt(
        "Nombre completo: Juan Pérez\npassword=private-secret-123",
        settings,
      ).decision,
    ).toBe("BLOCK");
  });
  it.each([
    "ine",
    "passport",
    "license",
    "name",
    "address",
    "birth-date",
    "health",
  ])("valida solo metadatos para %s", (category) => {
    const event = { category, action: "SANITIZE", ruleVersion: "1.2.0" };
    expect(eventInputSchema.safeParse(event).success).toBe(true);
    expect(
      eventInputSchema.safeParse({ ...event, before: "no guardar" }).success,
    ).toBe(false);
    expect(
      localEventSchema.safeParse({
        ...event,
        platform: "chatgpt",
        timestamp: new Date().toISOString(),
      }).success,
    ).toBe(true);
  });
  it("procesa campos largos y repeticiones dentro del límite sin bloquear el motor", () => {
    const text = ("Nombre completo: " + "A".repeat(100) + " ")
      .repeat(160)
      .slice(0, MAX_INPUT_LENGTH);
    expect(() => inspectPrompt(text)).not.toThrow();
  }, 1500);
});
