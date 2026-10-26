export type Category =
  | "email"
  | "phone"
  | "curp"
  | "rfc"
  | "clabe"
  | "card"
  | "nss"
  | "ine"
  | "passport"
  | "license"
  | "name"
  | "address"
  | "birth-date"
  | "health"
  | "password"
  | "api-key"
  | "token";
export type Severity = "medium" | "high" | "critical";

/** Offsets use JavaScript UTF-16: start inclusive, end exclusive. No original values. */
export interface Finding {
  id: string;
  ruleId: string;
  ruleVersion: string;
  category: Category;
  start: number;
  end: number;
  confidence: number;
  severity: Severity;
  explanation: string;
}

export interface Candidate extends Omit<Finding, "id" | "ruleVersion"> {}
export type Detector = (text: string) => Candidate[];
export const RULE_VERSION = "1.3.1";

export function candidate(
  ruleId: string,
  category: Category,
  start: number,
  end: number,
  confidence: number,
  severity: Severity,
  explanation: string,
): Candidate {
  return { ruleId, category, start, end, confidence, severity, explanation };
}
