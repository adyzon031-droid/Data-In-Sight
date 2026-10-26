import manrope from "@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2?url";
import spaceGrotesk from "@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2?url";

export function assetUrl(url: string): string {
  if (/^(?:data:|https?:|chrome-extension:|moz-extension:)/u.test(url))
    return url;
  const runtime = (
    globalThis as unknown as {
      chrome?: { runtime?: { id?: string; getURL(path: string): string } };
    }
  ).chrome?.runtime;
  return runtime?.id ? runtime.getURL(url.replace(/^\//u, "")) : url;
}
export function resolveStyleAssets(css: string): string {
  return css.replace(
    /url\((["']?)(\/?assets\/[^\s)'";]+)\1\)/gu,
    (_match, _quote: string, url: string) => `url("${assetUrl(url)}")`,
  );
}

let fonts: Promise<void> | undefined;
export function ensureUiFonts() {
  fonts ??= Promise.all([
    new FontFace("Manrope Variable", `url("${assetUrl(manrope)}")`, {
      weight: "200 800",
    }).load(),
    new FontFace("Space Grotesk Variable", `url("${assetUrl(spaceGrotesk)}")`, {
      weight: "300 700",
    }).load(),
  ]).then((loaded) => {
    loaded.forEach((font) => document.fonts.add(font));
  });
  return fonts;
}
