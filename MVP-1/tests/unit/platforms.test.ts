import { describe, it, expect } from "vitest";
import {
  PLATFORMS,
  platformForUrl,
  PLATFORM_MATCHES,
} from "../../src/domain/platforms";
import {
  createRepository,
  EVENTS_KEY,
  type StoragePort,
} from "../../src/infrastructure/storage/repository";

describe("identificación de plataformas y metadatos", () => {
  it.each(Object.entries(PLATFORMS))(
    "reconoce %s por origen exacto",
    (id, value) => {
      expect(platformForUrl(value.origin + "/app/conversation?x=1")).toBe(id);
      expect(platformForUrl(value.origin + ".evil.example/app")).toBeNull();
    },
  );
  it.each([
    "http://claude.ai/new",
    "https://www.claude.ai/new",
    "https://gemini.google.com.evil.example/app",
    "https://accounts.google.com",
    "https://claude.ai@evil.example",
    "not-a-url",
  ])("rechaza origen ajeno %s", (url) =>
    expect(platformForUrl(url)).toBeNull(),
  );
  it("limita permisos de host a los tres dominios", () => {
    expect(PLATFORM_MATCHES).toEqual([
      "https://chatgpt.com/*",
      "https://claude.ai/*",
      "https://gemini.google.com/*",
    ]);
  });
  it("conserva la plataforma asignada por el worker y no añade valores al historial", async () => {
    const data: Record<string, unknown> = {};
    const port: StoragePort = {
      get: async (key) => ({ [key]: data[key] }),
      set: async (items) => Object.assign(data, items),
      remove: async (key) => {
        delete data[key];
      },
    };
    const repository = createRepository(port);
    for (const platform of ["chatgpt", "claude", "gemini"] as const)
      await repository.appendEvents(
        [{ category: "health", action: "SANITIZE", ruleVersion: "1.2.0" }],
        platform,
      );
    expect(
      (await repository.getEvents()).map((event) => event.platform),
    ).toEqual(["chatgpt", "claude", "gemini"]);
    for (const event of await repository.getEvents())
      expect(Object.keys(event).sort()).toEqual(
        ["category", "action", "ruleVersion", "timestamp", "platform"].sort(),
      );
    expect(data[EVENTS_KEY]).toBeDefined();
  });
});
