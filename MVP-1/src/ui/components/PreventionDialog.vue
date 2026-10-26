<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  useId,
  watch,
} from "vue";
import type { Inspection, ProtectionChange } from "../../application";
import AppIcon from "./AppIcon.vue";
import ChangeReport from "./ChangeReport.vue";
import FindingsList from "./FindingsList.vue";
import BrandLogo from "./BrandLogo.vue";
import SecurityCore from "./SecurityCore.vue";
import type { PreventionAction } from "../prevention-types";

const props = defineProps<{
  inspection: Inspection;
  previewText?: string;
  changes?: ProtectionChange[];
  simulation?: boolean;
}>();
const emit = defineEmits<{ action: [action: PreventionAction] }>();
const dialog = ref<HTMLDialogElement>();
const titleId = useId();
const descriptionId = useId();
const previousFocus = document.activeElement;
const isPreview = computed(() => props.previewText !== undefined);
const blocked = computed(() => props.inspection.decision === "BLOCK");
const title = computed(() =>
  props.inspection.analysisError
    ? "El mensaje es demasiado largo"
    : isPreview.value
      ? "Revisa el texto protegido"
      : blocked.value
        ? "Envío bloqueado"
        : "Información sensible detectada",
);
onMounted(() => {
  dialog.value?.showModal();
});
function trapFocus(event: KeyboardEvent) {
  if (event.key !== "Tab" || !dialog.value) return;
  const focusable = [
    ...dialog.value.querySelectorAll<HTMLElement>(
      'button:not(:disabled), [tabindex="0"]',
    ),
  ];
  const first = focusable[0];
  const last = focusable.at(-1);
  const root = dialog.value.getRootNode() as Document | ShadowRoot;
  const active = root.activeElement;
  if (event.shiftKey && (active === first || !dialog.value.contains(active))) {
    event.preventDefault();
    last?.focus();
  } else if (
    !event.shiftKey &&
    (active === last || !dialog.value.contains(active))
  ) {
    event.preventDefault();
    first?.focus();
  }
}
watch(isPreview, async () => {
  await nextTick();
  if (isPreview.value) {
    dialog.value
      ?.querySelector<HTMLElement>("h2")
      ?.focus({ preventScroll: true });
    if (dialog.value) dialog.value.scrollTop = 0;
  } else {
    dialog.value?.querySelector<HTMLElement>("[autofocus]")?.focus();
  }
});
onBeforeUnmount(() => {
  dialog.value?.close();
  if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
    previousFocus.focus();
});
</script>
<template>
  <dialog
    ref="dialog"
    class="dis-modal dis-root"
    :aria-labelledby="titleId"
    :aria-describedby="descriptionId"
    @cancel.prevent="emit('action', 'cancel')"
    @keydown="trapFocus"
  >
    <div class="dis-modal-brand">
      <BrandLogo compact /><span>{{
        simulation
          ? "Demostración local · Sin envíos"
          : "Revisión antes de enviar"
      }}</span
      ><button
        class="dis-icon-button"
        type="button"
        aria-label="Cerrar revisión"
        @click="emit('action', 'cancel')"
      >
        <AppIcon name="close" />
      </button>
    </div>
    <div class="dis-modal-body">
      <div class="dis-modal-signal">
        <SecurityCore
          compact
          :tone="blocked ? 'critical' : isPreview ? 'safe' : 'warning'"
        /><span class="dis-signal-label">{{
          inspection.analysisError
            ? "ANÁLISIS NO REALIZADO"
            : isPreview
              ? "REEVALUACIÓN LOCAL"
              : blocked
                ? "CREDENCIAL DETECTADA"
                : "REVISIÓN NECESARIA"
        }}</span>
      </div>
      <h2 :id="titleId" tabindex="-1">{{ title }}</h2>
      <p :id="descriptionId" class="dis-muted">
        {{
          inspection.analysisError
            ? "El análisis admite hasta 20 000 caracteres UTF-16. Reduce el texto para revisarlo."
            : isPreview
              ? "Los datos detectados se sustituyeron por etiquetas. Revisa el resultado antes de usarlo."
              : blocked
                ? "Detectamos una posible credencial. Elimínala o sustitúyela para poder continuar."
                : "Encontramos posibles datos personales. Puedes corregir el mensaje antes de compartirlo."
        }}
      </p>
      <ChangeReport v-if="isPreview && changes?.length" :changes="changes" />
      <pre
        v-if="isPreview"
        class="dis-preview-text"
        tabindex="0"
        aria-label="Texto protegido"
        >{{ previewText }}</pre>
      <FindingsList
        v-if="inspection.findings.length"
        :findings="inspection.findings"
      />
      <p v-if="isPreview" class="dis-inline-note">
        <AppIcon name="info" :size="18" />{{
          inspection.decision === "ALLOW"
            ? "Sin coincidencias con las reglas actuales. Revisa también la información que el motor no reconoce."
            : "La reevaluación aún encontró riesgo. Edita el texto antes de continuar."
        }}
      </p>
      <div class="dis-modal-actions">
        <button
          v-if="isPreview"
          class="dis-button primary"
          type="button"
          autofocus
          @click="emit('action', 'edit')"
        >
          Volver al editor
        </button>
        <button
          v-else-if="!inspection.analysisError"
          class="dis-button primary"
          type="button"
          autofocus
          @click="emit('action', 'protect')"
        >
          <AppIcon name="shield" :size="18" />Proteger y revisar
        </button>
        <button
          v-else
          class="dis-button primary"
          type="button"
          autofocus
          @click="emit('action', 'edit')"
        >
          Reducir el texto
        </button>
        <div v-if="!isPreview" class="dis-action-pair">
          <button
            class="dis-button secondary"
            type="button"
            @click="emit('action', 'cancel')"
          >
            Cancelar
          </button>
          <button
            class="dis-button secondary"
            type="button"
            @click="emit('action', 'edit')"
          >
            Editar mensaje
          </button>
        </div>
        <button
          v-if="
            !isPreview &&
            inspection.decision === 'WARN' &&
            inspection.canContinue
          "
          class="dis-button text"
          type="button"
          @click="emit('action', 'continue')"
        >
          {{
            simulation
              ? "Simular continuación sin proteger"
              : "Continuar sin proteger"
          }}
        </button>
      </div>
      <p class="dis-privacy-note">
        <AppIcon name="lock" :size="15" />El análisis es local. El contenido no
        se guarda ni se envía a servicios de análisis.
      </p>
    </div>
  </dialog>
</template>
