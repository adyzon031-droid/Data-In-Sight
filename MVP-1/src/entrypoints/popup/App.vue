<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useUiState } from "../../ui/services/state";
import AppIcon from "../../ui/components/AppIcon.vue";
import BrandLogo from "../../ui/components/BrandLogo.vue";
import SecurityCore from "../../ui/components/SecurityCore.vue";
const state = useUiState();
const { loading, error, tab, events } = state;
onMounted(state.load);
const todayEvents = computed(() =>
  events.value.filter(
    (event) =>
      new Date(event.timestamp).toDateString() === new Date().toDateString(),
  ),
);
const stats = computed(() =>
  [
    { label: "Alertas", action: "WARN", icon: "warning", tone: "amber" },
    { label: "Bloqueos", action: "BLOCK", icon: "lock", tone: "danger" },
    { label: "Protecciones", action: "SANITIZE", icon: "shield", tone: "mint" },
  ].map((item) => ({
    ...item,
    count: todayEvents.value.filter((event) => event.action === item.action)
      .length,
  })),
);
const categories = [
  { name: "Correos electrónicos", icon: "mail" },
  { name: "Teléfonos internacionales", icon: "phone" },
  { name: "CURP y RFC", icon: "file" },
  { name: "CLABE y tarjetas", icon: "card" },
  { name: "NSS e identificación", icon: "identity" },
  { name: "Nombre, domicilio y nacimiento", icon: "calendar" },
  { name: "Salud y expedientes", icon: "health" },
  { name: "Credenciales", icon: "lock" },
];
const active = computed(
  () => !loading.value && !error.value && tab.value.status === "active",
);
</script>
<template>
  <main class="dis-root dis-popup">
    <header class="dis-popup-header">
      <BrandLogo /><button
        class="dis-icon-button"
        type="button"
        aria-label="Abrir configuración"
        @click="state.openOptions"
      >
        <AppIcon name="settings" />
      </button>
    </header>
    <div class="dis-popup-content">
      <section
        class="dis-status-card"
        :class="{ available: active }"
        aria-labelledby="protection-title"
      >
        <SecurityCore compact :tone="active ? 'safe' : 'neutral'" />
        <div>
          <span class="dis-eyebrow"
            ><i aria-hidden="true"></i>Estado de protección</span
          >
          <h1 id="protection-title">
            {{
              loading
                ? "Comprobando…"
                : active
                  ? "Protección activa"
                  : tab.status === "unsupported"
                    ? "Sitio no compatible"
                    : "Protección no disponible"
            }}
          </h1>
          <p>
            {{ tab.reason }}
          </p>
          <span v-if="active" class="dis-status-indicator active">
            <i></i>Control de envío disponible
          </span>
        </div>
      </section>
      <section
        v-if="!loading && !active"
        class="dis-review-notice"
        role="status"
      >
        <i aria-hidden="true"></i>
        <AppIcon name="warning" :size="26" />
        <div>
          <strong>Revisión no disponible</strong>
          <p>No se pudo analizar el contenido de esta página.</p>
        </div>
      </section>
      <p v-if="state.environment === 'preview'" class="dis-preview-label">
        Vista previa de interfaz · Datos en memoria
      </p>
      <p v-if="error" class="dis-error" role="alert">
        {{ error }}
        <button type="button" class="dis-link" @click="state.load">
          Reintentar
        </button>
      </p>
      <section class="dis-popup-section" aria-labelledby="today-title">
        <div class="dis-section-heading">
          <h2 id="today-title">Actividad de hoy</h2>
          <span class="dis-muted">Solo en este navegador</span>
        </div>
        <div class="dis-stats">
          <div
            v-for="stat in stats"
            :key="stat.action"
            class="dis-stat"
            :class="stat.tone"
          >
            <div>
              <strong>{{ loading || error ? "—" : stat.count }}</strong
              ><AppIcon :name="stat.icon" :size="18" />
            </div>
            <span>{{ stat.label }}</span>
          </div>
        </div>
        <p class="dis-micro">
          Eventos por categoría detectada. Sin historial de mensajes.
        </p>
      </section>
      <section class="dis-popup-section" aria-labelledby="rules-title">
        <div class="dis-section-heading">
          <h2 id="rules-title">Motor de detección</h2>
          <span class="dis-label positive">Local</span>
        </div>
        <ul class="dis-category-list">
          <li v-for="category in categories" :key="category.name">
            <AppIcon :name="category.icon" :size="20" /><span>{{
              category.name
            }}</span
            ><span class="dis-rule-ready">Disponible</span>
          </li>
        </ul>
        <p class="dis-micro">
          Revisión local en la demostración y en editores compatibles de
          ChatGPT, Claude o Gemini.
        </p>
      </section>
      <button
        class="dis-button primary"
        type="button"
        @click="state.openOptions"
      >
        <AppIcon name="settings" :size="18" />Ver configuración
      </button>
      <footer class="dis-popup-footer">
        <AppIcon name="lock" :size="13" />Sin servidores de análisis · v0.1.0
      </footer>
    </div>
  </main>
</template>

<style scoped>
.dis-status-card,
.dis-status-card.available {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  justify-items: center;
  text-align: center;
  gap: 0;
  min-height: 0;
  padding: 7px 18px 20px;
  border: 1px solid #159f70;
  border-radius: 15px;
  background:
    radial-gradient(ellipse at 15% 65%, #08623f, transparent 80%), #0b3027;
}
.dis-status-card :deep(.dis-security-core.compact) {
  width: 190px;
  max-width: 100%;
  height: 115px;
}
.dis-status-card .dis-eyebrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 3px 11px;
  border: 1px solid #40bc9670;
  border-radius: 999px;
  background: #07543e70;
  font-size: 10px;
  line-height: 2;
  letter-spacing: 1.6px;
  color: #96cdb7;
}
.dis-status-card .dis-eyebrow i {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #c5ad71;
}
.dis-status-card.available .dis-eyebrow i {
  background: #10b981;
  box-shadow: 0 0 10px #10b98155;
}
.dis-status-card > div:last-child {
  min-width: 0;
}
.dis-status-card h1 {
  font-family: "Manrope Variable", sans-serif;
  font-size: 24px;
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: -0.4px;
  overflow-wrap: break-word;
  margin: 13px 0 8px;
}
.dis-status-card p {
  color: #b3c9d6;
  font-size: 14px;
  line-height: 1.45;
  max-width: 280px;
  margin-inline: auto;
}
.dis-review-notice {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 11px;
  padding: 15px 19px;
  border: 1px solid #ffe0b6;
  border-radius: 13px;
  background: #fff6e9;
  color: #aa5400;
}
.dis-review-notice > i {
  width: 10px;
  height: 10px;
  flex: none;
  margin-top: 5px;
  border-radius: 50%;
  background: #ffcc80;
}
.dis-review-notice strong {
  font-size: 13px;
  font-weight: 800;
}
.dis-review-notice p {
  margin: 2px 0 0;
  font-size: 11px;
  line-height: 1.5;
  color: #596257;
}
</style>
