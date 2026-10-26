import { describe, expect, it } from "vitest";
import { protectPrompt } from "../../src/application";

describe("informe transitorio de sustituciones", () => {
  it("relaciona cada ocurrencia con la etiqueta real sin colisionar con etiquetas existentes", () => {
    const result = protectPrompt("[CORREO_1] 🙂 a@example.com y a@example.com");
    expect(result.text).toBe("[CORREO_1] 🙂 [CORREO_2] y [CORREO_3]");
    expect(
      result.changes.map(({ before, after, concealed }) => ({
        before,
        after,
        concealed,
      })),
    ).toEqual([
      { before: "a@example.com", after: "[CORREO_2]", concealed: false },
      { before: "a@example.com", after: "[CORREO_3]", concealed: false },
    ]);
    expect(result.changes).toHaveLength(result.replacementCount);
  });
  it("enmascara las credenciales sin perder su categoría ni su sustitución", () => {
    const result = protectPrompt(
      "password=private-password-123 API_KEY=synthetic-api-secret-123 alumno@example.com",
    );
    expect(result.changes.filter((change) => change.concealed)).toHaveLength(2);
    expect(JSON.stringify(result.changes)).not.toMatch(
      /private-password|synthetic-api-secret/,
    );
    expect(result.changes.map((change) => change.category)).toEqual([
      "password",
      "api-key",
      "email",
    ]);
    for (const change of result.changes)
      expect(result.text).toContain(change.after);
    expect(
      result.changes.find((change) => change.category === "email")?.before,
    ).toBe("alumno@example.com");
  });
  it("no inventa cambios para texto seguro ni conserva el informe en la siguiente operación", () => {
    protectPrompt("a@example.com");
    expect(protectPrompt("Hola mundo").changes).toEqual([]);
  });
});
