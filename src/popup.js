const api = globalThis.browser ?? globalThis.chrome;
const { DEFAULTS, normalize, hotkeyOf, validHotkey } = globalThis.KZ;

const pretty = (h) => h.replace(/Key([A-Z])$/, "$1").replace(/Digit(\d)$/, "$1");

api.storage.local.get(DEFAULTS, (raw) => {
  const saved = normalize(raw);
  for (const key in DEFAULTS) {
    const el = document.getElementById(key);
    if (key === "hotkey") continue;
    const type = typeof DEFAULTS[key];
    el[type === "boolean" ? "checked" : "value"] = saved[key];
    el.addEventListener("input", () => {
      const v = type === "boolean" ? el.checked : type === "number" ? Number(el.value) : el.value;
      api.storage.local.set({ [key]: v });
    });
  }

  // Hotkey recorder: click the field, press a combo that includes Ctrl/Alt/Meta.
  const hk = document.getElementById("hotkey");
  const hint = document.getElementById("hint");
  const showHint = () => { hint.innerHTML = `Shortcut on YouTube: <kbd>${pretty(hk.dataset.value).split("+").join("</kbd>+<kbd>")}</kbd>`; };
  hk.dataset.value = saved.hotkey;
  hk.value = pretty(saved.hotkey);
  showHint();
  hk.addEventListener("keydown", (e) => {
    if (e.key === "Tab") return;
    e.preventDefault();
    const h = hotkeyOf(e);
    if (!h || !validHotkey(h)) { hint.textContent = "Include Ctrl, Alt or Cmd, plus a letter/digit/F-key."; return; }
    hk.dataset.value = h;
    hk.value = pretty(h);
    api.storage.local.set({ hotkey: h });
    showHint();
  });
});
