import type { CountryCode } from "libphonenumber-js";
import type { Category, Finding } from "../detection/types";

export interface Settings {
  schemaVersion: 1;
  theme: "light" | "dark" | "system";
  warnOnPersonalData: boolean;
  recordEvents: boolean;
  retentionDays: number;
  phoneRegion: CountryCode;
}

export type Decision = "ALLOW" | "WARN" | "BLOCK";
export interface Inspection {
  findings: Finding[];
  decision: Decision;
  canContinue: boolean;
  analysisError?: "INPUT_TOO_LARGE";
}
/** Transient review only. Secret values are never included. Do not persist. */
export interface ProtectionChange {
  id: string;
  category: Category;
  before: string;
  after: string;
  concealed: boolean;
}
export interface ProtectionResult {
  changes: ProtectionChange[];
  text: string;
  replacementCount: number;
  inspection: Inspection;
}
