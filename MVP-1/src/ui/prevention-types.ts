import type { Inspection, ProtectionChange } from "../application";
export type PreventionAction = "cancel" | "edit" | "protect" | "continue";
export interface PreventionViewModel {
  inspection: Inspection;
  previewText?: string;
  changes?: ProtectionChange[];
  simulation?: boolean;
}
