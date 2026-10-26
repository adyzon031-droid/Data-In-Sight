import { candidate, type Candidate, type Detector } from "../types";

// Only placeholders produced by this engine are exempt from assignment detection.
const PLACEHOLDER =
  /^\[(?:CORREO|TELEFONO|CURP|RFC|CLABE|TARJETA|NSS|INE|PASAPORTE|LICENCIA|NOMBRE|DOMICILIO|NACIMIENTO|SALUD|CREDENCIAL)_\d+\]$/u;

export const detectSecrets: Detector = (text) => {
  const findings: Candidate[] = [];
  const add = (
    rule: string,
    category: "password" | "api-key" | "token",
    start: number,
    end: number,
  ) => {
    if (PLACEHOLDER.test(text.slice(start, end))) return;
    findings.push(
      candidate(
        rule,
        category,
        start,
        end,
        0.98,
        "critical",
        "Posible credencial por formato reconocible o asignación explícita. Elimina o sustituye el valor antes de enviar.",
      ),
    );
  };
  const formats: Array<[RegExp, string, "api-key" | "token"]> = [
    [
      /(?<![A-Za-z0-9_])gh[pousr]_[A-Za-z0-9]{36}(?![A-Za-z0-9_])/gu,
      "secret.github-classic",
      "token",
    ],
    [
      /(?<![A-Za-z0-9_])AKIA[A-Z0-9]{16}(?![A-Za-z0-9_])/gu,
      "secret.aws-access-id",
      "api-key",
    ],
    [
      /(?<![A-Za-z0-9_-])sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,256}(?![A-Za-z0-9_-])/gu,
      "secret.sk-prefix",
      "api-key",
    ],
  ];
  for (const [regex, rule, category] of formats) {
    for (const match of text.matchAll(regex))
      add(rule, category, match.index, match.index + match[0].length);
  }
  // Compact signed JWT shape (RFC 7519). Decode locally only to reject random dotted text.
  // This recognizes a possible secret; it never authenticates the signature or claims.
  for (const match of text.matchAll(
    /(?<![A-Za-z0-9_.-])eyJ[A-Za-z0-9_-]{5,2045}\.[A-Za-z0-9_-]{2,8192}\.[A-Za-z0-9_-]{16,2048}(?![A-Za-z0-9_-]|\.[A-Za-z0-9_-])/gu,
  )) {
    try {
      const [headerPart, payloadPart] = match[0].split(".");
      const decode = (part: string): unknown =>
        JSON.parse(atob(part.replace(/-/gu, "+").replace(/_/gu, "/")));
      const header = decode(headerPart!);
      const payload = decode(payloadPart!);
      if (
        header &&
        typeof header === "object" &&
        !Array.isArray(header) &&
        "alg" in header &&
        typeof header.alg === "string" &&
        header.alg &&
        header.alg !== "none" &&
        payload &&
        typeof payload === "object" &&
        !Array.isArray(payload)
      )
        add("secret.jwt", "token", match.index, match.index + match[0].length);
    } catch {
      // A dotted string that is not a JSON JWT is not sufficient evidence.
    }
  }
  // Explicit key/value context: shell/env, JSON and simple Spanish/English assignments.
  const assignments =
    /(?<![\p{L}\p{N}_])(?:[A-Z][A-Z0-9]{0,24}_){0,3}(?:password|passwd|pwd|contraseña|contrasena|api[_ -]?key|access[_ -]?token|auth[_ -]?token|secret|token)["']?\s*(?:[:=]|\bes\b|\bis\b)\s*(?:"((?:\\[\s\S]|[^"\\])+)"?|'((?:\\[\s\S]|[^'\\])+)'?|([^\s"'`,;<>]+))/giu;
  for (const match of text.matchAll(assignments)) {
    const value = match[1] ?? match[2] ?? match[3];
    if (!value) continue;
    const offset = match[0].lastIndexOf(value);
    const label = match[0].slice(0, offset);
    const category = /password|passwd|pwd|contraseña|contrasena/iu.test(label)
      ? "password"
      : /api[_ -]?key/iu.test(label)
        ? "api-key"
        : "token";
    add(
      `secret.context.${category}`,
      category,
      match.index + offset,
      match.index + offset + value.length,
    );
  }
  for (const match of text.matchAll(
    /\bBearer[ \t]+([A-Za-z0-9._~+/-]{12,}={0,2})/giu,
  )) {
    const value = match[1];
    if (value)
      add(
        "secret.bearer",
        "token",
        match.index + match[0].length - value.length,
        match.index + match[0].length,
      );
  }
  return findings;
};
