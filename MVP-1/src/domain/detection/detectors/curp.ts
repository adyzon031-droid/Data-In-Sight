import { plausibleDate } from "../validators/mx-date";
import { candidate, type Detector } from "../types";

const STATES = new Set(
  "AS BC BS CC CL CM CS CH DF DG GT GR HG JC MC MN MS NT NL OC PL QT QR SP SL SR TC TS TL VZ YN ZS NE".split(
    " ",
  ),
);
export const detectCurps: Detector = (text) => {
  const findings = [];
  for (const match of text.matchAll(
    /(?<![\p{L}\p{N}_])[A-Z][AEIOUX][A-Z]{2}\d{6}[HM][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[A-Z0-9]\d(?![\p{L}\p{N}_])/giu,
  )) {
    const value = match[0].toUpperCase();
    const century = /\d/u.test(value[16] ?? "") ? 1900 : 2000;
    if (
      !STATES.has(value.slice(11, 13)) ||
      !plausibleDate(value.slice(4, 10), century)
    )
      continue;
    findings.push(
      candidate(
        "curp.plausible",
        "curp",
        match.index,
        match.index + value.length,
        0.9,
        "high",
        "Posible CURP por estructura, fecha y entidad. No se verifica dígito ni registro oficial.",
      ),
    );
  }
  return findings;
};
