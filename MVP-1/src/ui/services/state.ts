import { inject, ref, watch, type InjectionKey } from "vue";
import { DEFAULT_SETTINGS, type Settings } from "../../application";
import type { LocalEvent, TabState, UiClient } from "../types";

export function createUiState(client: UiClient) {
  const settings = ref<Settings>({ ...DEFAULT_SETTINGS });
  const events = ref<LocalEvent[]>([]);
  const tab = ref<TabState>({
    platform: null,
    status: "unavailable",
    reason: "Comprobando disponibilidad…",
  });
  const loading = ref(true);
  const saving = ref(false);
  const error = ref("");
  const notice = ref("");
  watch(
    () => settings.value.theme,
    (theme) => {
      document.documentElement.dataset.theme = theme;
    },
    { immediate: true },
  );
  async function load() {
    loading.value = true;
    error.value = "";
    try {
      const [savedSettings, savedEvents, savedTab] = await Promise.all([
        client.getSettings(),
        client.getEvents(),
        client.getTabState(),
      ]);
      settings.value = savedSettings;
      events.value = savedEvents;
      tab.value = savedTab;
    } catch {
      error.value =
        "No pudimos leer los ajustes o eventos locales. Reintenta antes de cambiar la configuración.";
    } finally {
      loading.value = false;
    }
  }
  async function save(patch: Partial<Settings>) {
    if (saving.value || loading.value || error.value) return;
    saving.value = true;
    notice.value = "";
    const next = { ...settings.value, ...patch };
    try {
      await client.saveSettings(next);
      settings.value = next;
      events.value = await client.getEvents();
      notice.value =
        client.environment === "preview"
          ? "Cambio aplicado solo en esta vista previa."
          : "Ajustes guardados en este navegador.";
    } catch {
      error.value =
        "No pudimos guardar o actualizar los ajustes. Reintenta para comprobar el estado local.";
    } finally {
      saving.value = false;
    }
  }
  async function clearEvents() {
    if (saving.value || loading.value || error.value) return;
    saving.value = true;
    try {
      await client.clearEvents();
      events.value = [];
      notice.value = "Eventos locales eliminados.";
    } catch {
      error.value = "No pudimos borrar los eventos. Reintenta.";
    } finally {
      saving.value = false;
    }
  }
  async function openOptions() {
    try {
      await client.openOptions();
    } catch {
      error.value = "No pudimos abrir la configuración.";
    }
  }
  return {
    settings,
    events,
    tab,
    loading,
    saving,
    error,
    notice,
    load,
    save,
    clearEvents,
    openOptions,
    environment: client.environment,
  };
}
export type UiState = ReturnType<typeof createUiState>;
export const UI_STATE: InjectionKey<UiState> = Symbol("data-in-sight-ui");
export function useUiState() {
  const state = inject(UI_STATE);
  if (!state) throw new Error("Data In Sight: falta el proveedor de interfaz.");
  return state;
}
