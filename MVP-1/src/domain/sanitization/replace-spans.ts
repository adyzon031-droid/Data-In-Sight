import type { Category, Finding } from "../detection/types";

const LABELS: Record<Category, string> = {
  email: "CORREO",
  phone: "TELEFONO",
  curp: "CURP",
  rfc: "RFC",
  clabe: "CLABE",
  card: "TARJETA",
  nss: "NSS",
  ine: "INE",
  passport: "PASAPORTE",
  license: "LICENCIA",
  name: "NOMBRE",
  address: "DOMICILIO",
  "birth-date": "NACIMIENTO",
  health: "SALUD",
  password: "CREDENCIAL",
  "api-key": "CREDENCIAL",
  token: "CREDENCIAL",
};

export function replaceSpansWithReport(text: string, findings: Finding[]) {
  const counters = new Map<string, number>();
  const used = new Set(
    text.match(
      /\[(?:CORREO|TELEFONO|CURP|RFC|CLABE|TARJETA|NSS|INE|PASAPORTE|LICENCIA|NOMBRE|DOMICILIO|NACIMIENTO|SALUD|CREDENCIAL)_\d+\]/gu,
    ) ?? [],
  );
  const replacements = findings.map((finding) => {
    const label = LABELS[finding.category];
    let number = (counters.get(label) ?? 0) + 1;
    while (used.has(`[${label}_${number}]`)) number++;
    counters.set(label, number);
    const placeholder = `[${label}_${number}]`;
    used.add(placeholder);
    return { ...finding, placeholder };
  });
  let result = text;
  for (const span of replacements.toReversed()) {
    result =
      result.slice(0, span.start) + span.placeholder + result.slice(span.end);
  }
  return { text: result, replacements };
}

export function replaceSpans(text: string, findings: Finding[]): string {
  return replaceSpansWithReport(text, findings).text;
}
