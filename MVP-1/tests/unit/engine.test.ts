import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  MAX_INPUT_LENGTH,
  inspectPrompt,
  protectPrompt,
  settingsSchema,
} from "../../src/application";
import {
  messages,
  sensitive,
  benign,
  difficult,
} from "../fixtures/dlp/messages";
import { candidate } from "../../src/domain/detection/types";
import { mergeFindings } from "../../src/domain/detection/merge-findings";

describe("corpus sintético: 20 sensibles, 20 benignos, 20 difíciles", () => {
  it("contiene 60 escenarios identificados sin duplicados de ID", () => {
    expect([sensitive.length, benign.length, difficult.length]).toEqual([
      20, 20, 20,
    ]);
    expect(new Set(messages.map((m) => m.id)).size).toBe(60);
  });
  for (const message of messages) {
    it(message.id, () => {
      const inspection = inspectPrompt(message.text);
      expect(inspection.decision).toBe(message.decision);
      expect(
        [...new Set(inspection.findings.map((f) => f.category))].sort(),
      ).toEqual([...message.categories].sort());
      expect(inspection.canContinue).toBe(message.decision === "WARN");
      for (const finding of inspection.findings) {
        expect(finding.start).toBeGreaterThanOrEqual(0);
        expect(finding.end).toBeGreaterThan(finding.start);
        expect(finding.end).toBeLessThanOrEqual(message.text.length);
        expect(finding.confidence).toBeGreaterThan(0);
        expect(finding.confidence).toBeLessThanOrEqual(1);
      }
    });
  }
});

describe("sustitución y reevaluación", () => {
  for (const message of [...sensitive, ...difficult].filter(
    (m) => m.categories.length,
  )) {
    it(`protege ${message.id}`, () => {
      const result = protectPrompt(message.text);
      expect(result.replacementCount).toBeGreaterThan(0);
      expect(result.inspection.decision).toBe("ALLOW");
      expect(result.inspection.findings).toEqual([]);
      expect(protectPrompt(result.text).text).toBe(result.text);
    });
  }
  it("conserva emoji, espacios, puntuación y texto exterior con índices UTF-16", () => {
    const text =
      '🙂\nMi correo: alumno@example.com, gracias.\npassword="prueba de frase"';
    const findings = inspectPrompt(text).findings;
    expect(text.slice(findings[0]!.start, findings[0]!.end)).toBe(
      "alumno@example.com",
    );
    expect(protectPrompt(text).text).toBe(
      '🙂\nMi correo: [CORREO_1], gracias.\npassword="[CREDENCIAL_1]"',
    );
  });
  it("no persiste equivalencias: datos repetidos reciben etiquetas por aparición", () => {
    expect(protectPrompt("a@example.com a@example.com").text).toBe(
      "[CORREO_1] [CORREO_2]",
    );
  });
  it("evita colisiones con etiquetas que ya existen", () => {
    expect(protectPrompt("[CORREO_1] a@example.com").text).toBe(
      "[CORREO_1] [CORREO_2]",
    );
  });
  it("preserva texto benigno exactamente", () => {
    expect(protectPrompt("🙂\nHola\t mundo").text).toBe("🙂\nHola\t mundo");
  });
  it("protege correos entre comillas simples, markdown o corchetes sin perder envolturas", () => {
    for (const [opening, closing] of [
      ["'", "'"],
      ["`", "`"],
      ["[", "]"],
      ["{", "}"],
    ]) {
      expect(protectPrompt(`${opening}a@example.com${closing}`).text).toBe(
        `${opening}[CORREO_1]${closing}`,
      );
    }
    expect(protectPrompt("o'brien@example.com").text).toBe("[CORREO_1]");
  });
  it("sustituye todo el valor con comillas escapadas y valores con comillas sin cerrar", () => {
    const escaped = 'password="part-one\\"part-two"';
    expect(protectPrompt(escaped).text).toBe('password="[CREDENCIAL_1]"');
    expect(protectPrompt('password="unfinished phrase').text).toBe(
      'password="[CREDENCIAL_1]',
    );
    expect(protectPrompt("password='unfinished phrase").text).toBe(
      "password='[CREDENCIAL_1]",
    );
  });
  it("recalcula hallazgos a partir del texto nuevo", () => {
    expect(inspectPrompt("password=primero").decision).toBe("BLOCK");
    expect(protectPrompt("a@example.com").text).toBe("[CORREO_1]");
  });
});

describe("política y límites", () => {
  it("las credenciales críticas prevalecen sobre PII y ajustes personales", () => {
    expect(
      inspectPrompt("a@example.com password=synthetic", {
        ...DEFAULT_SETTINGS,
        warnOnPersonalData: false,
      }).decision,
    ).toBe("BLOCK");
    expect(
      inspectPrompt("a@example.com", {
        ...DEFAULT_SETTINGS,
        warnOnPersonalData: false,
      }).decision,
    ).toBe("ALLOW");
  });
  it("proteger también reemplaza PII aunque las advertencias personales estén desactivadas", () => {
    expect(
      protectPrompt("a@example.com", {
        ...DEFAULT_SETTINGS,
        warnOnPersonalData: false,
      }).text,
    ).toBe("[CORREO_1]");
  });
  it("rechaza opciones ajenas o inválidas", () => {
    expect(
      settingsSchema.safeParse({ ...DEFAULT_SETTINGS, disableCritical: true })
        .success,
    ).toBe(false);
    for (const retentionDays of [0, 31, 1.5, NaN]) {
      expect(
        settingsSchema.safeParse({ ...DEFAULT_SETTINGS, retentionDays })
          .success,
      ).toBe(false);
    }
  });
  it("no analiza ni trunca silenciosamente entradas excesivas", () => {
    const text = "a".repeat(MAX_INPUT_LENGTH + 1);
    expect(inspectPrompt(text)).toEqual({
      findings: [],
      decision: "BLOCK",
      canContinue: false,
      analysisError: "INPUT_TOO_LARGE",
    });
    expect(protectPrompt(text)).toEqual({
      text,
      replacementCount: 0,
      changes: [],
      inspection: inspectPrompt(text),
    });
  });
  it("admite el límite exacto", () => {
    expect(
      inspectPrompt(" ".repeat(MAX_INPUT_LENGTH)).analysisError,
    ).toBeUndefined();
  });
  it("da resultados deterministas sin estado acumulado", () => {
    const text = "password=synthetic a@example.com";
    expect(inspectPrompt(text)).toEqual(inspectPrompt(text));
    expect(Object.isFrozen(DEFAULT_SETTINGS)).toBe(true);
  });
  it("no devuelve originales ni texto en el resultado de inspección", () => {
    const result = inspectPrompt("password=unique-synthetic-value");
    expect(JSON.stringify(result)).not.toContain("unique-synthetic-value");
    expect(Object.keys(result).sort()).toEqual([
      "canContinue",
      "decision",
      "findings",
    ]);
  });
  it("no acepta formatos incrustados en identificadores mayores", () => {
    expect(inspectPrompt("XGODE900101AB1Z").decision).toBe("ALLOW");
    expect(inspectPrompt(`xghp_${"a".repeat(36)}z`).decision).toBe("ALLOW");
  });
  it("no bloquea por aleatoriedad sin contexto", () => {
    expect(inspectPrompt("q9dXn2pVm4tRa8wZ".repeat(20)).decision).toBe("ALLOW");
  });
  it("procesa texto adversarial al límite sin regex anidadas", () => {
    const inputs = [
      "a".repeat(MAX_INPUT_LENGTH - 1) + "@",
      "@".repeat(MAX_INPUT_LENGTH),
      "password ".repeat(2200),
    ];
    for (const text of inputs)
      expect(inspectPrompt(text).decision).toBe("ALLOW");
  }, 2000);
});

describe("solapamientos", () => {
  const email = candidate(
    "email.test",
    "email",
    0,
    20,
    0.95,
    "medium",
    "Formato",
  );
  const secret = candidate(
    "secret.test",
    "password",
    0,
    20,
    0.98,
    "critical",
    "Contexto",
  );
  it("prefiere credenciales y elimina duplicados sin depender del orden de detectores", () => {
    const expected = mergeFindings([email, secret, { ...secret }]);
    expect(expected).toHaveLength(1);
    expect(expected[0]?.category).toBe("password");
    expect(mergeFindings([secret, email])).toEqual(expected);
  });
  it("mantiene intervalos adyacentes", () => {
    expect(
      mergeFindings([email, { ...email, start: 20, end: 40 }]),
    ).toHaveLength(2);
  });
});
