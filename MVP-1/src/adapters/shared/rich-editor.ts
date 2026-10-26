import type {
  EditorBinding,
  PlatformAdapter,
} from "../contracts/platform-adapter";
import { PLATFORMS, type Platform } from "../../domain/platforms";

interface RichEditorSpec {
  platform: Platform;
  route: RegExp;
  editor: string;
  scope: string;
  send: string;
  stop: string;
}
const visible = (element: HTMLElement) =>
  element.isConnected &&
  !element.hidden &&
  element.getClientRects().length > 0 &&
  getComputedStyle(element).visibility !== "hidden";

/** Narrow DOM contract. No generic fallback to the first textbox or button. */
export function createRichEditorAdapter(
  spec: RichEditorSpec,
  doc: Document = document,
): PlatformAdapter {
  function locate(): EditorBinding | null {
    if (
      doc.location.origin !== PLATFORMS[spec.platform].origin ||
      !spec.route.test(doc.location.pathname)
    )
      return null;
    const editors = [...doc.querySelectorAll<HTMLElement>(spec.editor)].filter(
      visible,
    );
    if (editors.length !== 1) return null;
    const editor = editors[0]!;
    if (
      !editor.isContentEditable ||
      editor.getAttribute("aria-disabled") === "true" ||
      editor.getAttribute("aria-readonly") === "true" ||
      editor.querySelector(
        '[contenteditable="false"], img, canvas, video, input, textarea',
      )
    )
      return null;
    const scope = editor.closest<HTMLElement>(spec.scope);
    if (!scope || scope.querySelectorAll(spec.editor).length !== 1) return null;
    if ([...scope.querySelectorAll<HTMLElement>(spec.stop)].some(visible))
      return null;
    const buttons = [
      ...scope.querySelectorAll<HTMLButtonElement>(spec.send),
    ].filter(visible);
    if (buttons.length !== 1 || buttons[0]!.closest(spec.scope) !== scope)
      return null;
    return { editor, scope, button: buttons[0]!, route: doc.location.href };
  }
  function matches(binding: EditorBinding) {
    const current = locate();
    return (
      !!current &&
      current.editor === binding.editor &&
      current.scope === binding.scope &&
      current.button === binding.button &&
      current.route === binding.route
    );
  }
  const read = (binding: EditorBinding) =>
    binding.editor.innerText.replace(/\r\n?/gu, "\n");
  return {
    platform: spec.platform,
    locate,
    matches,
    read,
    replace(binding, text) {
      if (!matches(binding)) return false;
      const lines = text.split("\n");
      if (lines.length > 257) return false;
      const original = read(binding);
      // execCommand does not consistently emit cancellable beforeinput across browsers.
      if (
        !binding.editor.dispatchEvent(
          new InputEvent("beforeinput", {
            bubbles: true,
            composed: true,
            cancelable: true,
            inputType: "insertReplacementText",
            data: text,
          }),
        )
      )
        return false;
      if (!matches(binding) || read(binding) !== original) return false;
      const selection = doc.getSelection();
      if (!selection) return false;
      binding.editor.focus();
      const range = doc.createRange();
      range.selectNodeContents(binding.editor);
      selection.removeAllRanges();
      selection.addRange(range);
      // Use the browser editing operation so rich editor frameworks receive native input.
      // No textContent/innerHTML fallback: a DOM-only mutation need not update the app's model.
      let inputSeen = false;
      const onInput = () => {
        inputSeen = true;
      };
      binding.editor.addEventListener("input", onInput);
      try {
        // insertText with newlines creates paragraphs and can multiply innerText breaks.
        // Native line-break commands preserve the exact plaintext read from the editor.
        if (!doc.execCommand("insertText", false, lines[0]!)) return false;
        for (const line of lines.slice(1)) {
          if (
            !binding.editor.contains(selection.anchorNode) ||
            !binding.editor.isConnected
          )
            return false;
          if (!doc.execCommand("insertLineBreak", false)) return false;
          if (line && !doc.execCommand("insertText", false, line)) return false;
        }
        if (!inputSeen) return false;
        return matches(binding) && read(binding) === text;
      } catch {
        return false;
      } finally {
        binding.editor.removeEventListener("input", onInput);
      }
    },
  };
}
