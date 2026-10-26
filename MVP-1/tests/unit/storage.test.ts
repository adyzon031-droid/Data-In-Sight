import { describe, expect, it } from "vitest";
import {
  createRepository,
  EVENTS_KEY,
  SETTINGS_KEY,
  type StoragePort,
} from "../../src/infrastructure/storage/repository";
import { DEFAULT_SETTINGS } from "../../src/application";

function repository(initial: Record<string, unknown> = {}) {
  const data = structuredClone(initial);
  const port: StoragePort = {
    async get(key) {
      return { [key]: data[key] };
    },
    async set(items) {
      Object.assign(data, structuredClone(items));
    },
    async remove(key) {
      delete data[key];
    },
  };
  return { ...createRepository(port), data };
}
describe("almacenamiento mínimo de interfaz", () => {
  it("registro futuro desactivado no escribe eventos y el registro activo conserva solo metadatos", async () => {
    const store = repository();
    await store.saveSettings({ ...DEFAULT_SETTINGS, recordEvents: false });
    const event = {
      category: "email",
      action: "WARN",
      ruleVersion: "1.0.0",
    } as const;
    await store.appendEvents([event]);
    expect(store.data[EVENTS_KEY]).toBeUndefined();
    await store.saveSettings({ ...DEFAULT_SETTINGS, recordEvents: true });
    await store.appendEvents([event]);
    const events = await store.getEvents();
    expect(events).toHaveLength(1);
    expect(Object.keys(events[0]!).sort()).toEqual(
      ["timestamp", "platform", "category", "action", "ruleVersion"].sort(),
    );
  });
  it("retiene como máximo 200 eventos y rechaza contenido extra en la escritura", async () => {
    const store = repository();
    const event = {
      category: "token",
      action: "BLOCK",
      ruleVersion: "1.0.0",
    } as const;
    for (let batch = 0; batch < 5; batch++)
      await store.appendEvents(Array.from({ length: 50 }, () => event));
    expect(await store.getEvents()).toHaveLength(200);
    await expect(
      store.appendEvents([{ ...event, prompt: "no-persistir" }] as never),
    ).rejects.toThrow();
    expect(JSON.stringify(store.data)).not.toContain("no-persistir");
  });
  it("devuelve ajustes iniciales sin escribir contenido", async () => {
    const store = repository();
    expect(await store.getSettings()).toEqual(DEFAULT_SETTINGS);
    expect(store.data).toEqual({});
  });
  it("persiste solo ajustes permitidos y rechaza extras", async () => {
    const store = repository();
    await store.saveSettings({ ...DEFAULT_SETTINGS, theme: "dark" });
    expect(await store.getSettings()).toEqual({
      ...DEFAULT_SETTINGS,
      theme: "dark",
    });
    await expect(
      store.saveSettings({
        ...DEFAULT_SETTINGS,
        prompt: "no guardar",
      } as never),
    ).rejects.toThrow();
    expect(JSON.stringify(store.data)).not.toContain("no guardar");
  });
  it("elimina eventos vencidos y futuros al leer", async () => {
    const base = {
      platform: "chatgpt",
      category: "email",
      action: "WARN",
      ruleVersion: "1.0.0",
    };
    const now = { ...base, timestamp: new Date().toISOString() };
    const store = repository({
      [EVENTS_KEY]: [
        now,
        { ...base, timestamp: "2020-01-01T00:00:00.000Z" },
        { ...base, timestamp: "2099-01-01T00:00:00.000Z" },
      ],
    });
    expect(await store.getEvents()).toEqual([now]);
    expect(store.data[EVENTS_KEY]).toEqual([now]);
  });
  it("rechaza eventos con contenido sensible adicional", async () => {
    const store = repository({
      [EVENTS_KEY]: [
        {
          timestamp: new Date().toISOString(),
          platform: "chatgpt",
          category: "email",
          action: "WARN",
          ruleVersion: "1.0.0",
          text: "prompt",
        },
      ],
    });
    await expect(store.getEvents()).rejects.toThrow();
  });
  it("borrar eventos conserva ajustes", async () => {
    const store = repository({
      [EVENTS_KEY]: [],
      [SETTINGS_KEY]: DEFAULT_SETTINGS,
    });
    await store.clearEvents();
    expect(store.data).toEqual({ [SETTINGS_KEY]: DEFAULT_SETTINGS });
  });
  it("propaga fallos de almacenamiento sin fingir guardado", async () => {
    const store = createRepository({
      async get() {
        throw new Error("not available");
      },
      async set() {
        throw new Error("quota");
      },
      async remove() {
        throw new Error("not available");
      },
    });
    await expect(store.getSettings()).rejects.toThrow("not available");
    await expect(store.saveSettings({ ...DEFAULT_SETTINGS })).rejects.toThrow(
      "quota",
    );
  });
});
