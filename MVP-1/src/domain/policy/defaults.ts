import { isSupportedCountry, type CountryCode } from "libphonenumber-js";
import { z } from "zod";
import type { Settings } from "./types";

export const MAX_INPUT_LENGTH = 20_000;
export const settingsSchema = z
  .object({
    schemaVersion: z.literal(1),
    theme: z.enum(["light", "dark", "system"]),
    warnOnPersonalData: z.boolean(),
    recordEvents: z.boolean(),
    retentionDays: z.number().int().min(1).max(30),
    phoneRegion: z
      .custom<CountryCode>(
        (value) => typeof value === "string" && isSupportedCountry(value),
      )
      .default("MX"),
  })
  .strict();

export const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze({
  schemaVersion: 1,
  theme: "system",
  warnOnPersonalData: true,
  recordEvents: true,
  retentionDays: 7,
  phoneRegion: "MX",
});
