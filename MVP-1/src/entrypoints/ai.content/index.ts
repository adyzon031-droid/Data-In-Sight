import { defineContentScript } from "wxt/utils/define-content-script";
import { browser } from "wxt/browser";
import { createPlatformAdapter } from "../../adapters/registry";
import { PLATFORM_MATCHES } from "../../domain/platforms";
import { createSubmissionController } from "../../application/submission-controller";
import {
  getSettings,
  recordEvents,
} from "../../infrastructure/messaging/client";
import { statusRequestSchema } from "../../infrastructure/messaging/contracts";
import { SETTINGS_KEY } from "../../infrastructure/storage/repository";
import { mountPrevention } from "../../ui/mount-prevention";
import type { TabState } from "../../ui/types";

export default defineContentScript({
  matches: PLATFORM_MATCHES,
  runAt: "document_start",
  main(ctx) {
    const adapter = createPlatformAdapter();
    if (!adapter) return;
    let theme = "system";
    let indicator: HTMLElement | undefined;
    let indicatorText: HTMLElement | undefined;
    let priorState = "";
    const uiHosts = new Set<HTMLElement>();
    let settingsLoad = 0;
    function showStatus(state: TabState) {
      if (!document.body) return;
      if (!indicator?.isConnected) {
        indicator = document.createElement("div");
        indicator.dataset.disStatus = "";
        indicator.style.setProperty("all", "initial", "important");
        indicator.style.setProperty("position", "fixed", "important");
        indicator.style.setProperty("bottom", "14px", "important");
        indicator.style.setProperty("left", "14px", "important");
        indicator.style.setProperty("z-index", "2147483646", "important");
        const root = indicator.attachShadow({ mode: "open" });
        const style = document.createElement("style");
        style.textContent =
          ':host{all:initial}div{font:11px/1.5 system-ui,sans-serif;background:#10232b;color:#dff5eb;border:1px solid #42605b;border-radius:9px;padding:8px 12px;box-shadow:0 4px 18px #001c2430;max-width:260px}div[data-state="unavailable"]{border-color:#aa8644;color:#ffe3a7}';
        indicatorText = document.createElement("div");
        indicatorText.setAttribute("role", "status");
        root.append(style, indicatorText);
        document.body.append(indicator);
        priorState = "";
      }
      const fingerprint = JSON.stringify(state);
      if (priorState === fingerprint || !indicatorText) return;
      priorState = fingerprint;
      indicatorText.dataset.state = state.status;
      indicatorText.title = state.reason;
      indicatorText.textContent = `Data In Sight · ${state.status === "active" ? (state.reason.includes("registro") ? "Revisión activa · Sin registro" : "Revisión activa") : "Protección no disponible"}`;
    }
    const controller = createSubmissionController(adapter, {
      record: recordEvents,
      onState: showStatus,
      openUi(model, action) {
        const host = document.createElement("div");
        host.dataset.disPrevention = "";
        host.dataset.theme = theme;
        host.style.setProperty("all", "initial", "important");
        document.body.append(host);
        uiHosts.add(host);
        const mounted = mountPrevention(
          host.attachShadow({ mode: "open" }),
          model,
          action,
        );
        return {
          withEditorActive: mounted.withEditorActive,
          update: mounted.update,
          destroy() {
            mounted.destroy();
            host.remove();
            uiHosts.delete(host);
          },
        };
      },
    });
    async function loadSettings() {
      const generation = ++settingsLoad;
      controller.setSettings(undefined);
      try {
        const settings = await getSettings();
        if (generation !== settingsLoad || ctx.isInvalid) return;
        theme = settings.theme;
        controller.setSettings(settings);
      } catch {
        if (generation === settingsLoad && !ctx.isInvalid)
          controller.settingsFailed();
      }
    }
    const messageListener: Parameters<
      typeof browser.runtime.onMessage.addListener
    >[0] = (message, sender, respond) => {
      if (
        sender.id === browser.runtime.id &&
        statusRequestSchema.safeParse(message).success
      )
        respond(controller.state());
    };
    const storageListener: Parameters<
      typeof browser.storage.onChanged.addListener
    >[0] = (changes, area) => {
      if (area === "local" && SETTINGS_KEY in changes) void loadSettings();
    };
    browser.runtime.onMessage.addListener(messageListener);
    browser.storage.onChanged.addListener(storageListener);
    void loadSettings();
    ctx.onInvalidated(() => {
      settingsLoad++;
      controller.destroy();
      indicator?.remove();
      uiHosts.forEach((host) => host.remove());
      uiHosts.clear();
      browser.runtime.onMessage.removeListener(messageListener);
      browser.storage.onChanged.removeListener(storageListener);
    });
  },
});
