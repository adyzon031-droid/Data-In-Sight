export const PLATFORMS = {
  chatgpt: { name: "ChatGPT", origin: "https://chatgpt.com" },
  claude: { name: "Claude", origin: "https://claude.ai" },
  gemini: { name: "Gemini", origin: "https://gemini.google.com" },
} as const;
export type Platform = keyof typeof PLATFORMS;
export const PLATFORM_MATCHES = Object.values(PLATFORMS).map(
  ({ origin }) => `${origin}/*`,
);
export function platformForUrl(url: string): Platform | null {
  try {
    const origin = new URL(url).origin;
    return (
      (Object.keys(PLATFORMS) as Platform[]).find(
        (id) => PLATFORMS[id].origin === origin,
      ) ?? null
    );
  } catch {
    return null;
  }
}
