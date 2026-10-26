import type { Category, Settings } from "../application";

import type { Platform } from "../domain/platforms";
export type { Platform } from "../domain/platforms";
export interface TabState {
  platform: Platform | null;
  status: "active" | "unsupported" | "unavailable";
  reason: string;
}
export interface LocalEvent {
  timestamp: string;
  platform: Platform;
  category: Category;
  action: "WARN" | "BLOCK" | "SANITIZE" | "CONTINUE" | "CANCEL";
  ruleVersion: string;
}
export interface UiClient {
  getSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<void>;
  getTabState(): Promise<TabState>;
  getEvents(): Promise<LocalEvent[]>;
  clearEvents(): Promise<void>;
  openOptions(): Promise<void>;
  environment: "extension" | "preview";
}
