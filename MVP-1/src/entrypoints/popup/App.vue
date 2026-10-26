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
          <span class="dis-eyebrow">Estado de protección</span>
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
          <span class="dis-status-indicator" :class="{ active }"
            ><i></i
            >{{
              active ? "Control de envío disponible" : "Revisión no disponible"
            }}</span
          >
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
