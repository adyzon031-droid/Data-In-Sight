import { createApp, h, shallowRef } from "vue";
import PreventionDialog from "./components/PreventionDialog.vue";
import styles from "./styles/base.css?inline";
import type { PreventionAction, PreventionViewModel } from "./prevention-types";
import { ensureUiFonts, resolveStyleAssets } from "./services/assets";
export type { PreventionAction, PreventionViewModel } from "./prevention-types";

/** UI bridge only. The integration must revalidate text and authorization before sending. */
export function mountPrevention(
  host: ShadowRoot,
  model: PreventionViewModel,
  onAction: (action: PreventionAction) => void,
) {
  const state = shallowRef(model);
  const style = document.createElement("style");
  style.textContent = resolveStyleAssets(styles);
  void ensureUiFonts().catch(() => undefined); // Local system-font fallback if assets cannot load.
  const container = document.createElement("div");
  host.append(style, container);
  const app = createApp({
    render: () => h(PreventionDialog, { ...state.value, onAction }),
  });
  app.mount(container);
  let destroyed = false;
  return {
    withEditorActive(operation: () => boolean) {
      const dialog = container.querySelector<HTMLDialogElement>("dialog");
      const wasOpen = dialog?.open;
      if (wasOpen) dialog.close();
      try {
        return operation();
      } finally {
        if (wasOpen && !destroyed && dialog.isConnected) dialog.showModal();
      }
    },
    update(next: PreventionViewModel) {
      if (!destroyed) state.value = next;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      app.unmount();
      container.remove();
      style.remove();
    },
  };
}
