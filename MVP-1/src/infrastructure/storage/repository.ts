import type { Platform } from "../../domain/platforms";
import { z } from "zod";
import {
  DEFAULT_SETTINGS,
  settingsSchema,
  type Settings,
} from "../../application";
import type { LocalEvent } from "../../ui/types";
import { eventInputSchema, type EventInput } from "../messaging/contracts";

export const SETTINGS_KEY = "dis.settings.v1";
export const EVENTS_KEY = "dis.events.v1";
export const localEventSchema = z
  .object({
    timestamp: z.iso.datetime(),
    platform: z.enum(["chatgpt", "claude", "gemini"]),
    category: z.enum([
      "email",
      "phone",
      "curp",
      "rfc",
      "clabe",
      "card",
      "nss",
      "ine",
      "passport",
      "license",
      "name",
      "address",
      "birth-date",
      "health",
      "password",
      "api-key",
      "token",
    ]),
    action: z.enum(["WARN", "BLOCK", "SANITIZE", "CONTINUE", "CANCEL"]),
    ruleVersion: z.string().regex(/^\d+\.\d+\.\d+$/u),
  })
  .strict();

export interface StoragePort {
  get(key: string): Promise<Record<string, unknown>>;
  set(items: Record<string, unknown>): Promise<unknown>;
  remove(key: string): Promise<unknown>;
}

export function createRepository(storage: StoragePort) {
  async function getSettings(): Promise<Settings> {
    const stored = (await storage.get(SETTINGS_KEY))[SETTINGS_KEY];
    return stored === undefined
      ? { ...DEFAULT_SETTINGS }
      : settingsSchema.parse(stored);
  }
  async function saveSettings(settings: Settings) {
    await storage.set({ [SETTINGS_KEY]: settingsSchema.parse(settings) });
  }
  async function getEvents(): Promise<LocalEvent[]> {
    const settings = await getSettings();
    const stored = (await storage.get(EVENTS_KEY))[EVENTS_KEY];
    if (stored === undefined) return [];
    const events = z.array(localEventSchema).max(200).parse(stored);
    const oldest = Date.now() - settings.retentionDays * 86_400_000;
    const now = Date.now();
    const retained = events.filter((event) => {
      const time = Date.parse(event.timestamp);
      return time >= oldest && time <= now;
    });
    if (retained.length !== events.length)
      await storage.set({ [EVENTS_KEY]: retained });
    return retained;
  }
  async function clearEvents() {
    await storage.remove(EVENTS_KEY);
  }
  async function appendEvents(
    input: EventInput[],
    platform: Platform = "chatgpt",
  ) {
    const validated = z.array(eventInputSchema).min(1).max(50).parse(input);
    const settings = await getSettings();
    if (!settings.recordEvents) return;
    const events = await getEvents();
    const timestamp = new Date().toISOString();
    const added = validated.map((event) => ({
      ...event,
      timestamp,
      platform,
    }));
    await storage.set({ [EVENTS_KEY]: [...events, ...added].slice(-200) });
  }
  return { getSettings, saveSettings, getEvents, clearEvents, appendEvents };
}
