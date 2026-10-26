import { plausibleDate } from "../validators/mx-date";
import { candidate, type Detector } from "../types";

export const detectRfcs: Detector = (text) => {
  const findings = [];
  for (const match of text.matchAll(
    /(?<![\p{L}\p{N}_])[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}(?![\p{L}\p{N}_])/giu,
  )) {
    const value = match[0];
    if (!plausibleDate(value.slice(value.length - 9, value.length - 3)))
      continue;
    findings.push(
      candidate(
        "rfc.plausible",
        "rfc",
        match.index,
        match.index + value.length,
        0.85,
        "high",
        "Posible RFC por formato y fecha. No se verifica homoclave ni inscripción en el SAT.",
      ),
    );
  }
  return findings;
};
