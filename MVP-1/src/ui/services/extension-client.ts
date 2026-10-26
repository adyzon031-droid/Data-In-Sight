import { PLATFORMS, platformForUrl } from "../../domain/platforms";
import { browser } from "wxt/browser";
import {
  getSettings,
  saveSettings,
  getEvents,
  clearEvents,
} from "../../infrastructure/messaging/client";
import { tabStateSchema } from "../../infrastructure/messaging/contracts";
import type { UiClient } from "../types";

export const extensionClient: UiClient = {
  getSettings,
  saveSettings,
  getEvents,
  clearEvents,
  environment: "extension",
  async getTabState() {
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    const platform = tab?.url ? platformForUrl(tab.url) : null;
    if (!tab?.id || !platform)
      return {
        platform: null,
        status: "unsupported",
        reason: "Abre un editor compatible de ChatGPT, Claude o Gemini.",
      };
    try {
      const state = await Promise.race([
        browser.tabs.sendMessage(
          tab.id,
          { type: "DIS_GET_STATUS" },
          { frameId: 0 },
        ),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("TIMEOUT")), 1500),
        ),
      ]);
      const parsed = tabStateSchema.parse(state);
      if (parsed.platform !== platform) throw new Error("PLATFORM_MISMATCH");
      return parsed;
    } catch {
      return {
        platform,
        status: "unavailable",
        reason: `Actualiza la pestaña de ${PLATFORMS[platform].name} para conectar la extensión.`,
      };
    }
  },
  async openOptions() {
    await browser.runtime.openOptionsPage();
  },
};
