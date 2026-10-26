import type { Platform } from "../../domain/platforms";

export interface EditorBinding {
  editor: HTMLElement;
  scope: HTMLElement;
  button: HTMLButtonElement;
  route: string;
}
export interface PlatformAdapter {
  platform: Platform;
  locate(): EditorBinding | null;
  read(binding: EditorBinding): string;
  replace(binding: EditorBinding, text: string): boolean;
  matches(binding: EditorBinding): boolean;
}
