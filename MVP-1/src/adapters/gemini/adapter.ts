import { createRichEditorAdapter } from "../shared/rich-editor";

/** Editor/scope/send button observed in guest Gemini on 2026-10-19. */
export function createGeminiAdapter(doc: Document = document) {
  return createRichEditorAdapter(
    {
      platform: "gemini",
      route: /^\/app(?:\/|$)/u,
      editor:
        'rich-textarea .ql-editor[contenteditable="true"][role="textbox"]',
      scope: ".text-input-field",
      send: 'button[aria-label="Enviar mensaje"], button[aria-label="Send message"]',
      stop: 'button[aria-label="Detener respuesta"], button[aria-label="Stop response"], button[aria-label="Stop generating"], button[aria-label="Detener"]',
    },
    doc,
  );
}
