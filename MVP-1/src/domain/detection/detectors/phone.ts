import {
  findPhoneNumbersInText,
  type CountryCode,
} from "libphonenumber-js/max";
import { candidate, type Candidate } from "../types";

/** International prefixes are independent of the region used for bare national numbers. */
export function detectPhones(
  text: string,
  region: CountryCode = "MX",
): Candidate[] {
  const findings: Candidate[] = [];
  // Equal-length normalization preserves UTF-16 offsets, including the original 00 prefix.
  const normalized = text.replace(
    /(?<![\p{L}\p{N}_])00(?=\d)/gu,
    (prefix, offset: number) =>
      /\d[ ().-]*$/u.test(text.slice(Math.max(0, offset - 32), offset))
        ? prefix
        : "+ ",
  );
  for (const match of findPhoneNumbersInText(normalized, region)) {
    if (!match.number.isValid()) continue;
    const start = match.startsAt;
    let end = match.endsAt;
    const international = /^(?:\+|00)/u.test(text.slice(start, end));
    const before = text.slice(Math.max(0, start - 80), start);
    // Ambiguous national sequences explicitly described as identifiers stay identifiers.
    if (
      !international &&
      /\b(?:folio|pedido|referencia|factura|orden|c[oó]digo|expediente|nss|ine|cic|clabe|tarjeta|card|id)\s*(?:(?:n[uú]mero|num|es|el|de)\s*)*[:=#-]?\s*["']?$/iu.test(
        before,
      )
    )
      continue;
    if (
      /[\p{L}\p{N}_]/u.test(text[start - 1] ?? "") ||
      /[\p{L}\p{N}_]/u.test(text[end] ?? "")
    )
      continue;
    // Never take a plausible phone-sized fragment out of a longer numeric sequence.
    if (/\d[ ().-]*$/u.test(before) || /^[ ().-]*\d/u.test(text.slice(end)))
      continue;
    // The library recognizes common extension formats; also cover Spanish office aliases.
    const extension =
      /^[\t ]*(?:ext(?:ensi[oó]n)?\.?|anexo|interno|x|#)[\t ]*[:.]?[\t ]*\d{1,6}(?!\d)/iu.exec(
        text.slice(end),
      );
    if (extension) end += extension[0].length;
    findings.push(
      candidate(
        international ? "phone.international" : "phone.national",
        "phone",
        start,
        end,
        international ? 0.95 : 0.88,
        "medium",
        international
          ? "Posible teléfono internacional por prefijo y plan de numeración, incluida su extensión. No se verifica titular ni servicio activo."
          : `Posible teléfono nacional según la región ${region}, sin necesidad de etiqueta. No se verifica titular ni servicio activo.`,
      ),
    );
  }
  return findings;
}
