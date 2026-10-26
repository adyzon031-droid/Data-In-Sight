<script setup lang="ts">
withDefaults(defineProps<{ name?: string; size?: number }>(), {
  name: "shield",
  size: 22,
});
function gearPath() {
  const points: string[] = [];
  for (let tooth = 0; tooth < 8; tooth++) {
    for (const [offset, radius] of [
      [-22.5, 7.2],
      [-16, 7.2],
      [-11, 9.5],
      [11, 9.5],
      [16, 7.2],
      [22.5, 7.2],
    ]) {
      const angle = ((tooth * 45 + offset! - 90) * Math.PI) / 180;
      points.push(
        `${(12 + radius! * Math.cos(angle)).toFixed(3)},${(12 + radius! * Math.sin(angle)).toFixed(3)}`,
      );
    }
  }
  return `M${points.join("L")}Z M15.1 12a3.1 3.1 0 1 0-6.2 0a3.1 3.1 0 1 0 6.2 0Z`;
}
const gear = gearPath();
const paths: Record<string, string> = {
  shield: "M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7l-9-4Zm-4 9 3 3 5-6",
  settings: gear,
  calendar: "M4 5h16v16H4V5Zm0 5h16M8 3v4m8-4v4M8 14h2m4 0h2m-8 4h2",
  health: "M4 4h16v16H4V4Zm8 4v8m-4-4h8",
  bank: "m3 8 9-5 9 5H3Zm2 3v7m5-7v7m4-7v7m5-7v7M3 21h18",
  card: "M3 5h18v14H3V5Zm0 5h18M6 15h4",
  mail: "M3 5h18v14H3V5Zm0 1 9 7 9-7",
  phone: "M7 3 3 5c0 8 8 16 16 16l2-4-5-3-2 2-6-6 2-2-3-5Z",
  lock: "M5 10h14v11H5V10Zm3 0V7a4 4 0 0 1 8 0v3m-4 5v2",
  warning: "M12 3 2 21h20L12 3Zm0 6v5m0 3v1",
  check: "m5 12 4 4L19 6",
  file: "M5 3h9l5 5v13H5V3Zm9 0v6h5M8 13h8m-8 4h6",
  globe:
    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c-5 6-5 12 0 18 5-6 5-12 0-18Z",
  palette:
    "M12 3a9 9 0 1 0 0 18h2c2 0 3-2 1-4-1-1 0-3 2-3h2c4-5-1-11-7-11ZM7 8h.01M12 6h.01M17 9h.01M6 13h.01",
  info: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 11v6m0-10v1",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  close: "m6 6 12 12M6 18 18 6",
  chart: "M4 20V11h3v9m4 0V6h3v14m4 0V3h3v17",
  play: "m9 5 11 7-11 7V5Z",
  trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7",
  moon: "M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z",
  sun: "M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1",
  identity:
    "M4 5h16v14H4V5Zm4 4a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-2 7c0-2 4-2 4 0m3-6h4m-4 4h4",
  fiscal: "M6 3h9l4 4v14l-3-2-3 2-3-2-4 2V3Zm8 0v5h5M9 11h6m-6 4h4",
  key: "M14 3a7 7 0 0 0-6.6 9.3L2 17.7V22h4v-3h3v-3l2.7-2.7A7 7 0 1 0 14 3Zm3 4h.01",
  scan: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M6 12h12m-7-6v3m2 6v3",
  activity: "M3 15h4l3-10 4 15 3-9 2 4h2M3 3v3m18 12v3",
};
const surfaces: Record<string, string> = {
  settings: gear,
  shield: "M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7l-9-4Z",
  mail: "M3 5h18v14H3Z",
  lock: "M5 10h14v11H5Z",
  identity: "M4 5h16v14H4Z",
  fiscal: "M6 3h9l4 4v14l-3-2-3 2-3-2-4 2Z",
  key: "M14 3a7 7 0 0 0-6.6 9.3L2 17.7V22h4v-3h3v-3l2.7-2.7A7 7 0 1 0 14 3Z",
  play: "m9 5 11 7-11 7Z",
  warning: "M12 3 2 21h20Z",
};
</script>
<template>
  <svg
    :width="size"
    :height="size"
    class="dis-app-icon"
    :data-icon="name"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path
      v-if="surfaces[name]"
      :d="surfaces[name]"
      fill="currentColor"
      fill-rule="evenodd"
      opacity=".14"
      stroke="none"
    />
    <path :d="paths[name] ?? paths.shield" />
  </svg>
</template>
