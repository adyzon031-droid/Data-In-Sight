<script setup lang="ts">
import type { Category, Finding } from "../../application";
import AppIcon from "./AppIcon.vue";
defineProps<{ findings: Finding[] }>();
const names: Record<Category, string> = {
  email: "Correo electrónico",
  phone: "Número de teléfono",
  curp: "Posible CURP",
  rfc: "Posible RFC",
  clabe: "Posible CLABE",
  card: "Posible tarjeta bancaria",
  nss: "Posible NSS",
  ine: "Identificador INE",
  passport: "Pasaporte",
  license: "Licencia de conducir",
  name: "Nombre completo",
  address: "Domicilio",
  "birth-date": "Fecha de nacimiento",
  health: "Información de salud",
  password: "Posible contraseña",
  "api-key": "Clave API",
  token: "Token de acceso",
};
const icons: Record<Category, string> = {
  email: "mail",
  phone: "phone",
  curp: "file",
  rfc: "file",
  clabe: "bank",
  card: "card",
  nss: "identity",
  ine: "identity",
  passport: "identity",
  license: "identity",
  name: "identity",
  address: "globe",
  "birth-date": "calendar",
  health: "health",
  password: "lock",
  "api-key": "lock",
  token: "lock",
};
</script>
<template>
  <ul class="dis-findings" aria-label="Información detectada">
    <li v-for="finding in findings" :key="finding.id">
      <span
        class="dis-icon-tile"
        :class="finding.severity === 'critical' ? 'danger' : 'amber'"
        ><AppIcon :name="icons[finding.category]"
      /></span>
      <div>
        <strong>{{ names[finding.category] }}</strong
        ><span class="dis-masked">•••••••• <span>Valor oculto</span></span
        ><small>{{ finding.explanation }}</small>
      </div>
    </li>
  </ul>
</template>
