import { createApp } from "vue";
import App from "./App.vue";
import "../../ui/styles/base.css";
import { UI_STATE, createUiState } from "../../ui/services/state";
import { extensionClient } from "../../ui/services/extension-client";

createApp(App).provide(UI_STATE, createUiState(extensionClient)).mount("#app");
