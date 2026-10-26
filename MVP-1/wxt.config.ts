import { PLATFORM_MATCHES } from "./src/domain/platforms";
import { defineConfig } from "wxt";

export default defineConfig({
  srcDir: "src",
  manifestVersion: 3,
  modules: ["@wxt-dev/module-vue"],
  manifest: {
    name: "Data In Sight",
    description:
      "Prevención local de exposición accidental de información sensible a IA.",
    permissions: ["storage"],
    host_permissions: PLATFORM_MATCHES,
    web_accessible_resources: [
      {
        resources: ["assets/*.png", "assets/*.woff2"],
        matches: PLATFORM_MATCHES,
      },
    ],
  },
});
