<script setup lang="ts">
import type { Settings } from "../../application";
import AppIcon from "./AppIcon.vue";
defineProps<{ value: Settings["theme"]; disabled?: boolean }>();
defineEmits<{ change: [value: Settings["theme"]] }>();
const themes = [
  { id: "light", label: "Claro", icon: "sun" },
  { id: "dark", label: "Oscuro", icon: "moon" },
  { id: "system", label: "Sistema", icon: "globe" },
] as const;
</script>
<template>
  <fieldset class="dis-theme-picker" :disabled="disabled">
    <legend>Tema de la interfaz</legend>
    <label
      v-for="theme in themes"
      :key="theme.id"
      class="dis-theme-choice"
      :class="{ selected: value === theme.id }"
    >
      <input
        type="radio"
        name="appearance-theme"
        :value="theme.id"
        :checked="value === theme.id"
        @change="$emit('change', theme.id)"
      />
      <span class="dis-theme-sample" :class="theme.id"
        ><span></span><span></span><span></span
      ></span>
      <span><AppIcon :name="theme.icon" :size="16" /> {{ theme.label }}</span>
    </label>
  </fieldset>
</template>
