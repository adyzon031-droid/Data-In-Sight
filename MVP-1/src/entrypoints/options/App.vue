<script setup lang="ts">
import { phoneRegions } from "../../ui/phone-regions";
import type { CountryCode } from "libphonenumber-js";
import { computed, onMounted, ref } from "vue";
import { useUiState } from "../../ui/services/state";
import BrandLogo from "../../ui/components/BrandLogo.vue";
import AppIcon from "../../ui/components/AppIcon.vue";
import SettingsToggle from "../../ui/components/SettingsToggle.vue";
import ThemePicker from "../../ui/components/ThemePicker.vue";
import DemoLab from "../../ui/components/DemoLab.vue";
import SecurityCore from "../../ui/components/SecurityCore.vue";
import BrandConstellation from "../../ui/components/BrandConstellation.vue";
const state = useUiState();
const { settings, loading, saving, error, notice, events } = state;
const section = ref("general");
const sections = [
  {
    id: "general",
    label: "General",
    icon: "settings",
    description: "Personaliza el comportamiento de la extensión.",
  },
  {
    id: "detection",
    label: "Detección",
    icon: "shield",
    description: "Conoce los datos que identifica el motor local.",
  },
  {
    id: "sites",
    label: "Sitios web",
    icon: "globe",
    description: "Disponibilidad y cobertura de las integraciones.",
  },
  {
    id: "privacy",
    label: "Privacidad",
    icon: "lock",
    description: "Controla los eventos guardados en este navegador.",
  },
  {
    id: "appearance",
    label: "Apariencia",
    icon: "palette",
    description: "Elige cómo quieres ver Data In Sight.",
  },
  {
    id: "demo",
    label: "Demostración",
    icon: "play",
    description: "Explora la detección y la protección con datos ficticios.",
  },
  {
    id: "about",
    label: "Acerca de",
    icon: "info",
    description: "Un uso más consciente de la inteligencia artificial.",
  },
];
const current = computed(() =>
  sections.find((item) => item.id === section.value)!,
);
const disabled = computed(() => loading.value || saving.value || !!error.value);
const rules = [
  {
    name: "Correos electrónicos",
    description: "Correos personales y de trabajo.",
    icon: "mail",
    label: "Dato personal",
  },
  {
    name: "Teléfonos nacionales e internacionales",
    description:
      "Prefijos internacionales y números nacionales según el país elegido, con extensiones.",
    icon: "phone",
    label: "Dato personal",
  },
  {
    name: "CURP",
    description: "Datos de identificación personal.",
    icon: "identity",
    label: "Dato personal",
  },
  {
    name: "RFC",
    description: "Datos fiscales de personas y empresas.",
    icon: "fiscal",
    label: "Dato personal",
  },
  {
    name: "CLABE interbancaria",
    description: "18 dígitos con comprobación del dígito de control.",
    icon: "bank",
    label: "Dato financiero",
  },
  {
    name: "Tarjetas bancarias",
    description: "Números con formato compatible y comprobación Luhn.",
    icon: "card",
    label: "Dato financiero",
  },
  {
    name: "NSS de México",
    description: "11 dígitos identificados como número de seguridad social.",
    icon: "identity",
    label: "Dato personal",
  },
  {
    name: "INE, pasaporte y licencia",
    description: "Identificadores acompañados de etiquetas de documento.",
    icon: "identity",
    label: "Dato personal",
  },
  {
    name: "Nombres completos",
    description:
      "Nombres probables en texto libre, incluso en minúsculas, y en campos de persona.",
    icon: "identity",
    label: "Dato personal",
  },
  {
    name: "Domicilios",
    description: "Direcciones con vía y numeración, también en texto libre.",
    icon: "globe",
    label: "Dato personal",
  },
  {
    name: "Fecha de nacimiento",
    description: "Fechas de calendario identificadas como nacimiento.",
    icon: "calendar",
    label: "Dato personal",
  },
  {
    name: "Salud y expedientes clínicos",
    description:
      "Información declarada en campos clínicos o en primera persona.",
    icon: "health",
    label: "Dato sensible",
  },
  {
    name: "Contraseñas",
    description: "Valores escritos como contraseñas.",
    icon: "lock",
    label: "Bloqueo crítico",
  },
  {
    name: "Tokens y claves API",
    description: "Claves de acceso a servicios y aplicaciones.",
    icon: "key",
    label: "Bloqueo crítico",
  },
];
const categoryNames = {
  email: "Correo",
  phone: "Teléfono",
  curp: "CURP",
  rfc: "RFC",
  clabe: "CLABE interbancaria",
  card: "Tarjeta bancaria",
  nss: "Número de seguridad social",
  ine: "Identificador INE",
  passport: "Pasaporte",
  license: "Licencia de conducir",
  name: "Nombre completo",
  address: "Domicilio",
  "birth-date": "Fecha de nacimiento",
  health: "Información de salud",
  password: "Contraseña",
  "api-key": "Clave API",
  token: "Token",
};
const actionNames = {
  WARN: "Advertencia",
  BLOCK: "Bloqueo",
  SANITIZE: "Sustitución",
  CONTINUE: "Continuación",
  CANCEL: "Cancelación",
};
onMounted(state.load);
</script>
<template>
  <div class="dis-root dis-options">
    <aside class="dis-sidebar">
      <BrandLogo subtitle="Configuración" />
      <nav aria-label="Secciones de configuración">
        <button
          v-for="item in sections"
          :key="item.id"
          class="dis-nav-item"
          :class="{ selected: section === item.id }"
          :data-section="item.id"
          type="button"
          :aria-current="section === item.id ? 'page' : undefined"
          @click="section = item.id"
        >
          <span class="dis-nav-icon" :data-section="item.id"
            ><AppIcon :name="item.icon" :size="21" /></span
          ><span>{{ item.label }}</span>
        </button>
      </nav>
      <div class="dis-sidebar-footer">
        <AppIcon name="lock" :size="18" /><span
          >Tu información,<br />bajo tu control.</span
        >
      </div>
    </aside>
    <main class="dis-options-main">
      <header class="dis-page-header">
        <div>
          <span class="dis-eyebrow">DATA IN SIGHT / CONFIGURACIÓN</span>
          <h1>
            {{
              section === "general" ? "Configuración general" : current.label
            }}
          </h1>
          <p class="dis-muted">{{ current.description }}</p>
        </div>
        <span class="dis-version">{{
          state.environment === "preview"
            ? "Vista previa · En memoria"
            : "v0.1.0"
        }}</span>
      </header>
      <div v-if="loading" class="dis-callout compact" role="status">
        Cargando ajustes locales…
      </div>
      <div v-if="error" class="dis-error" role="alert">
        {{ error }}
        <button class="dis-link" type="button" @click="state.load">
          Reintentar
        </button>
      </div>
      <p
        class="dis-save-notice"
        role="status"
        aria-label="Estado de ajustes"
        aria-live="polite"
      >
        {{ saving ? "Guardando…" : notice }}
      </p>
      <template v-if="section === 'general'">
        <section class="dis-security-hero" aria-labelledby="security-headline">
          <div class="dis-hero-copy">
            <span class="dis-system-tag"
              ><span></span> PRIVACIDAD DESDE EL ORIGEN</span
            >
            <h2 id="security-headline">
              Tu información.<br /><em>Tu decisión.</em>
            </h2>
            <p>
              Una capa de claridad entre tus datos y la inteligencia artificial.
              Analiza, comprende el riesgo y decide qué compartir.
            </p>
            <button
              class="dis-button primary"
              type="button"
              @click="section = 'demo'"
            >
              Explorar la protección <AppIcon name="arrow" :size="18" />
            </button>
            <div class="dis-hero-signals">
              <span><AppIcon name="lock" :size="13" /> Análisis local</span
              ><span
                ><AppIcon name="shield" :size="13" /> Sin guardar mensajes</span
              >
            </div>
          </div>
          <SecurityCore />
        </section>
        <section class="dis-card">
          <h2>Protección y comportamiento</h2>
          <div class="dis-static-setting">
            <span class="dis-icon-tile dis-credential-tile"
              ><AppIcon name="lock"
            /></span>
            <div>
              <strong>Bloqueo de credenciales críticas</strong>
              <p>
                Siempre activo al evaluar con el motor. Sin opción de omitir.
              </p>
            </div>
            <span class="dis-label positive">Obligatorio</span>
          </div>
          <SettingsToggle
            label="Advertir sobre datos personales"
            description="Revisa los datos personales antes de compartirlos."
            icon="scan"
            tone="cyan"
            :checked="settings.warnOnPersonalData"
            :disabled="disabled"
            @change="state.save({ warnOnPersonalData: $event })"
          />
          <label class="dis-field dis-phone-region">
            <span>País de los teléfonos sin prefijo</span>
            <select
              :value="settings.phoneRegion"
              :disabled="disabled"
              @change="
                state.save({
                  phoneRegion: ($event.target as HTMLSelectElement)
                    .value as CountryCode,
                })
              "
            >
              <option
                v-for="region in phoneRegions"
                :key="region.code"
                :value="region.code"
              >
                {{ region.label }}
              </option>
            </select>
            <small class="dis-muted"
              >Los números con + o 00 se revisan por su prefijo
              internacional.</small
            >
          </label>
          <SettingsToggle
            label="Registro local de eventos"
            description="Conserva un resumen de actividad, sin guardar tus mensajes."
            icon="activity"
            tone="violet"
            :checked="settings.recordEvents"
            :disabled="disabled"
            @change="state.save({ recordEvents: $event })"
          />
        </section>
        <section class="dis-card dis-feature-card">
          <span class="dis-icon-tile dis-demo-tile"
            ><AppIcon name="play"
          /></span>
          <div>
            <h2>Conoce tu protección antes de usarla</h2>
            <p class="dis-muted">
              Prueba una advertencia, un bloqueo y la sustitución de datos.
            </p>
          </div>
          <button
            class="dis-button secondary"
            type="button"
            @click="section = 'demo'"
          >
            Abrir demostración<AppIcon name="arrow" :size="18" />
          </button>
        </section>
      </template>
      <section v-else-if="section === 'detection'" class="dis-card">
        <h2>Tipos de información a detectar</h2>
        <p class="dis-muted">
          Reconoce información personal y credenciales antes de compartirlas.
        </p>
        <ul class="dis-detection-list">
          <li v-for="rule in rules" :key="rule.name">
            <span
              class="dis-icon-tile"
              :data-category="rule.icon"
              :class="rule.label === 'Bloqueo crítico' ? 'danger' : 'mint'"
              ><AppIcon :name="rule.icon"
            /></span>
            <div>
              <strong>{{ rule.name }}</strong>
              <p>{{ rule.description }}</p>
            </div>
            <span
              class="dis-label"
              :class="
                rule.label === 'Bloqueo crítico' ? 'critical' : 'positive'
              "
              >{{ rule.label }}</span
            >
          </li>
        </ul>
      </section>
      <section v-else-if="section === 'sites'" class="dis-card">
        <h2>Integraciones de plataformas</h2>
        <p class="dis-muted">
          El soporte requiere controlar y verificar los mecanismos de envío de
          cada plataforma.
        </p>
        <div
          v-for="site in ['ChatGPT', 'Claude', 'Gemini']"
          :key="site"
          class="dis-site-row"
        >
          <span class="dis-icon-tile mint"><AppIcon name="globe" /></span>
          <div>
            <strong>{{ site }}</strong>
            <p>
              {{
                site === "Claude"
                  ? "Editor ProseMirror · Pendiente de validación con sesión"
                  : "Texto en editor compatible · Clic y Enter"
              }}
            </p>
          </div>
          <span class="dis-label neutral">{{ "Experimental" }}</span>
        </div>
      </section>
      <template v-else-if="section === 'privacy'">
        <section class="dis-card">
          <h2>Privacidad por diseño</h2>
          <p class="dis-muted">
            El análisis se ejecuta en tu navegador. No guardamos prompts,
            credenciales, fragmentos, hashes ni mapas de sustitución.
          </p>
          <label class="dis-field dis-phone-region">
            <span>País de los teléfonos sin prefijo</span>
            <select
              :value="settings.phoneRegion"
              :disabled="disabled"
              @change="
                state.save({
                  phoneRegion: ($event.target as HTMLSelectElement)
                    .value as CountryCode,
                })
              "
            >
              <option
                v-for="region in phoneRegions"
                :key="region.code"
                :value="region.code"
              >
                {{ region.label }}
              </option>
            </select>
            <small class="dis-muted"
              >Los números con + o 00 se revisan por su prefijo
              internacional.</small
            >
          </label>
          <SettingsToggle
            label="Registro local de eventos"
            description="Desactivarlo detiene el registro futuro; puedes borrar los eventos existentes más abajo."
            :checked="settings.recordEvents"
            :disabled="disabled"
            @change="state.save({ recordEvents: $event })"
          /><label class="dis-setting-row"
            ><span class="dis-setting-copy"
              ><strong>Retención de eventos</strong
              ><span
                >Los eventos vencidos se eliminan al leer el registro. No hay
                limpieza en segundo plano todavía.</span
              ></span
            ><select
              aria-label="Retención de eventos"
              :value="settings.retentionDays"
              :disabled="disabled"
              @change="
                state.save({
                  retentionDays: Number(
                    ($event.target as HTMLSelectElement).value,
                  ),
                })
              "
            >
              <option
                v-if="![1, 7, 14, 30].includes(settings.retentionDays)"
                :value="settings.retentionDays"
              >
                {{ settings.retentionDays }} días
              </option>
              <option :value="1">1 día</option>
              <option :value="7">7 días</option>
              <option :value="14">14 días</option>
              <option :value="30">30 días</option>
            </select></label
          >
        </section>
        <section class="dis-card">
          <div class="dis-section-heading">
            <h2>
              Eventos locales
              <span class="dis-label neutral">{{ events.length }}</span>
            </h2>
            <button
              class="dis-button secondary small"
              type="button"
              :disabled="disabled || !events.length"
              @click="state.clearEvents"
            >
              <AppIcon name="trash" :size="16" />Borrar eventos
            </button>
          </div>
          <div v-if="!events.length" class="dis-empty">
            <AppIcon name="file" :size="32" /><strong
              >Aún no hay eventos</strong
            >
            <p>
              La demostración no genera registros. Aparecerán cuando se integre
              la prevención en plataformas.
            </p>
          </div>
          <div v-else class="dis-event-table">
            <table>
              <caption class="sr-only">
                Metadatos de eventos locales
              </caption>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Plataforma</th>
                  <th>Categoría</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(event, index) in events" :key="index">
                  <td>
                    {{ new Date(event.timestamp).toLocaleString("es-MX") }}
                  </td>
                  <td>{{ event.platform }}</td>
                  <td>{{ categoryNames[event.category] }}</td>
                  <td>{{ actionNames[event.action] }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>
      <section v-else-if="section === 'appearance'" class="dis-card">
        <h2>Apariencia y comportamiento</h2>
        <p class="dis-muted">
          La identidad verde se mantiene en todos los temas.
        </p>
        <ThemePicker
          :value="settings.theme"
          :disabled="disabled"
          @change="state.save({ theme: $event })"
        />
        <h3>Paleta de Data In Sight</h3>
        <div class="dis-swatches" aria-label="Colores de marca">
          <span
            v-for="color in [
              '#064E3B',
              '#059669',
              '#10B981',
              '#6EE7B7',
              '#F0FDF4',
            ]"
            :key="color"
            :style="{ background: color }"
            :title="color"
            ><span class="sr-only">{{ color }}</span></span
          >
        </div>
        <p class="dis-inline-note">
          <AppIcon name="info" :size="18" />Las alertas conservan una posición
          central y acciones claras. Respetamos la preferencia de movimiento
          reducido del sistema.
        </p>
      </section>
      <section
        v-else-if="section === 'demo'"
        aria-label="Demostración del motor DLP"
      >
        <DemoLab v-if="!loading && !error" :settings="settings" />
      </section>
      <section v-else class="dis-card dis-about" aria-labelledby="about-title">
        <div class="dis-about-identity">
          <SecurityCore />
          <h2>Data In Sight<span aria-hidden="true">.</span></h2>
          <p>Usa la IA con control sobre<br />lo que compartes.</p>
        </div>
        <div class="dis-about-copy">
          <h2 id="about-title">La prevención empieza antes de enviar.</h2>
          <p class="dis-muted">
            Data In Sight ayuda a reconocer datos personales y credenciales en
            texto antes de compartirlos con herramientas de inteligencia
            artificial.
          </p>
          <div class="dis-about-features">
            <article class="dis-about-feature local">
              <span class="dis-about-icon"
                ><AppIcon name="settings" :size="30"
              /></span>
              <div>
                <h3>Procesamiento local</h3>
                <p>
                  Motor de reglas y validadores, sin servicios externos de
                  análisis.
                </p>
              </div>
            </article>
            <article class="dis-about-feature limits">
              <span class="dis-about-icon"
                ><AppIcon name="info" :size="30"
              /></span>
              <div>
                <h3>Límites transparentes</h3>
                <p>
                  Las coincidencias no garantizan cobertura completa ni
                  verifican identidades.
                </p>
              </div>
            </article>
          </div>
        </div>
        <p class="dis-about-version dis-muted">
          Versión 0.1.0 · MVP en desarrollo. Demostración disponible; protección
          de envíos en preparación.
        </p>
      </section>
      <footer class="dis-options-footer"><BrandConstellation /></footer>
    </main>
  </div>
</template>

<style scoped>
.dis-about {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 30px;
  padding: 36px 30px 24px;
  border-color: color-mix(in srgb, var(--accent-cyan) 40%, var(--line));
  background-image: radial-gradient(
    ellipse at 15% 55%,
    #10b98112,
    transparent 65%
  );
}
.dis-about-identity {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding-right: 24px;
  border-right: 1px solid var(--line);
}
.dis-about-identity :deep(.dis-security-core) {
  width: 100%;
  max-width: 350px;
  height: 250px;
}
.dis-about-identity :deep(.dis-core-caption) {
  display: none;
}
.dis-about-identity h2 {
  font-size: clamp(24px, 3vw, 36px);
  font-weight: 800;
  letter-spacing: -1px;
  margin: 0 0 8px;
}
.dis-about-identity h2 span {
  color: var(--emerald);
}
.dis-about-identity h2::before {
  display: none;
}
.dis-about-identity p {
  color: var(--muted);
  font-size: 15px;
  margin: 0;
}
.dis-about-copy > h2 {
  position: relative;
  padding-left: 22px;
  font-size: 25px;
  line-height: 1.2;
  margin-bottom: 20px;
}
.dis-about-copy > h2::before {
  content: "";
  position: absolute;
  left: 0;
  top: 2px;
  width: 6px;
  height: 34px;
  border-radius: 5px;
  background: linear-gradient(#38bdf8, #10b981);
}
.dis-about-copy > p {
  font-size: 14px;
  margin-bottom: 26px;
}
.dis-about-features {
  display: grid;
  gap: 14px;
}
.dis-about-feature {
  --feature-accent: var(--accent-iris);
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 18px 16px;
  border: 1px solid color-mix(in srgb, var(--feature-accent) 45%, var(--line));
  border-radius: 15px;
  background: color-mix(in srgb, var(--feature-accent) 6%, transparent);
}
.dis-about-feature.limits {
  --feature-accent: var(--accent-gold);
}
.dis-about-icon {
  display: grid;
  place-items: center;
  flex: none;
  width: 56px;
  height: 56px;
  border: 1px solid color-mix(in srgb, var(--feature-accent) 50%, transparent);
  border-radius: 50%;
  color: var(--feature-accent);
  background: color-mix(in srgb, var(--feature-accent) 12%, transparent);
}
.dis-about-feature > div {
  border-left: 1px solid var(--feature-accent);
  padding-left: 18px;
}
.dis-about-feature h3 {
  font-size: 15px;
  margin-bottom: 8px;
}
.dis-about-feature p {
  color: var(--muted);
  font-size: 13px;
  margin: 0;
}
.dis-about-version {
  grid-column: 1 / -1;
  margin: 4px 0 0;
  padding-top: 20px;
  border-top: 1px solid var(--line);
  font-size: 12px;
}
@media (max-width: 1000px) {
  .dis-about {
    grid-template-columns: minmax(0, 1fr);
    padding: 24px;
  }
  .dis-about-identity {
    border-right: 0;
    border-bottom: 1px solid var(--line);
    padding: 0 0 24px;
  }
  .dis-about-identity :deep(.dis-security-core) {
    height: 210px;
  }
}
@media (max-width: 420px) {
  .dis-about {
    padding: 20px 16px;
  }
  .dis-about-feature {
    gap: 12px;
    padding: 16px 12px;
  }
  .dis-about-icon {
    width: 44px;
    height: 44px;
  }
  .dis-about-feature > div {
    padding-left: 12px;
  }
}
</style>
