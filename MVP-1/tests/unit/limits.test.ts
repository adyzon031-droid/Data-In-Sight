import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  MAX_INPUT_LENGTH,
  inspectPrompt,
  protectPrompt,
  type Category,
} from "../../src/application";

// Reserved domains, public test card/CLABE examples and synthetic identifiers only.
const categories: Array<[Category, string]> = [
  ["email", "alumno@example.com"],
  ["phone", "+44 20 7946 0018 ext. 42"],
  ["curp", "GODE900101HDFRRN09"],
  ["rfc", "GODE900101AB1"],
  ["clabe", "103150124152345786"],
  ["card", "4242 4242 4242 4242"],
  ["nss", "NSS: 12345678903"],
  ["ine", "INE: 123456789"],
  ["passport", "Pasaporte: G12345678"],
  ["license", "Licencia: CDMX-1234567"],
  ["name", "Nombre: ana pérez"],
  ["address", "Domicilio: Calle Ejemplo 123, Colonia Centro"],
  ["birth-date", "Nacimiento: 29/02/2000"],
  ["health", "Mi diagnóstico: asma"],
  ["password", 'password="synthetic example"'],
  ["api-key", "API_KEY=synthetic-example-key"],
  ["token", "access_token=synthetic-example-token"],
];
const fullwidth = (text: string) =>
  text.replace(/[!-~]/gu, (char) =>
    String.fromCharCode(char.charCodeAt(0) + 0xfee0),
  );
const variants: Array<[string, (text: string) => string]> = [
  ["original", (text) => text],
  ["emoji y puntuación", (text) => `🙂 «${text}»`],
  ["CRLF", (text) => `Consulta\r\n${text}\r\nFin`],
  ["ancho completo", fullwidth],
  ["separadores invisibles", (text) => text.split("").join("\u200b")],
  [
    "mezcla Unicode",
    (text) => `👩‍💻 ${fullwidth(text).split("").join("\u2060")} ✨`,
  ],
];

describe("límites: 17 categorías y variantes de representación", () => {
  for (const [category, sample] of categories) {
    it.each(variants)(`${category}: %s`, (_label, transform) => {
      const text = transform(sample);
      const result = inspectPrompt(text);
      expect(result.findings.map((item) => item.category)).toContain(category);
      expect(result.decision).toBe(
        ["password", "api-key", "token"].includes(category) ? "BLOCK" : "WARN",
      );
      let lastEnd = 0;
      for (const finding of result.findings) {
        expect(finding.start).toBeGreaterThanOrEqual(lastEnd);
        expect(finding.end).toBeGreaterThan(finding.start);
        expect(finding.end).toBeLessThanOrEqual(text.length);
        lastEnd = finding.end;
      }
      const protectedResult = protectPrompt(text);
      expect(protectedResult.inspection.decision).toBe("ALLOW");
      expect(protectedResult.inspection.findings).toEqual([]);
      expect(protectedResult.replacementCount).toBeGreaterThan(0);
      expect(protectPrompt(protectedResult.text).replacementCount).toBe(0);
      // Original slices must agree with the report despite normalization/emoji.
      for (const change of protectedResult.changes) {
        const finding = result.findings.find((item) => item.id === change.id)!;
        expect(change.before).toBe(
          change.concealed
            ? "••••••••"
            : text.slice(finding.start, finding.end),
        );
      }
    });
  }
});

describe("límites: sustitución, privacidad y carga", () => {
  it("revisa las 17 categorías juntas sin perder ninguna por solapamiento", () => {
    const text = categories.map(([, sample]) => sample).join("\n");
    const inspection = inspectPrompt(text);
    expect(new Set(inspection.findings.map((item) => item.category)).size).toBe(
      17,
    );
    const result = protectPrompt(text);
    expect(result.replacementCount).toBe(17);
    expect(result.inspection.decision).toBe("ALLOW");
    expect(JSON.stringify(result.changes)).not.toMatch(/synthetic/);
    expect(JSON.stringify(inspection)).not.toMatch(
      /example\.com|synthetic|123456789/,
    );
  });
  it.each(["\n", "\r\n", "\\\n"])(
    "protege credenciales entre comillas con salto %j completo",
    (newline) => {
      const text = `password="first${newline}second"; correo: alumno@example.com`;
      const result = protectPrompt(text);
      expect(result.text).toBe('password="[CREDENCIAL_1]"; correo: [CORREO_1]');
      expect(JSON.stringify(result.changes)).not.toMatch(/first|second/);
      expect(result.inspection.decision).toBe("ALLOW");
    },
  );
  it.each([
    "correo alumno@example.com",
    "teléfono +34 612 345 678",
    "token synthetic-token",
  ])("delimita domicilio antes del campo sin separador %s", (next) => {
    const text = `Domicilio: Calle Ejemplo 123, ${next}`;
    const result = protectPrompt(text);
    expect(
      result.changes.find((item) => item.category === "address")?.before,
    ).toBe("Calle Ejemplo 123");
    expect(result.replacementCount).toBeGreaterThanOrEqual(
      next.startsWith("token") ? 1 : 2,
    );
  });
  it("mantiene secreto prioritario y exige revisión de los datos restantes", () => {
    const result = protectPrompt(
      "Domicilio: Calle Ejemplo 123 password=synthetic-secret",
    );
    expect(
      result.changes.find((item) => item.category === "password")?.concealed,
    ).toBe(true);
    expect(result.inspection.decision).toBe("ALLOW");
    expect(result.text).not.toMatch(/Calle Ejemplo|synthetic-secret/);
  });
  it("cubre el último carácter permitido y bloquea un UTF-16 adicional", () => {
    const secret = "password=synthetic-boundary";
    const text = " ".repeat(MAX_INPUT_LENGTH - secret.length) + secret;
    expect(inspectPrompt(text).decision).toBe("BLOCK");
    expect(inspectPrompt(text).analysisError).toBeUndefined();
    const tooLong = protectPrompt(text + "🙂");
    expect(tooLong.inspection.analysisError).toBe("INPUT_TOO_LARGE");
    expect(tooLong.inspection.canContinue).toBe(false);
    expect(tooLong.changes).toEqual([]);
  });
  it("procesa cientos de ocurrencias sin colisiones ni residuo", () => {
    const text = "[CORREO_1]\n" + "alumno@example.com; ".repeat(500);
    const result = protectPrompt(text);
    expect(result.replacementCount).toBe(500);
    expect(new Set(result.changes.map((item) => item.after)).size).toBe(500);
    expect(result.text).toContain("[CORREO_501]");
    expect(result.inspection.findings).toEqual([]);
  });
  it("desactivar advertencias personales conserva el bloqueo de secretos Unicode", () => {
    expect(
      inspectPrompt(fullwidth('password="synthetic"'), {
        ...DEFAULT_SETTINGS,
        warnOnPersonalData: false,
      }).decision,
    ).toBe("BLOCK");
  });
  it.each([
    "",
    "🙂👩‍💻",
    "Hola mundo",
    "Precio: 19.99",
    "Fecha: 2026-10-20",
    "Folio: 5512345678",
    "Explícame la diabetes",
    "[CORREO_1] [CREDENCIAL_1]",
  ])("no altera texto benigno %j", (text) => {
    expect(protectPrompt(text).text).toBe(text);
    expect(inspectPrompt(text).findings).toEqual([]);
  });
});

describe("límites: formatos adicionales de credenciales y correo", () => {
  const jwt =
    "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJzeW50aGV0aWMifQ.c3ludGhldGljU2lnbmF0dXJlMTIzNDU2";
  it.each([jwt, `🙂 ${jwt}`, `${jwt}.`, fullwidth(jwt)])(
    "bloquea JWT compacto reconocible sin etiqueta: %s",
    (text) => {
      expect(inspectPrompt(text).decision).toBe("BLOCK");
      const result = protectPrompt(text);
      expect(result.changes[0]?.concealed).toBe(true);
      expect(result.inspection.decision).toBe("ALLOW");
      expect(JSON.stringify(result.changes)).not.toMatch(/eyJ/);
    },
  );
  it.each([
    "eyJhbGciOiJIUzI1NiJ9.invalid_payload.c3ludGhldGljU2lnbmF0dXJlMTIzNDU2",
    "example.component.version",
    "eyJhbGciOiJub25lIn0.eyJzdWIiOiJzeW50aGV0aWMifQ.",
  ])("no inventa un JWT firmado en %s", (text) => {
    expect(inspectPrompt(text).findings).toEqual([]);
  });
  it.each(["josé@example.com", "用户@example.com", "jose\u0301@example.com"])(
    "protege parte local Unicode en %s",
    (text) => {
      expect(inspectPrompt(text).findings[0]?.category).toBe("email");
      expect(protectPrompt(text).text).toBe("[CORREO_1]");
    },
  );
});
