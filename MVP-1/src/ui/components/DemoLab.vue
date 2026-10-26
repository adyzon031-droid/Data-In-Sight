<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from "vue";
import { inspectPrompt, protectPrompt, type Settings } from "../../application";
import { mountPrevention, type PreventionAction } from "../mount-prevention";
import AppIcon from "./AppIcon.vue";

const props = defineProps<{ settings: Settings }>();
const editor = ref<HTMLTextAreaElement>();
const text = ref("Ayúdame a redactar un correo para mi equipo.");
const selected = ref("benign");
const notice = ref("");
const busy = ref(false);
const samples = {
  benign: "Ayúdame a redactar un correo para mi equipo.",
  personal:
    "Mi correo es alumno@example.com y mi teléfono es +52 55 1234 5678. ¿Puedes ayudarme a redactar este mensaje?",
  natural:
    "ana pérez, 5512345678\nLlámenme al +1 213 373 4253 ext. 42 o al 0034 612 345 678.\nVivo en Calle Ejemplo 123, Colonia Centro. Tengo asma.",
  financial:
    "Datos de ejemplo para probar las reglas, sin titular verificado:\nCLABE: 103150124152345786\nTarjeta: 4242 4242 4242 4242\nNSS: 12345678903",
  identity:
    "Ejemplo ficticio de revisión:\nNombre completo: María del Carmen López\nFecha de nacimiento: 14/02/1990\nDomicilio: Calle Ejemplo 123, Colonia Centro\nCIC del INE: 123456789\nPasaporte: G12345678\nLicencia de conducir: CDMX-1234567\nDiagnóstico del paciente: alergia al polen",
  critical:
    "Revisa esta configuración de prueba:\nAPI_KEY=synthetic-example-key-123\nCorreo: alumno@example.com",
};
const count = computed(() => text.value.length.toLocaleString("es-MX"));
let session: ReturnType<typeof mountPrevention> | undefined;
let host: HTMLElement | undefined;
let evaluatedText = "";
function close() {
  session?.destroy();
  session = undefined;
  host?.remove();
  host = undefined;
  busy.value = false;
}
function choose() {
  close();
  text.value = samples[selected.value as keyof typeof samples];
  notice.value = "";
}
function onAction(action: PreventionAction) {
  if (action === "protect") {
    const result = protectPrompt(text.value, props.settings);
    text.value = result.text;
    evaluatedText = result.text;
    session?.update({
      inspection: result.inspection,
      previewText: result.text,
      changes: result.changes,
      simulation: true,
    });
    return;
  }
  if (action === "continue") {
    const current = inspectPrompt(text.value, props.settings);
    if (
      text.value !== evaluatedText ||
      current.decision !== "WARN" ||
      !current.canContinue
    ) {
      notice.value = "El texto o la política cambió. Vuelve a evaluar.";
    } else notice.value = "Continuación simulada. No se envió ningún mensaje.";
  } else if (action === "cancel")
    notice.value = "Revisión cancelada. No se envió ningún mensaje.";
  else notice.value = "Revisa el editor y vuelve a evaluar cuando termines.";
  close();
  void nextTick(() => editor.value?.focus());
}
function evaluate() {
  close();
  notice.value = "";
  const inspection = inspectPrompt(text.value, props.settings);
  evaluatedText = text.value;
  if (inspection.decision === "ALLOW") {
    notice.value = inspection.findings.length
      ? "La política actual permite los datos personales detectados. No se envió ningún mensaje."
      : "No se detectaron coincidencias con las reglas actuales. No se envió ningún mensaje.";
    return;
  }
  busy.value = true;
  host = document.createElement("div");
  host.dataset.theme = props.settings.theme;
  document.body.append(host);
  session = mountPrevention(
    host.attachShadow({ mode: "open" }),
    { inspection, simulation: true },
    onAction,
  );
}
onBeforeUnmount(close);
</script>
<template>
  <div class="dis-demo">
    <div class="dis-callout">
      <AppIcon name="info" />
      <div>
        <strong>Demostración local · Sin envíos</strong>
        <p>
          Prueba el motor con datos ficticios. Este editor no está conectado a
          ChatGPT y no guarda mensajes ni eventos.
        </p>
      </div>
    </div>
    <label class="dis-field"
      ><span>Ejemplo para probar</span
      ><select v-model="selected" @change="choose">
        <option value="benign">Mensaje sin datos sensibles</option>
        <option value="personal">Correo y teléfono ficticios</option>
        <option value="natural">Texto libre y teléfonos internacionales</option>
        <option value="financial">
          CLABE, tarjeta de prueba y NSS sintético
        </option>
        <option value="identity">Identidad, domicilio y salud ficticios</option>
        <option value="critical">Credencial sintética</option>
      </select></label
    >
    <label class="dis-field" for="demo-editor"
      ><span>Mensaje de prueba</span
      ><textarea
        id="demo-editor"
        ref="editor"
        v-model="text"
        rows="7"
        spellcheck="false"
        :disabled="busy"
        aria-describedby="demo-hint"
      />
    </label>
    <div class="dis-demo-footer">
      <small id="demo-hint" class="dis-muted"
        >{{ count }} / 20 000 caracteres · Usa solo datos ficticios.</small
      ><button
        class="dis-button primary"
        type="button"
        :disabled="busy || !text.trim()"
        @click="evaluate"
      >
        <AppIcon name="shield" :size="18" />Evaluar mensaje
      </button>
    </div>
    <p
      v-if="notice"
      class="dis-callout compact"
      role="status"
      aria-label="Resultado de demostración"
    >
      {{ notice }}
    </p>
  </div>
</template>
