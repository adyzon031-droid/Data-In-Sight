import { createApp } from "vue";
import Popup from "../src/entrypoints/popup/App.vue";
import Options from "../src/entrypoints/options/App.vue";
import { DEFAULT_SETTINGS, settingsSchema } from "../src/application";
import { createUiState, UI_STATE } from "../src/ui/services/state";
import type { UiClient } from "../src/ui/types";
import "../src/ui/styles/base.css";

// Development-only provider. No fallback from extension storage to a silent mock.
let settings = { ...DEFAULT_SETTINGS };
const requestedTheme = new URLSearchParams(location.search).get("theme");
if (
  requestedTheme === "light" ||
  requestedTheme === "dark" ||
  requestedTheme === "system"
) {
  settings.theme = requestedTheme;
}
const client: UiClient = {
  environment: "preview",
  async getSettings() {
    return { ...settings };
  },
  async saveSettings(next) {
    settings = settingsSchema.parse(next);
  },
  async getEvents() {
    return [];
  },
  async clearEvents() {},
  async getTabState() {
    return {
      platform: null,
      status: "unavailable",
      reason: "Vista previa sin integración.",
    };
  },
  async openOptions() {
    window.location.href = "/";
  },
};
const isPopup = new URLSearchParams(location.search).get("view") === "popup";
createApp(isPopup ? Popup : Options)
  .provide(UI_STATE, createUiState(client))
  .mount("#app");
