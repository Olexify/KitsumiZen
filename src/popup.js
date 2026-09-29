const api = globalThis.browser ?? globalThis.chrome;
const box = document.getElementById("toggle");
api.storage.local.get("enabled", (r) => { box.checked = r.enabled !== false; });
box.addEventListener("change", () => api.storage.local.set({ enabled: box.checked }));
