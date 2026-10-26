<script setup lang="ts">
import { computed } from "vue";
import type { Category, ProtectionChange } from "../../application";
import AppIcon from "./AppIcon.vue";
const props = defineProps<{ changes: ProtectionChange[] }>();
const categoryCount = computed(
  () => new Set(props.changes.map((change) => change.category)).size,
);
const names: Record<Category, string> = {
  email: "Correo electrónico",
  phone: "Número de teléfono",
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
  token: "Token de acceso",
};
</script>
<template>
  <section class="dis-change-report" aria-label="Cambios realizados">
    <div class="dis-change-summary">
      <span class="dis-icon-tile"><AppIcon name="shield" /></span>
      <div>
        <strong
          >{{ changes.length }}
          {{
            changes.length === 1 ? "dato protegido" : "datos protegidos"
          }}</strong
        >
        <span
          >{{ categoryCount }}
          {{ categoryCount === 1 ? "categoría" : "categorías" }} · Sustitución
          local</span
        >
      </div>
    </div>
    <ol
      class="dis-change-list"
      tabindex="0"
      aria-label="Detalle de sustituciones"
    >
      <li
        v-for="change in changes"
        :key="change.id"
        :class="{ concealed: change.concealed }"
      >
        <strong class="dis-change-category">{{
          names[change.category]
        }}</strong>
        <div class="dis-change-values">
          <div>
            <small
              >Antes{{ change.concealed ? " · Credencial oculta" : "" }}</small
            ><code>{{ change.before }}</code>
          </div>
          <AppIcon name="arrow" :size="18" />
          <div>
            <small>Después</small><code>{{ change.after }}</code>
          </div>
        </div>
      </li>
    </ol>
    <p class="dis-muted">
      Estos cambios solo se muestran en esta revisión; no se guardan en el
      historial.
    </p>
  </section>
</template>
