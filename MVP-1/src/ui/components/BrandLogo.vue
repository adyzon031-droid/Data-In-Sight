<script setup lang="ts">
import logo from "../../assets/brand/logo-transparent-v2.png";
import { assetUrl } from "../services/assets";
withDefaults(defineProps<{ compact?: boolean; subtitle?: string }>(), {
  compact: false,
  subtitle: "Protección de datos para IA",
});
</script>
<template>
  <div class="dis-brand">
    <span class="dis-brand-symbol"><img :src="assetUrl(logo)" alt="" /></span>
    <div v-if="!compact">
      <div class="dis-brand-name">
        Data In Sight<span class="dis-brand-dot" aria-hidden="true">.</span>
      </div>
      <div class="dis-brand-subtitle">{{ subtitle }}</div>
    </div>
    <span v-else class="sr-only">Data In Sight</span>
  </div>
</template>
