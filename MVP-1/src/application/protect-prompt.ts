import { DEFAULT_SETTINGS } from "../domain/policy/defaults";
import type { ProtectionResult, Settings } from "../domain/policy/types";
import { replaceSpansWithReport } from "../domain/sanitization/replace-spans";
import { inspectPrompt } from "./inspect-prompt";

export function protectPrompt(
  text: string,
  settings: Settings = DEFAULT_SETTINGS,
): ProtectionResult {
  const before = inspectPrompt(text, settings);
  if (before.analysisError)
    return { text, replacementCount: 0, inspection: before, changes: [] };
  const result = replaceSpansWithReport(text, before.findings);
  return {
    text: result.text,
    changes: result.replacements.map((span) => {
      const concealed = ["password", "api-key", "token"].includes(
        span.category,
      );
      return {
        id: span.id,
        category: span.category,
        before: concealed ? "••••••••" : text.slice(span.start, span.end),
        after: span.placeholder,
        concealed,
      };
    }),
    replacementCount: before.findings.length,
    inspection: inspectPrompt(result.text, settings),
  };
}
