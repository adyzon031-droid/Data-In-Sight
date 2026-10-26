import { browser } from "wxt/browser";
import { settingsSchema } from "../../domain/policy/defaults";
import { localEventSchema } from "../storage/repository";
import { z } from "zod";
import type { Settings } from "../../application";
import type { EventInput } from "./contracts";

const envelope = z
  .object({ ok: z.boolean(), value: z.unknown().optional() })
  .strict();
async function request(message: unknown) {
  const response = envelope.parse(await browser.runtime.sendMessage(message));
  if (!response.ok) throw new Error("DIS_SERVICE_UNAVAILABLE");
  return response.value;
}
export async function getSettings() {
  return settingsSchema.parse(await request({ type: "DIS_GET_SETTINGS" }));
}
export async function saveSettings(settings: Settings) {
  await request({
    type: "DIS_SAVE_SETTINGS",
    settings: settingsSchema.parse(settings),
  });
}
export async function getEvents() {
  return z
    .array(localEventSchema)
    .max(200)
    .parse(await request({ type: "DIS_GET_EVENTS" }));
}
export async function clearEvents() {
  await request({ type: "DIS_CLEAR_EVENTS" });
}
export async function recordEvents(events: EventInput[]) {
  if (events.length) await request({ type: "DIS_RECORD_EVENTS", events });
}
