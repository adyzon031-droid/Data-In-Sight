/** A detection-only view. Original text and UTF-16 spans remain authoritative. */
export function detectionView(text: string) {
  let normalized = "";
  const offsets: number[] = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // Common pasted invisible separators can split an otherwise recognizable value.
    if (/[\u200b-\u200d\u2060\ufeff]/u.test(text[i]!)) continue;
    normalized +=
      code >= 0xff01 && code <= 0xff5e
        ? String.fromCharCode(code - 0xfee0)
        : code === 0x3000
          ? " "
          : text[i];
    offsets.push(i);
  }
  return { text: normalized, offsets };
}
