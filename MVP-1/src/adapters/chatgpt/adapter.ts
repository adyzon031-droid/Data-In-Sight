import type {
  EditorBinding,
  PlatformAdapter,
} from "../contracts/platform-adapter";

export const CHATGPT_ORIGIN = "https://chatgpt.com";

/** Selectors observed on ChatGPT on 2026-10-19; unrecognized variants fail visibly. */
export function createChatgptAdapter(
  doc: Document = document,
): PlatformAdapter {
  function locate(): EditorBinding | null {
    if (doc.location.origin !== CHATGPT_ORIGIN) return null;
    const candidates = [
      ...doc.querySelectorAll<HTMLTextAreaElement>(
        "textarea#mobile-composer-prompt",
      ),
    ].filter(
      (el) =>
        el.isConnected &&
        !el.disabled &&
        !el.readOnly &&
        el.getClientRects().length > 0,
    );
    if (candidates.length !== 1) return null;
    const editor = candidates[0]!;
    const form = editor.closest("form[data-mobile-composer]");
    if (!(form instanceof HTMLFormElement)) return null;
    const buttons = form.querySelectorAll<HTMLButtonElement>(
      'button[data-composer-submit][type="submit"]',
    );
    if (buttons.length !== 1) return null;
    const button = buttons[0]!;
    if (button.querySelector("[data-composer-stop-icon]:not([hidden])"))
      return null;
    if (!button.isConnected || button.getClientRects().length === 0)
      return null;
    return { editor, scope: form, button, route: doc.location.href };
  }
  function matches(binding: EditorBinding) {
    const current = locate();
    return (
      !!current &&
      current.editor === binding.editor &&
      current.button === binding.button &&
      current.scope === binding.scope &&
      current.route === binding.route
    );
  }
  return {
    platform: "chatgpt",
    locate,
    matches,
    read: (binding) => (binding.editor as HTMLTextAreaElement).value,
    replace(binding, text) {
      if (!matches(binding)) return false;
      const setter = Object.getOwnPropertyDescriptor(
        HTMLTextAreaElement.prototype,
        "value",
      )?.set;
      if (!setter) return false;
      binding.editor.focus();
      setter.call(binding.editor, text);
      binding.editor.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          composed: true,
          inputType: "insertReplacementText",
          data: null,
        }),
      );
      return (
        matches(binding) &&
        (binding.editor as HTMLTextAreaElement).value === text
      );
    },
  };
}
