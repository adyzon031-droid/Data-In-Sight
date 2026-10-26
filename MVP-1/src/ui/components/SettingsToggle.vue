<script setup lang="ts">
import AppIcon from "./AppIcon.vue";
defineProps<{
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  icon?: string;
  tone?: string;
}>();
defineEmits<{ change: [value: boolean] }>();
</script>
<template>
  <label class="dis-setting-row">
    <span v-if="icon" class="dis-setting-illustration" :class="tone"
      ><AppIcon :name="icon" :size="23"
    /></span>
    <span class="dis-setting-copy"
      ><strong>{{ label }}</strong
      ><span>{{ description }}</span></span
    >
    <input
      class="dis-switch"
      type="checkbox"
      role="switch"
      :aria-label="label"
      :checked="checked"
      :disabled="disabled"
      @change="$emit('change', ($event.target as HTMLInputElement).checked)"
    />
  </label>
</template>
