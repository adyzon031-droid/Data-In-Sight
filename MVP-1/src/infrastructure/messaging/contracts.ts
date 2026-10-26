import { z } from "zod";
import { settingsSchema } from "../../domain/policy/defaults";

export const actionSchema = z.enum([
  "WARN",
  "BLOCK",
  "SANITIZE",
  "CONTINUE",
  "CANCEL",
]);
export const eventInputSchema = z
  .object({
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
    action: actionSchema,
    ruleVersion: z.string().regex(/^\d+\.\d+\.\d+$/u),
  })
  .strict();
export type EventInput = z.infer<typeof eventInputSchema>;
export const requestSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("DIS_GET_SETTINGS") }).strict(),
  z
    .object({ type: z.literal("DIS_SAVE_SETTINGS"), settings: settingsSchema })
    .strict(),
  z.object({ type: z.literal("DIS_GET_EVENTS") }).strict(),
  z.object({ type: z.literal("DIS_CLEAR_EVENTS") }).strict(),
  z
    .object({
      type: z.literal("DIS_RECORD_EVENTS"),
      events: z.array(eventInputSchema).min(1).max(50),
    })
    .strict(),
]);
export const statusRequestSchema = z
  .object({ type: z.literal("DIS_GET_STATUS") })
  .strict();
export const tabStateSchema = z
  .object({
    platform: z.enum(["chatgpt", "claude", "gemini"]).nullable(),
    status: z.enum(["active", "unsupported", "unavailable"]),
    reason: z.string().max(300),
  })
  .strict();
