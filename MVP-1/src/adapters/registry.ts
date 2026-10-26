import { createChatgptAdapter } from "./chatgpt/adapter";
import { createClaudeAdapter } from "./claude/adapter";
import { createGeminiAdapter } from "./gemini/adapter";
import { platformForUrl } from "../domain/platforms";

export function createPlatformAdapter(doc: Document = document) {
  switch (platformForUrl(doc.location.href)) {
    case "chatgpt":
      return createChatgptAdapter(doc);
    case "claude":
      return createClaudeAdapter(doc);
    case "gemini":
      return createGeminiAdapter(doc);
    default:
      return null;
  }
}
