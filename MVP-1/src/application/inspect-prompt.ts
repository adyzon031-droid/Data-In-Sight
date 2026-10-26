import { detect } from "../domain/detection/inspect";
import {
  DEFAULT_SETTINGS,
  MAX_INPUT_LENGTH,
  settingsSchema,
} from "../domain/policy/defaults";
import { evaluate } from "../domain/policy/evaluate";
import type { Inspection, Settings } from "../domain/policy/types";

export function inspectPrompt(
  text: string,
  settings: Settings = DEFAULT_SETTINGS,
): Inspection {
  const validated = settingsSchema.parse(settings);
  if (text.length > MAX_INPUT_LENGTH) {
    return {
      findings: [],
      decision: "BLOCK",
      canContinue: false,
      analysisError: "INPUT_TOO_LARGE",
    };
  }
  return evaluate(detect(text, validated.phoneRegion), validated);
}
