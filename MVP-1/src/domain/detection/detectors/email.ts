import { candidate, type Detector } from "../types";

export const detectEmails: Detector = (text) => {
  // Scan bounded non-whitespace atoms before validating, avoiding retrying an unbounded prefix regex.
  const findings = [];
  for (const match of text.matchAll(/[^\s<>"«»“”(),;:]+/gu)) {
    const withoutOpening = match[0].replace(/^[\[{'`]+/u, "");
    const value = withoutOpening.replace(/[\]}'`.!?]+$/u, "");
    const start = match.index + match[0].length - withoutOpening.length;
    if (value.length > 254 || !value.includes("@")) continue;
    const parts = value.split("@");
    if (parts.length !== 2) continue;
    const [local, domain] = parts;
    if (
      !local ||
      !domain ||
      local.length > 64 ||
      local.startsWith(".") ||
      local.endsWith(".") ||
      local.includes("..")
    )
      continue;
    if (!/^[\p{L}\p{M}\p{N}.!#$%&'*+/=?^_`{|}~-]+$/iu.test(local)) continue;
    const labels = domain.split(".");
    if (labels.length < 2 || !/^[a-z]{2,63}$/iu.test(labels.at(-1) ?? ""))
      continue;
    if (
      !labels.every(
        (label) =>
          label.length <= 63 &&
          /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/iu.test(label),
      )
    )
      continue;
    findings.push(
      candidate(
        "email.format",
        "email",
        start,
        start + value.length,
        0.95,
        "medium",
        "Posible correo electrónico; no se verifica su existencia.",
      ),
    );
  }
  return findings;
};
