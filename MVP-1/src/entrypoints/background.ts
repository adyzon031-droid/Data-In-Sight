import { defineBackground } from "wxt/utils/define-background";
import { browser } from "wxt/browser";
import { createRepository } from "../infrastructure/storage/repository";
import { requestSchema } from "../infrastructure/messaging/contracts";
import { platformForUrl } from "../domain/platforms";

export default defineBackground(() => {
  const repository = createRepository(browser.storage.local);
  let queue: Promise<unknown> = Promise.resolve();
  const extensionPrefix = browser.runtime.getURL("/");
  browser.runtime.onMessage.addListener((message: unknown, sender, respond) => {
    if (sender.id !== browser.runtime.id) return;
    const parsed = requestSchema.safeParse(message);
    if (!parsed.success) {
      respond({ ok: false });
      return;
    }
    const fromPage = !!sender.url && sender.url.startsWith(extensionPrefix);
    const platform = sender.url ? platformForUrl(sender.url) : null;
    const fromSupportedSite =
      sender.frameId === 0 && !!sender.tab && platform !== null;
    const request = parsed.data;
    if (
      request.type === "DIS_RECORD_EVENTS"
        ? !fromSupportedSite
        : request.type === "DIS_GET_SETTINGS"
          ? !fromPage && !fromSupportedSite
          : !fromPage
    ) {
      respond({ ok: false });
      return;
    }
    // One worker-owned queue for read/prune/write/clear; messages never include prompts or findings.
    const operation = queue.then(async () => {
      switch (request.type) {
        case "DIS_GET_SETTINGS":
          return repository.getSettings();
        case "DIS_SAVE_SETTINGS":
          await repository.saveSettings(request.settings);
          return null;
        case "DIS_GET_EVENTS":
          return repository.getEvents();
        case "DIS_CLEAR_EVENTS":
          await repository.clearEvents();
          return null;
        case "DIS_RECORD_EVENTS":
          await repository.appendEvents(request.events, platform!);
          return null;
      }
    });
    queue = operation.catch(() => undefined);
    void operation.then(
      (value) => respond({ ok: true, value }),
      () => respond({ ok: false }),
    );
    return true;
  });
});
