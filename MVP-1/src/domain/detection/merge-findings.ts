import { RULE_VERSION, type Candidate, type Finding } from "./types";

const RANK = { medium: 1, high: 2, critical: 3 } as const;

export function mergeFindings(candidates: Candidate[]): Finding[] {
  const ordered = [...candidates].sort(
    (a, b) =>
      RANK[b.severity] - RANK[a.severity] ||
      b.confidence - a.confidence ||
      b.end - b.start - (a.end - a.start) ||
      a.start - b.start ||
      a.ruleId.localeCompare(b.ruleId, "en"),
  );
  const accepted: Candidate[] = [];
  for (const candidate of ordered) {
    if (
      !accepted.some((f) => candidate.start < f.end && candidate.end > f.start)
    )
      accepted.push(candidate);
  }
  return accepted
    .sort((a, b) => a.start - b.start)
    .map((f, index) => ({
      ...f,
      id: `finding-${index + 1}`,
      ruleVersion: RULE_VERSION,
    }));
}
