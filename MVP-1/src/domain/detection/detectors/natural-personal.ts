import { candidate, type Candidate, type Detector } from "../types";

/** Free-text cues complement structured fields; they do not infer every person or medical fact. */
export const detectNaturalPersonal: Detector = (text) => {
  const findings: Candidate[] = [];
  const street =
    /(?<![\p{L}\p{N}_])(?:calle|avenida|av\.?|calzada|blvd\.?|boulevard|privada|cerrada|carretera|circuito|andador)[\t ]+(?:[\p{L}\p{N}][\p{L}\p{M}\p{N}.'’-]*[\t ]+){1,6}?(?:#\s*|n[uú]m(?:ero)?\.?\s*)?\d{1,6}[A-Z]?(?![\p{L}\p{N}_])(?:,[\t ]*(?:col(?:onia)?\.?|barrio|fraccionamiento)[\t ]+[\p{L}\p{M}]+(?:[\t ]+[\p{L}\p{M}]+){0,3})?/giu;
  for (const match of text.matchAll(street)) {
    findings.push(
      candidate(
        "address.unstructured",
        "address",
        match.index,
        match.index + match[0].length,
        0.84,
        "high",
        "Posible dirección por vía, nombre y numeración, sin exigir la etiqueta domicilio.",
      ),
    );
  }
  const clinical =
    /(?<![\p{L}\p{N}_])(?:tengo|padezco|sufro(?:[\t ]+de)?|me[\t ]+diagnosticaron(?:[\t ]+con)?)[\t ]+(?<value>(?:diabetes|asma|hipertensi[oó]n|c[aá]ncer|depresi[oó]n|ansiedad|alergia|VIH|insuficiencia[\t ]+[\p{L}]+|una?[\t ]+(?:alergia|fractura|infecci[oó]n))(?:[\t ]+(?:tipo[\t ]+\d|al?[\t ]+[\p{L}]+|de[\t ]+[\p{L}]+))?)(?![\p{L}\p{N}_])/giu;
  for (const match of text.matchAll(clinical)) {
    const value = match.groups!.value!;
    const start = match.index + match[0].lastIndexOf(value);
    findings.push(
      candidate(
        "health.narrative",
        "health",
        start,
        start + value.length,
        0.88,
        "high",
        "Posible información de salud declarada en primera persona; no se interpreta ni verifica el diagnóstico.",
      ),
    );
  }
  return findings;
};
