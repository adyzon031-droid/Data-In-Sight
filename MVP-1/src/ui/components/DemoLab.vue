<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from "vue";
import { inspectPrompt, protectPrompt, type Settings } from "../../application";
import { mountPrevention, type PreventionAction } from "../mount-prevention";
import AppIcon from "./AppIcon.vue";
import demoIllustration from "../../assets/brand/demo-protection-illustration.png";
import { assetUrl } from "../services/assets";

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
    <section class="dis-demo-guide" aria-labelledby="demo-guide-title">
      <h3 id="demo-guide-title">¿Cómo funciona?</h3>
      <p class="dis-muted">
        El motor DLP analiza tu texto, identifica datos sensibles y ofrece
        opciones para protegerlos.
      </p>
      <div class="dis-demo-process">
        <div class="dis-demo-visual" aria-hidden="true">
          <img
            :src="assetUrl(demoIllustration)"
            class="dis-demo-illustration"
            alt=""
          /><span>Detecta antes de compartir</span>
        </div>
        <ol>
          <li>
            <AppIcon name="file" :size="22" />
            <div>
              <strong>1. Analiza</strong
              ><span>Selecciona un ejemplo o escribe tu mensaje.</span>
            </div>
          </li>
          <li>
            <AppIcon name="scan" :size="22" />
            <div>
              <strong>2. Detecta</strong
              ><span>Evalúa las coincidencias con las reglas actuales.</span>
            </div>
          </li>
          <li>
            <AppIcon name="lock" :size="22" />
            <div>
              <strong>3. Protege</strong
              ><span>Revisa las opciones de protección disponibles.</span>
            </div>
          </li>
          <li>
            <AppIcon name="check" :size="22" />
            <div>
              <strong>4. Verifica</strong
              ><span>Revisa el resultado y vuelve a evaluar.</span>
            </div>
          </li>
        </ol>
      </div>
    </section>
    <div class="dis-demo-workspace">
      <section
        class="dis-demo-editor-panel"
        aria-labelledby="demo-editor-title"
      >
        <h3 id="demo-editor-title">Prueba el motor DLP</h3>
        <p class="dis-muted">
          Detecta → explica → sustituye → vuelve a evaluar.
        </p>
        <label class="dis-field"
          ><span>Ejemplo para probar</span
          ><select v-model="selected" @change="choose">
            <option value="benign">Mensaje sin datos sensibles</option>
            <option value="personal">Correo y teléfono ficticios</option>
            <option value="natural">
              Texto libre y teléfonos internacionales
            </option>
            <option value="financial">
              CLABE, tarjeta de prueba y NSS sintético
            </option>
            <option value="identity">
              Identidad, domicilio y salud ficticios
            </option>
            <option value="critical">Credencial sintética</option>
          </select></label
        >
        <label class="dis-field" for="demo-editor"
          ><span>Mensaje de prueba</span
          ><textarea
            id="demo-editor"
            ref="editor"
            v-model="text"
            rows="12"
            spellcheck="false"
            :disabled="busy"
            aria-describedby="demo-hint"
          />
        </label>
        <div class="dis-demo-footer">
          <small id="demo-hint" class="dis-muted"
            >{{ count }} / 20 000 caracteres · Usa solo datos ficticios.</small
          >
        </div>
      </section>
      <aside class="dis-demo-usage" aria-labelledby="demo-usage-title">
        <h3 id="demo-usage-title">Pasos de uso</h3>
        <ol>
          <li>
            <AppIcon name="file" :size="24" />
            <div>
              <strong>Selecciona un ejemplo</strong>
              <p>Usa un texto predefinido o escribe el tuyo.</p>
            </div>
          </li>
          <li>
            <AppIcon name="file" :size="24" />
            <div>
              <strong>Edita el mensaje</strong>
              <p>Modifica el contenido si lo necesitas.</p>
            </div>
          </li>
          <li>
            <AppIcon name="play" :size="24" />
            <div>
              <strong>Evalúa</strong>
              <p>Ejecuta el análisis del motor DLP.</p>
            </div>
          </li>
          <li>
            <AppIcon name="chart" :size="24" />
            <div>
              <strong>Revisa el resultado</strong>
              <p>Consulta los datos detectados y las opciones de protección.</p>
            </div>
          </li>
        </ol>
        <button
          class="dis-button primary"
          type="button"
          :disabled="busy || !text.trim()"
          @click="evaluate"
        >
          <AppIcon name="shield" :size="18" />Evaluar mensaje
        </button>
      </aside>
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

<style scoped>
.dis-demo-guide {
  padding: 20px;
  margin: 24px 0;
  border: 1px solid color-mix(in srgb, var(--accent-iris) 35%, var(--line));
  border-radius: 16px;
  background: linear-gradient(
    120deg,
    color-mix(in srgb, var(--accent-iris) 7%, var(--surface)),
    color-mix(in srgb, var(--accent-cyan) 5%, var(--surface))
  );
}
.dis-demo-guide h3 {
  font-size: 20px;
  margin: 0 0 16px;
}
.dis-demo-guide ol {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  list-style: none;
  padding: 0;
  margin: 0;
}
.dis-demo-guide li {
  --step-color: var(--accent-iris);
  display: flex;
  align-items: center;
  gap: 13px;
  padding: 14px;
  border: 1px solid color-mix(in srgb, var(--step-color) 25%, var(--line));
  border-radius: 12px;
  background: var(--surface);
}
.dis-demo-guide li:nth-child(2) {
  --step-color: var(--accent-cyan);
}
.dis-demo-guide li:nth-child(3) {
  --step-color: var(--accent-gold);
}
.dis-demo-guide li:nth-child(4) {
  --step-color: var(--emerald);
}
.dis-demo-guide li > svg {
  color: var(--step-color);
  box-sizing: content-box;
  padding: 10px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--step-color) 12%, transparent);
}
.dis-demo-guide strong,
.dis-demo-guide span {
  display: block;
}
.dis-demo-guide strong {
  font-size: 14px;
}
.dis-demo-guide span {
  font-size: 12px;
  line-height: 1.5;
  color: var(--muted);
  margin-top: 4px;
}
.dis-demo .dis-field select {
  min-height: 48px;
  font-size: 14px;
  border-color: color-mix(in srgb, var(--accent-iris) 45%, var(--line));
}
.dis-demo .dis-field textarea {
  min-height: 300px;
  padding: 18px;
  font-size: 15px;
  line-height: 1.8;
  border-color: color-mix(in srgb, var(--accent-cyan) 40%, var(--line));
  background: var(--surface-soft);
}
.dis-demo .dis-field textarea:focus-visible,
.dis-demo .dis-field select:focus-visible {
  outline-color: var(--accent-iris);
}
.dis-demo-footer {
  align-items: center;
  flex-wrap: wrap;
}
.dis-demo-footer .dis-button {
  min-height: 48px;
  padding-inline: 24px;
}

.dis-demo-process {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 24px;
  align-items: center;
}
.dis-demo-visual {
  display: grid;
  justify-items: center;
  text-align: center;
  color: var(--accent-cyan);
}
.dis-demo-illustration {
  display: block;
  width: 100%;
  max-width: 360px;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(0 0 16px #22d3ee20);
}
.dis-demo-visual > span {
  font-size: 13px;
  letter-spacing: 1px;
}
.dis-demo-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.9fr);
  gap: 20px;
}
.dis-demo-editor-panel,
.dis-demo-usage {
  min-width: 0;
  padding: 24px;
  border: 1px solid color-mix(in srgb, var(--accent-cyan) 45%, var(--line));
  border-radius: 16px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--accent-iris) 6%, var(--surface)),
    var(--surface)
  );
}
.dis-demo-editor-panel h3,
.dis-demo-usage h3,
.dis-demo-guide h3 {
  font-size: 22px;
  padding-left: 17px;
  position: relative;
}
.dis-demo-editor-panel h3::before,
.dis-demo-usage h3::before,
.dis-demo-guide h3::before {
  content: "";
  position: absolute;
  left: 0;
  top: 3px;
  width: 5px;
  height: 26px;
  border-radius: 5px;
  background: linear-gradient(var(--accent-iris), var(--accent-cyan));
}
.dis-demo-editor-panel > p {
  font-size: 13px;
}
.dis-demo .dis-field textarea {
  min-height: 300px;
  line-height: 1.65;
  resize: vertical;
}
.dis-demo-guide li {
  border-radius: 24px;
  background: color-mix(in srgb, var(--step-color) 7%, var(--surface));
}
.dis-demo-usage {
  display: flex;
  flex-direction: column;
}
.dis-demo-usage ol {
  list-style: none;
  padding: 0;
  margin: 10px 0 28px;
}
.dis-demo-usage li {
  --usage-accent: var(--accent-iris);
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
}
.dis-demo-usage li:nth-child(2) {
  --usage-accent: var(--accent-cyan);
}
.dis-demo-usage li:nth-child(3) {
  --usage-accent: var(--accent-gold);
}
.dis-demo-usage li:nth-child(4) {
  --usage-accent: var(--emerald);
}
.dis-demo-usage li > svg {
  color: var(--usage-accent);
  box-sizing: content-box;
  padding: 12px;
  border: 1px solid var(--usage-accent);
  border-radius: 50%;
  background: color-mix(in srgb, var(--usage-accent) 20%, transparent);
}
.dis-demo-usage li > div {
  flex: 1;
  border-bottom: 1px solid var(--line);
  padding-bottom: 14px;
}
.dis-demo-usage strong {
  font-size: 14px;
}
.dis-demo-usage li p {
  font-size: 12px;
  color: var(--muted);
  margin: 4px 0 0;
}
.dis-demo-usage > button {
  margin-top: auto;
  width: 100%;
  min-height: 52px;
  background: linear-gradient(
    115deg,
    color-mix(in srgb, var(--accent-iris) 60%, #38245e),
    #7040a2
  );
  border-color: var(--accent-iris);
  color: white;
  box-shadow: 0 4px 20px #7a51ba25;
}

/* The guide and editor share the existing brand accents and native controls. */
.dis-demo-guide {
  margin: 18px 0;
  padding: 24px;
}
.dis-demo-guide > p {
  margin-bottom: 22px;
}
.dis-demo-process {
  gap: 28px;
}
.dis-demo-guide ol {
  position: relative;
  padding-left: 20px;
  gap: 10px;
}
.dis-demo-guide ol::before {
  content: "";
  position: absolute;
  left: 0;
  top: 30px;
  bottom: 30px;
  width: 2px;
  background: linear-gradient(
    var(--accent-iris),
    var(--accent-cyan),
    var(--accent-gold),
    var(--emerald)
  );
  opacity: 0.65;
}
.dis-demo-guide li {
  position: relative;
  padding: 8px 12px;
  border-color: color-mix(in srgb, var(--step-color) 60%, var(--line));
  background: linear-gradient(
    105deg,
    color-mix(in srgb, var(--step-color) 23%, var(--surface)),
    var(--surface)
  );
}
.dis-demo-guide li::before {
  content: "";
  position: absolute;
  left: -25px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--step-color);
  box-shadow: 0 0 10px color-mix(in srgb, var(--step-color) 30%, transparent);
}
.dis-demo-guide li > svg {
  filter: drop-shadow(
    0 0 5px color-mix(in srgb, var(--step-color) 35%, transparent)
  );
  padding: 9px;
  border: 1px solid color-mix(in srgb, var(--step-color) 45%, transparent);
}
.dis-demo-guide li span {
  margin-top: 2px;
}
.dis-demo-visual {
  border-radius: 50%;
  background: radial-gradient(ellipse, #10b98115, transparent 70%);
}
.dis-demo-workspace {
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 0.95fr);
}
.dis-demo-editor-panel {
  display: flex;
  flex-direction: column;
}
.dis-demo-editor-panel .dis-field:has(textarea) {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.dis-demo .dis-field textarea {
  flex: 1;
  width: 100%;
  max-width: 100%;
  border-radius: 12px;
}
.dis-demo .dis-field select {
  width: 100%;
  border-radius: 10px;
  background-color: var(--surface-soft);
  color: var(--text);
}
.dis-demo .dis-field select:focus-visible {
  box-shadow: 0 0 14px color-mix(in srgb, var(--accent-iris) 18%, transparent);
}
.dis-demo-usage li {
  gap: 12px;
  padding: 10px 0;
}
.dis-demo-usage li > svg {
  padding: 10px;
}
.dis-demo-usage > button {
  border-radius: 13px;
  box-shadow:
    inset 0 1px 0 #ffffff40,
    0 4px 20px #7a51ba30;
}
.dis-demo-usage > button:hover:not(:disabled) {
  filter: brightness(1.12);
}
.dis-demo-footer small {
  line-height: 1.6;
}
/* Same accent hues, with brighter highlights and a soft luminous edge. */
.dis-demo-guide li > svg,
.dis-demo-usage li > svg {
  --icon-glow: var(--step-color, var(--usage-accent));
  border-color: var(--icon-glow);
  background:
    radial-gradient(circle at 28% 18%, #ffffff30, transparent 55%),
    linear-gradient(
      145deg,
      color-mix(in srgb, var(--icon-glow) 32%, transparent),
      color-mix(in srgb, var(--icon-glow) 14%, transparent)
    );
  box-shadow:
    inset 0 1px 2px #ffffff55,
    inset 0 -2px 6px color-mix(in srgb, var(--icon-glow) 18%, transparent),
    0 0 15px color-mix(in srgb, var(--icon-glow) 24%, transparent);
  filter: brightness(1.16)
    drop-shadow(0 0 3px color-mix(in srgb, var(--icon-glow) 35%, transparent));
}
.dis-demo-usage > button > svg {
  filter: brightness(1.15) drop-shadow(0 0 4px #ffffff65);
}
@media (max-width: 900px) {
  .dis-demo-process,
  .dis-demo-workspace {
    grid-template-columns: minmax(0, 1fr);
  }
  .dis-demo-illustration {
    max-width: 300px;
  }
}
@media (max-width: 640px) {
  .dis-demo-guide {
    padding: 16px;
  }
  .dis-demo-guide ol {
    grid-template-columns: minmax(0, 1fr);
  }
  .dis-demo-footer .dis-button {
    width: 100%;
  }
  .dis-demo .dis-field textarea {
    min-height: 300px;
  }
}
</style>
