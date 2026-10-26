import type { Finding } from "../detection/types";
import type { Inspection, Settings } from "./types";

export function evaluate(findings: Finding[], settings: Settings): Inspection {
  if (findings.some((f) => f.severity === "critical" && f.confidence >= 0.9)) {
    return { findings, decision: "BLOCK", canContinue: false };
  }
  const warn = findings.some(
    (f) =>
      ["password", "api-key", "token"].includes(f.category) ||
      settings.warnOnPersonalData,
  );
  return { findings, decision: warn ? "WARN" : "ALLOW", canContinue: warn };
}
