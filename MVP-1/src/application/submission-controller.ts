import {
  inspectPrompt,
  protectPrompt,
  type Inspection,
  type Settings,
} from "./index";
import type {
  EditorBinding,
  PlatformAdapter,
} from "../adapters/contracts/platform-adapter";
import type { EventInput } from "../infrastructure/messaging/contracts";
import type {
  PreventionAction,
  PreventionViewModel,
} from "../ui/prevention-types";
import { PLATFORMS } from "../domain/platforms";
import type { TabState } from "../ui/types";

interface UiSession {
  withEditorActive(operation: () => boolean): boolean;
  update(model: PreventionViewModel): void;
  destroy(): void;
}
interface Dependencies {
  openUi(
    model: PreventionViewModel,
    action: (action: PreventionAction) => void,
  ): UiSession;
  record(events: EventInput[]): Promise<void>;
  onState(state: TabState): void;
}
interface Review {
  binding: EditorBinding;
  text: string;
  revision: number;
  inspection: Inspection;
  preview: boolean;
}
interface Intent {
  binding: EditorBinding;
  text: string;
  seen: Set<string>;
}

/** Controls supported DOM submission routes only; has no network interception or persisted text. */
export function createSubmissionController(
  adapter: PlatformAdapter,
  deps: Dependencies,
) {
  let settings: Settings | undefined;
  let revision = 0;
  let ui: UiSession | undefined;
  let review: Review | undefined;
  let intent: Intent | undefined;
  let lastAttempt:
    | { binding: EditorBinding; text: string; time: number; seen: Set<string> }
    | undefined;
  let composing = false;
  let replacing = false;
  let destroyed = false;
  let known: EditorBinding | null = null;
  let error = "";
  let lastAttemptTimer: ReturnType<typeof setTimeout> | undefined;
  function rememberAttempt(binding: EditorBinding, text: string, type: string) {
    clearTimeout(lastAttemptTimer);
    lastAttempt = {
      binding,
      text,
      time: performance.now(),
      seen: new Set([type]),
    };
    lastAttemptTimer = setTimeout(() => {
      lastAttempt = undefined;
    }, 600);
  }

  function stop(event: Event) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
  function close() {
    const mounted = ui;
    ui = undefined;
    review = undefined;
    mounted?.destroy();
  }
  function state(): TabState {
    const binding = adapter.locate();
    return {
      platform: adapter.platform,
      status: !destroyed && settings && binding ? "active" : "unavailable",
      reason: destroyed
        ? "La extensión se recargó; actualiza esta pestaña."
        : !settings
          ? error || "Cargando la política local."
          : !binding
            ? `No se reconoce el editor o control de envío de ${PLATFORMS[adapter.platform].name}.`
            : error ||
              "Revisión local de texto en clic, Enter y envío de formulario del editor compatible.",
    };
  }
  function refresh() {
    if (destroyed) return;
    const current = adapter.locate();
    if (
      review &&
      (!adapter.matches(review.binding) ||
        adapter.read(review.binding) !== review.text)
    )
      close();
    if (
      known &&
      (!current ||
        known.editor !== current.editor ||
        known.scope !== current.scope ||
        known.route !== current.route)
    ) {
      close();
      intent = undefined;
      lastAttempt = undefined;
      composing = false;
    }
    known = current;
    deps.onState(state());
  }
  function record(inspection: Inspection, action: EventInput["action"]) {
    const unique = new Map(
      inspection.findings.map((finding) => [
        `${finding.category}:${finding.ruleVersion}`,
        {
          category: finding.category,
          ruleVersion: finding.ruleVersion,
          action,
        },
      ]),
    );
    if (!unique.size) return;
    void deps.record([...unique.values()].slice(0, 50)).catch(() => {
      error =
        "La revisión sigue activa, pero el registro local no está disponible.";
      if (!destroyed) deps.onState(state());
    });
  }
  function show(
    binding: EditorBinding,
    text: string,
    inspection: Inspection,
    preview = false,
    changes: NonNullable<PreventionViewModel["changes"]> = [],
  ) {
    review = { binding, text, inspection, revision, preview };
    const model: PreventionViewModel = preview
      ? { inspection, previewText: text, changes }
      : { inspection };
    if (ui) ui.update(model);
    else ui = deps.openUi(model, act);
  }
  function allowedIntent(binding: EditorBinding, text: string, type: string) {
    const current = intent;
    if (
      !current ||
      !adapter.matches(current.binding) ||
      current.binding.editor !== binding.editor ||
      current.text !== text ||
      current.seen.has(type)
    )
      return false;
    // A key handler may click the button, and the button may synchronously submit the form.
    if (type === "click" && !current.seen.has("keydown")) return false;
    if (
      type === "submit" &&
      !current.seen.has("click") &&
      !current.seen.has("keydown")
    )
      return false;
    current.seen.add(type);
    return true;
  }
  function startIntent(binding: EditorBinding, text: string, type: string) {
    const current: Intent = { binding, text, seen: new Set([type]) };
    intent = current;
    rememberAttempt(binding, text, type);
    queueMicrotask(() => {
      if (intent === current) intent = undefined;
    });
  }
  function act(action: PreventionAction) {
    const current = review;
    if (!current || !settings || destroyed) {
      close();
      return;
    }
    if (action === "cancel" || action === "edit") {
      if (action === "cancel") record(current.inspection, "CANCEL");
      close();
      if (current.binding.editor.isConnected) current.binding.editor.focus();
      return;
    }
    if (!adapter.matches(current.binding)) {
      close();
      refresh();
      return;
    }
    const text = adapter.read(current.binding);
    if (text !== current.text || current.revision !== revision) {
      close();
      refresh();
      return; // A new user attempt is required.
    }
    if (action === "protect") {
      const result = protectPrompt(text, settings);
      if (result.inspection.analysisError) {
        show(current.binding, text, result.inspection);
        return;
      }
      replacing = true;
      let replaced = false;
      try {
        replaced = ui!.withEditorActive(() =>
          adapter.replace(current.binding, result.text),
        );
      } finally {
        replacing = false;
      }
      if (!replaced) {
        error =
          "No pudimos confirmar la sustitución. Revisa el editor y vuelve a intentarlo.";
        close();
        refresh();
        return;
      }
      record(current.inspection, "SANITIZE");
      const actual = adapter.read(current.binding);
      show(
        current.binding,
        actual,
        inspectPrompt(actual, settings),
        true,
        result.changes,
      );
      return;
    }
    const inspection = inspectPrompt(text, settings);
    if (
      action !== "continue" ||
      current.preview ||
      inspection.decision !== "WARN" ||
      !inspection.canContinue
    ) {
      show(current.binding, text, inspection);
      return;
    }
    if (
      current.binding.button.disabled ||
      current.binding.button.getAttribute("aria-disabled") === "true"
    ) {
      close();
      refresh();
      return;
    }
    record(inspection, "CONTINUE");
    close();
    // Approval exists only inside this synchronous click/submit chain, for this exact binding/text.
    const approval: Intent = {
      binding: current.binding,
      text,
      seen: new Set(),
    };
    intent = approval;
    rememberAttempt(current.binding, text, "click");
    try {
      current.binding.button.click();
    } finally {
      if (intent === approval) intent = undefined;
    }
  }
  function handle(event: Event) {
    if (destroyed) return;
    const binding = adapter.locate();
    if (!binding) {
      refresh();
      return;
    }
    const target = event.target;
    const click =
      event.type === "click" &&
      target instanceof Node &&
      binding.button.contains(target);
    const key =
      event instanceof KeyboardEvent &&
      event.type === "keydown" &&
      target instanceof Node &&
      binding.editor.contains(target) &&
      event.key === "Enter" &&
      !event.shiftKey;
    const submit = event.type === "submit" && target === binding.scope;
    if (!click && !key && !submit) return;
    if (
      key &&
      ((event as KeyboardEvent).isComposing ||
        (event as KeyboardEvent).keyCode === 229 ||
        composing)
    )
      return;
    if (key && (event as KeyboardEvent).repeat) {
      stop(event);
      return;
    }
    if (click && (event as MouseEvent).detail > 1) {
      stop(event);
      return;
    }
    if (!settings) {
      stop(event);
      refresh();
      return;
    }
    const text = adapter.read(binding);
    const inspection = inspectPrompt(text, settings);
    // Re-evaluation precedes any scoped approval, so critical data always wins.
    const scoped =
      intent &&
      intent.binding.editor === binding.editor &&
      intent.binding.scope === binding.scope &&
      intent.binding.button === binding.button &&
      intent.text === text &&
      adapter.matches(intent.binding);
    if (
      scoped &&
      !inspection.analysisError &&
      inspection.decision !== "BLOCK"
    ) {
      const isApprovalClick =
        event.type === "click" && intent!.seen.size === 0 && !event.isTrusted;
      if (isApprovalClick) {
        intent!.seen.add("click");
        return;
      }
      if (allowedIntent(binding, text, event.type)) return;
    }
    if (review) {
      stop(event);
      return;
    }
    if (
      lastAttempt &&
      lastAttempt.binding.editor === binding.editor &&
      lastAttempt.binding.route === binding.route &&
      lastAttempt.text === text &&
      performance.now() - lastAttempt.time < 600
    ) {
      // Native dispatch can checkpoint microtasks between capture and default submit.
      // This continuation is only for text independently evaluated ALLOW, never a WARN approval.
      if (
        inspection.decision === "ALLOW" &&
        !lastAttempt.seen.has(event.type)
      ) {
        const followingClick =
          click && !event.isTrusted && lastAttempt.seen.has("keydown");
        const followingSubmit =
          submit &&
          event instanceof SubmitEvent &&
          event.submitter === binding.button &&
          (lastAttempt.seen.has("click") || lastAttempt.seen.has("keydown"));
        if (followingClick || followingSubmit) {
          lastAttempt.seen.add(event.type);
          return;
        }
      }
      stop(event);
      return;
    }
    if (inspection.decision === "ALLOW") {
      startIntent(binding, text, event.type);
      return;
    }
    stop(event);
    record(inspection, inspection.decision);
    try {
      show(binding, text, inspection);
    } catch {
      error =
        "No pudimos mostrar la revisión. El intento fue detenido; recarga la pestaña.";
      close();
      refresh();
    }
  }
  function input(event: Event) {
    if (replacing) return;
    if (
      review &&
      event.target instanceof Node &&
      review.binding.editor.contains(event.target)
    )
      close();
    if (
      lastAttempt &&
      event.target instanceof Node &&
      lastAttempt.binding.editor.contains(event.target)
    )
      lastAttempt = undefined;
  }
  function composition(event: Event) {
    const binding = adapter.locate();
    if (
      binding &&
      event.target instanceof Node &&
      binding.editor.contains(event.target)
    )
      composing = event.type === "compositionstart";
  }
  for (const type of ["click", "keydown", "submit"])
    window.addEventListener(type, handle, true);
  window.addEventListener("input", input, true);
  window.addEventListener("compositionstart", composition, true);
  window.addEventListener("compositionend", composition, true);
  window.addEventListener("popstate", refresh);
  window.addEventListener("hashchange", refresh);
  let frame = 0;
  const observer = new MutationObserver(() => {
    if (!frame)
      frame = requestAnimationFrame(() => {
        frame = 0;
        refresh();
      });
  });
  observer.observe(document, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [
      "disabled",
      "readonly",
      "hidden",
      "id",
      "type",
      "class",
      "contenteditable",
      "aria-label",
      "aria-disabled",
      "aria-readonly",
      "style",
      "data-mobile-composer",
      "data-composer-submit",
    ],
  });
  const timer = setInterval(refresh, 1000);
  refresh();
  return {
    state,
    setSettings(next: Settings | undefined) {
      revision++;
      settings = next;
      error = "";
      intent = undefined;
      close();
      refresh();
    },
    settingsFailed() {
      revision++;
      settings = undefined;
      error =
        "No pudimos cargar la política local. Recarga la pestaña antes de enviar.";
      close();
      refresh();
    },
    refresh,
    destroy() {
      destroyed = true;
      close();
      intent = undefined;
      lastAttempt = undefined;
      settings = undefined;
      observer.disconnect();
      clearInterval(timer);
      clearTimeout(lastAttemptTimer);
      cancelAnimationFrame(frame);
      for (const type of ["click", "keydown", "submit"])
        window.removeEventListener(type, handle, true);
      window.removeEventListener("input", input, true);
      window.removeEventListener("compositionstart", composition, true);
      window.removeEventListener("compositionend", composition, true);
      window.removeEventListener("popstate", refresh);
      window.removeEventListener("hashchange", refresh);
    },
  };
}
