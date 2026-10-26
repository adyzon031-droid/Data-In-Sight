import { candidate, type Candidate, type Detector } from "../types";

function luhn(digits: string): boolean {
  let sum = 0;
  for (
    let i = digits.length - 1, double = false;
    i >= 0;
    i--, double = !double
  ) {
    let digit = Number(digits[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}
function clabeChecksum(digits: string): boolean {
  const weights = [3, 7, 1];
  const sum = [...digits.slice(0, 17)].reduce(
    (total, digit, i) => total + Number(digit) * weights[i % 3]!,
    0,
  );
  return (10 - (sum % 10)) % 10 === Number(digits[17]);
}
// Common card ranges only. Explicit card context also permits other 13–19 digit PANs.
function commonCard(digits: string): boolean {
  return (
    /^(?:4\d{12}(?:\d{3})?(?:\d{3})?|5[1-5]\d{14}|3[47]\d{13}|6(?:011\d{12}|5\d{14}))$/u.test(
      digits,
    ) ||
    (digits.length === 16 &&
      Number(digits.slice(0, 4)) >= 2221 &&
      Number(digits.slice(0, 4)) <= 2720)
  );
}

export const detectFinancialMx: Detector = (text) => {
  const findings: Candidate[] = [];
  // Scan whole numeric runs: never accept a valid substring of a longer identifier.
  for (const match of text.matchAll(/\d(?:[ \u00a0\u202f-]?\d)*/gu)) {
    const start = match.index;
    const end = start + match[0].length;
    if (
      /[\p{L}\p{N}_]/u.test(text[start - 1] ?? "") ||
      /[\p{L}\p{N}_]/u.test(text[end] ?? "")
    )
      continue;
    const digits = match[0].replace(/[ \u00a0\u202f-]/gu, "");
    if (/^(\d)\1+$/u.test(digits)) continue;
    const before = text.slice(Math.max(0, start - 80), start);
    const clabeContext =
      /\bclabe(?:\s+interbancaria)?\s*(?::|=|es)?\s*["']?$/iu.test(before);
    const cardContext =
      /(?:\btarjeta(?:\s+(?:bancaria|de\s+cr[eé]dito|de\s+d[eé]bito))?|\bcard(?:\s+number)?|\bpan)\s*(?::|=|es)?\s*["']?$/iu.test(
        before,
      );
    const nssContext =
      /(?:\bnss|\b(?:n[uú]mero\s+(?:de[l]?\s+)?)?(?:seguridad|seguro)\s+social)\s*(?::|=|es)?\s*["']?$/iu.test(
        before,
      );
    if (digits.length === 11 && nssContext) {
      findings.push(
        candidate(
          "nss.mx.context",
          "nss",
          start,
          end,
          0.9,
          "high",
          "Posible NSS por longitud y contexto. No se verifica dígito de control ni registro en el IMSS.",
        ),
      );
    } else if (
      digits.length === 18 &&
      !cardContext &&
      !nssContext &&
      clabeChecksum(digits)
    ) {
      findings.push(
        candidate(
          "clabe.mx.checksum",
          "clabe",
          start,
          end,
          0.94,
          "high",
          "Posible CLABE de 18 dígitos con control correcto. No se verifica banco, existencia ni titular.",
        ),
      );
    } else if (
      digits.length >= 13 &&
      digits.length <= 19 &&
      !clabeContext &&
      !nssContext &&
      (cardContext || commonCard(digits)) &&
      luhn(digits)
    ) {
      findings.push(
        candidate(
          "card.luhn",
          "card",
          start,
          end,
          0.92,
          "high",
          "Posible tarjeta por formato y comprobación Luhn. No se verifica emisor, vigencia ni titular.",
        ),
      );
    }
  }
  return findings;
};
