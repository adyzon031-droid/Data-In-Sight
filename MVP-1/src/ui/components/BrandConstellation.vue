<script setup lang="ts">
import { useId } from "vue";
import logo from "../../assets/brand/logo-transparent-v2.png";
import { assetUrl } from "../services/assets";
const id = useId();
</script>
<template>
  <div class="dis-brand-constellation" aria-hidden="true">
    <svg viewBox="0 0 920 116" fill="none" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient :id="`${id}-flow`">
          <stop stop-color="#38bdf8" stop-opacity="0" />
          <stop offset=".25" stop-color="#38bdf8" />
          <stop offset=".5" stop-color="#6ee7b7" />
          <stop offset=".75" stop-color="#c4a0ff" />
          <stop offset="1" stop-color="#c4a0ff" stop-opacity="0" />
        </linearGradient>
        <radialGradient :id="`${id}-aura`">
          <stop stop-color="#6ee7b7" stop-opacity=".18" />
          <stop offset="1" stop-color="#6ee7b7" stop-opacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="460" cy="58" rx="340" ry="58" :fill="`url(#${id}-aura)`" />
      <g :stroke="`url(#${id}-flow)`">
        <path d="M15 57h160l22-22h99l24 24h83m114 0h83l24-24h100l22 22h159" />
        <path
          d="M65 76h147l20 19h94l30-22h47m114 0h47l30 22h94l20-19h147"
          opacity=".35"
        />
        <path
          d="M128 26h117l26-15h67l36 31h39m94 0h39l36-31h67l26 15h117"
          opacity=".25"
        />
      </g>
      <g fill="#38bdf8">
        <circle cx="198" cy="35" r="3" />
        <circle cx="325" cy="95" r="2" />
      </g>
      <g fill="#bc9bff">
        <circle cx="722" cy="35" r="3" />
        <circle cx="595" cy="95" r="2" />
      </g>
      <circle cx="460" cy="58" r="39" stroke="#6ee7b7" stroke-opacity=".25" />
      <circle
        cx="460"
        cy="58"
        r="49"
        stroke="#9fb9ca"
        stroke-opacity=".15"
        stroke-dasharray="2 8"
      />
      <g stroke="#6ee7b7" stroke-opacity=".5">
        <path d="M411 58h7m84 0h7M460 9v7m0 84v7" />
      </g>
    </svg>
    <img :src="assetUrl(logo)" alt="" />
  </div>
</template>
