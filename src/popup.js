const api = globalThis.browser ?? globalThis.chrome;
const { DEFAULTS, normalize } = globalThis.KZ;
api.storage.local.get(DEFAULTS, (raw) => {
  const saved = normalize(raw);
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
