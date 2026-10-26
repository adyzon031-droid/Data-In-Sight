import { personNamePrefix, isGivenName } from "../validators/person-name";
import {
  candidate,
  type Candidate,
  type Category,
  type Detector,
} from "../types";

// Explicit labels constrain ambiguous identifiers; these are plausibility checks, not registry validation.
const separator = String.raw`(?:[\t ]*["']?[\t ]*(?::|=|\bes\b)[\t ]*["']?|[\t ]+)`;
const tokenEnd = String.raw`(?![\p{L}\p{N}_-])`;
function labelled(text: string, label: string, value: string, flags = "giu") {
  return text.matchAll(
    new RegExp(
      String.raw`(?<![\p{L}\p{N}_])(?:${label})${separator}(?<value>${value})${tokenEnd}`,
      flags,
    ),
  );
}
function validBirthDate(value: string): boolean {
  const months = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];
  let day: number, month: number, year: number;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  const numeric = /^(\d{1,2})([/.-])(\d{1,2})\2(\d{4})$/u.exec(value);
  const named = /^(\d{1,2}) de (\p{L}+) de (\d{4})$/iu.exec(value);
  if (iso) {
    year = Number(iso[1]);
    month = Number(iso[2]);
    day = Number(iso[3]);
  } else if (numeric) {
    day = Number(numeric[1]);
    month = Number(numeric[3]);
    year = Number(numeric[4]);
  } else if (named) {
    day = Number(named[1]);
    month = months.indexOf(named[2]!.toLowerCase()) + 1;
    year = Number(named[3]);
  } else return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    year >= 1900 &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day &&
    date.getTime() <= Date.now()
  );
}

export const detectContextualPersonal: Detector = (text) => {
  const findings: Candidate[] = [];
  function addAt(
    start: number,
    category: Category,
    explanation: string,
    value: string,
  ) {
    findings.push(
      candidate(
        `${category}.context`,
        category,
        start,
        start + value.length,
        0.88,
        "high",
        explanation,
      ),
    );
  }
  function add(
    match: RegExpMatchArray,
    category: Category,
    explanation: string,
    value = match.groups!.value!,
  ) {
    const start = match.index! + match[0].lastIndexOf(match.groups!.value!);
    addAt(start, category, explanation, value);
  }
  for (const match of labelled(
    text,
    String.raw`(?:clave[\t ]+de[\t ]+elector|INE|IFE)`,
    String.raw`[A-Z]{6}\d{8}[HMX]\d{3}`,
  )) {
    if (
      validBirthDate(
        `19${match.groups!.value!.slice(6, 8)}-${match.groups!.value!.slice(8, 10)}-${match.groups!.value!.slice(10, 12)}`,
      ) ||
      validBirthDate(
        `20${match.groups!.value!.slice(6, 8)}-${match.groups!.value!.slice(8, 10)}-${match.groups!.value!.slice(10, 12)}`,
      )
    )
      add(
        match,
        "ine",
        "Posible clave de elector por contexto, estructura y fecha. No se consulta el INE.",
      );
  }
  for (const match of labelled(
    text,
    String.raw`(?:INE|IFE|CIC(?:[\t ]+(?:del?[\t ]+)?INE)?|c[oó]digo[\t ]+de[\t ]+identificaci[oó]n[\t ]+de[\t ]+(?:la[\t ]+)?credencial)`,
    String.raw`\d{9}`,
  )) {
    if (!/^(\d)\1+$/u.test(match.groups!.value!))
      add(
        match,
        "ine",
        "Posible CIC de credencial por contexto y longitud; no se verifica registro ni vigencia.",
      );
  }
  for (const match of labelled(
    text,
    String.raw`(?:OCR[\t ]+(?:del?[\t ]+)?INE|INE[\t ]+OCR)`,
    String.raw`\d{12,13}`,
  )) {
    if (!/^(\d)\1+$/u.test(match.groups!.value!))
      add(
        match,
        "ine",
        "Posible identificador OCR de credencial por contexto y longitud; no es análisis de imágenes.",
      );
  }
  for (const [label, category, pattern] of [
    [
      String.raw`(?:n[uú]mero[\t ]+de[\t ]+)?(?:pasaporte|passport)(?:[\t ]+mexicano)?(?:[\t ]+(?:tiene[\t ]+el[\t ]+n[uú]mero|n[uú]mero|nro\.?|num\.?))?`,
      "passport",
      String.raw`[A-Z0-9]{6,12}`,
    ],
    [
      String.raw`(?:n[uú]mero[\t ]+de[\t ]+)?(?:licencia(?:[\t ]+de[\t ]+(?:conducir|manejo))?|driver['’]?s?[\t ]+licen[cs]e)`,
      "license",
      String.raw`[A-Z0-9][A-Z0-9-]{4,19}`,
    ],
  ] as const) {
    for (const match of labelled(text, label, pattern)) {
      const value = match.groups!.value!;
      if (/\d/u.test(value) && !/^(\d)\1+$/u.test(value))
        add(
          match,
          category,
          "Posible identificador por etiqueta explícita y longitud. No se verifica emisión, vigencia ni formato de cada jurisdicción.",
        );
    }
  }
  const nameLabels = new RegExp(
    String.raw`(?<![\p{L}\p{N}_])(?:nombre(?:[\t ]+completo)?|paciente|titular|me[\t ]+llamo|soy)(?:[\t ]+del?[\t ]+paciente)?${separator}`,
    "giu",
  );
  for (const label of text.matchAll(nameLabels)) {
    const start = label.index + label[0].length;
    const value = personNamePrefix(text.slice(start), true);
    if (
      value &&
      (!/^soy\b/iu.test(label[0]) || isGivenName(value.split(/\s/u)[0]!))
    )
      addAt(
        start,
        "name",
        "Posible nombre por contexto natural, sin exigir mayúsculas ni un formulario.",
        value,
      );
  }
  for (const word of text.matchAll(
    /(?<![\p{L}\p{N}_])[\p{L}\p{M}]+(?:[-'’][\p{L}\p{M}]+)*/gu,
  )) {
    if (!isGivenName(word[0], true)) continue;
    if (
      /\b(?:san|santa|santo|ciudad[\t ]+de)[\t ]+$/iu.test(
        text.slice(Math.max(0, word.index - 32), word.index),
      )
    )
      continue;
    const value = personNamePrefix(text.slice(word.index), false);
    if (value)
      findings.push(
        candidate(
          "name.unstructured",
          "name",
          word.index,
          word.index + value.length,
          0.82,
          "high",
          "Posible nombre y apellido por vocabulario local y secuencia de palabras, incluso en minúsculas. Puede requerir revisión.",
        ),
      );
  }
  for (const match of labelled(
    text,
    String.raw`(?:fecha[\t ]+de[\t ]+nacimiento|nacimiento|cumplea[nñ]os|nac[ií][\t ]+(?:el|en)|date[\t ]+of[\t ]+birth|DOB)`,
    String.raw`(?:\d{4}-\d{2}-\d{2}|\d{1,2}[/.-]\d{1,2}[/.-]\d{4}|\d{1,2} de \p{L}+ de \d{4})`,
  )) {
    if (validBirthDate(match.groups!.value!))
      add(
        match,
        "birth-date",
        "Posible fecha de nacimiento por contexto y fecha de calendario no futura.",
      );
  }
  // First-person prose without a colon: 'nací el 14/02/1990'.
  for (const match of text.matchAll(
    /\bnac[ií][\t ]+el[\t ]+(?<value>\d{4}-\d{2}-\d{2}|\d{1,2}[/.-]\d{1,2}[/.-]\d{4}|\d{1,2} de \p{L}+ de \d{4})(?![\p{L}\p{N}_])/giu,
  )) {
    if (validBirthDate(match.groups!.value!))
      add(
        match,
        "birth-date",
        "Posible fecha de nacimiento declarada en primera persona.",
      );
  }
  for (const match of labelled(
    text,
    String.raw`(?:domicilio(?:[\t ]+(?:particular|postal))?|direcci[oó]n(?:[\t ]+(?:postal|particular))?)`,
    String.raw`[^\n;!?"{}]{8,220}`,
  )) {
    let value = match
      .groups!.value!.split(
        /[\t ]+(?:y[\t ]+)?(?:mi[\t ]+)?(?:correo|tel[eé]fono|contrase[nñ]a|API_KEY|token)(?:[\t ]*(?::|=|\bes\b)|[\t ]+)/iu,
      )[0]!
      .trimEnd();
    value = value.replace(/[, .]+$/u, "");
    if (
      /\b(?:calle|avenida|av\.?|calzada|blvd\.?|boulevard|privada|cerrada|carretera|circuito|andador)\b/iu.test(
        value,
      ) &&
      /\d/u.test(value) &&
      !/https?:\/\//iu.test(value)
    )
      add(
        match,
        "address",
        "Posible domicilio por etiqueta, vía y numeración. No se valida ubicación ni residencia.",
        value,
      );
  }
  for (const match of labelled(
    text,
    String.raw`(?:(?:mi[\t ]+)?diagn[oó]stico(?:[\t ]+del?[\t ]+paciente)?|tratamiento[\t ]+del?[\t ]+paciente|mi[\t ]+tratamiento|alergias[\t ]+del?[\t ]+paciente|mis[\t ]+alergias|expediente[\t ]+(?:cl[ií]nico|m[eé]dico))`,
    String.raw`[^\n;!?"{}]{3,180}`,
  )) {
    const value = match
      .groups!.value!.split(
        /[\t ]+(?:y[\t ]+)?(?:mi[\t ]+)?(?:correo|tel[eé]fono|contrase[nñ]a|API_KEY|token)(?:[\t ]*(?::|=|\bes\b)|[\t ]+)/iu,
      )[0]!
      .trimEnd()
      .replace(/[, .]+$/u, "");
    const clinicalContext =
      /(?:\bmi\b|\bmis\b|paciente|expediente)/iu.test(
        match[0].slice(0, match[0].length - match.groups!.value!.length),
      ) ||
      /(?:diabet|asma|alerg|hipertensi|c[aá]ncer|tumor|infecci[oó]n|fractura|depresi[oó]n|ansiedad|embarazo|VIH|insuficiencia)/iu.test(
        value,
      );
    const prefix = match[0].slice(
      0,
      match[0].length - match.groups!.value!.length,
    );
    const personalOrField = /[:=]|\b(?:mi|mis|paciente|expediente|es)\b/iu.test(
      prefix,
    );
    if (
      personalOrField &&
      clinicalContext &&
      value.length >= 3 &&
      !value.startsWith("[") &&
      !/^(?:ningun[oa]?|no[\t ]+aplica|pendiente|desconocido|sin[\t ]+datos)\b/iu.test(
        value,
      )
    )
      add(
        match,
        "health",
        "Posible información de salud o expediente por contexto clínico explícito. No se interpreta ni verifica un diagnóstico.",
        value,
      );
  }
  return findings;
};
