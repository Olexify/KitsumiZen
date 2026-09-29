// KitsumiZen content script. Toggles a single attribute on <html>;
// all visual work is done by zen.css.
(() => {
  const api = globalThis.browser ?? globalThis.chrome;
  const ATTR = "data-kitsumizen";
  const KEY = "enabled";
  const root = document.documentElement;

  const apply = (on) => {
    if (on) root.setAttribute(ATTR, "");
    else root.removeAttribute(ATTR);
  };

  // Default ON immediately (avoids a flash of UI), then read the saved state.
  apply(true);
  try {
    api.storage.local.get(KEY, (res) => {
      if (res && KEY in res) apply(res[KEY] !== false);
    });
    api.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes[KEY]) apply(changes[KEY].newValue !== false);
    });
  } catch (_) { /* storage unavailable: stay enabled */ }

  // Hotkey: Alt+Shift+Z toggles. Capture phase so YouTube can't swallow it.
  window.addEventListener("keydown", (e) => {
    if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && e.code === "KeyZ") {
      e.preventDefault();
      const next = !root.hasAttribute(ATTR);
      apply(next);
      try { api.storage.local.set({ [KEY]: next }); } catch (_) {}
    }
  }, true);
})();
