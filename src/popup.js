const api = globalThis.browser ?? globalThis.chrome;
const DEFAULTS = {
  enabled: true, cursor: "hidden", cursorColor: "#ffffff", cursorSize: 22,
  ripple: true, hideSeek: true, hideSpeed: true,
};
api.storage.local.get(DEFAULTS, (saved) => {
  for (const key in DEFAULTS) {
    const el = document.getElementById(key);
    const isBool = typeof DEFAULTS[key] === "boolean";
    el[isBool ? "checked" : "value"] = saved[key];
    el.addEventListener("input", () => {
      const v = isBool ? el.checked : el.type === "range" ? Number(el.value) : el.value;
      api.storage.local.set({ [key]: v });
    });
  }
});
