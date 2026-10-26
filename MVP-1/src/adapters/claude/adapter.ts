import { createRichEditorAdapter } from "../shared/rich-editor";

/** Provisional form/ProseMirror contract, tested on a fixture. Authenticated DOM verification is pending. */
export function createClaudeAdapter(doc: Document = document) {
  return createRichEditorAdapter(
    {
      platform: "claude",
      route: /^\/(?:new|chat\/[^/]+)\/?$/u,
      editor: 'form div.ProseMirror[contenteditable="true"]',
      scope: "form",
      send: 'button[aria-label="Send message"], button[aria-label="Enviar mensaje"]',
      stop: 'button[aria-label="Stop response"], button[aria-label="Stop generating"], button[aria-label="Detener respuesta"]',
    },
    doc,
  );
}
