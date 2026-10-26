<script setup lang="ts">
import { useId } from "vue";
import logo from "../../assets/brand/logo-transparent-v2.png";
import { assetUrl } from "../services/assets";
withDefaults(
  defineProps<{
    compact?: boolean;
    tone?: "neutral" | "safe" | "warning" | "critical";
  }>(),
  { compact: false, tone: "neutral" },
);
const id = useId();
</script>
<template>
  <div
    class="dis-security-core"
    :class="[`core-tone-${tone}`, { compact }]"
    aria-hidden="true"
  >
    <svg viewBox="0 0 360 290" fill="none" class="dis-core-orbits">
      <defs>
        <radialGradient :id="`${id}-halo`">
          <stop stop-color="currentColor" stop-opacity=".22" />
          <stop offset="1" stop-color="currentColor" stop-opacity="0" />
        </radialGradient>
        <linearGradient
          :id="`${id}-orbit`"
          x1="30"
          y1="20"
          x2="300"
          y2="260"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="currentColor" stop-opacity=".9" />
          <stop offset=".5" stop-color="currentColor" stop-opacity=".1" />
          <stop offset="1" stop-color="currentColor" stop-opacity=".7" />
        </linearGradient>
        <linearGradient
          :id="`${id}-spectrum`"
          x1="35"
          y1="50"
          x2="310"
          y2="220"
          gradientUnits="userSpaceOnUse"
        >
          <stop stop-color="#38bdf8" />
          <stop offset=".48" stop-color="#6ee7b7" />
          <stop offset="1" stop-color="#b797ff" />
        </linearGradient>
      </defs>
      <ellipse cx="180" cy="145" rx="155" ry="140" :fill="`url(#${id}-halo)`" />
      <g stroke="currentColor" opacity=".14">
        <path d="M180 9v272M25 145h310M70 35l220 220M70 255 290 35" />
        <circle cx="180" cy="145" r="112" stroke-dasharray="2 8" />
        <circle cx="180" cy="145" r="132" stroke-dasharray="1 22" />
      </g>
      <ellipse
        cx="180"
        cy="145"
        rx="151"
        ry="65"
        transform="rotate(-25 180 145)"
        :stroke="`url(#${id}-spectrum)`"
      />
      <ellipse
        cx="180"
        cy="145"
        rx="110"
        ry="111"
        :stroke="`url(#${id}-orbit)`"
        stroke-dasharray="185 95 50 75"
      />
      <path
        d="M77 82h-33v-21M283 210h32v23M288 63h23v18M48 224h26"
        stroke="currentColor"
        opacity=".5"
      />
      <g fill="currentColor">
        <circle cx="48" cy="185" r="4" />
        <circle cx="311" cy="84" r="3" />
        <circle cx="220" cy="36" r="3" />
        <circle cx="128" cy="241" r="2" />
      </g>
      <circle cx="311" cy="84" r="4" fill="#b797ff" />
      <circle cx="48" cy="185" r="4" fill="#38bdf8" />
      <circle cx="220" cy="36" r="3" fill="#f5c879" />
      <g stroke="currentColor" opacity=".65">
        <path d="M28 142h10m-5-5v10M313 154h10m-5-5v10" />
        <path
          d="m180 49 73 41v88l-73 43-73-43V90l73-41Z"
          stroke-dasharray="6 5"
          opacity=".25"
        />
      </g>
    </svg>
    <img :src="assetUrl(logo)" class="dis-core-logo" alt="" />
    <span v-if="!compact" class="dis-core-caption top"
      >ANÁLISIS LOCAL <i></i
    ></span>
    <span v-if="!compact" class="dis-core-caption bottom"
      >DATA IN SIGHT / DLP</span
    >
  </div>
</template>
