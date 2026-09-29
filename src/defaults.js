// Shared by the content script and the popup (loaded first in both).
globalThis.KZ = (() => {
  const DEFAULTS = {
    enabled: true,
    cursor: "hidden", // hidden | system | dot | ring | crosshair | glow | arrow | trail
    cursorColor: "#ffffff",
    cursorSize: 22,
    ripple: true,
    hideSeek: true,
    hideSpeed: true,
  };
  const CURSORS = ["hidden", "system", "dot", "ring", "crosshair", "glow", "arrow", "trail"];

  // Coerce anything read from storage into a valid settings object.
  function normalize(raw) {
    const s = { ...DEFAULTS, ...raw };
    for (const k of ["enabled", "ripple", "hideSeek", "hideSpeed"]) s[k] = s[k] !== false;
    if (!CURSORS.includes(s.cursor)) s.cursor = DEFAULTS.cursor;
    if (!/^#[0-9a-f]{6}$/i.test(s.cursorColor)) s.cursorColor = DEFAULTS.cursorColor;
    const n = Number(s.cursorSize);
    s.cursorSize = Number.isFinite(n) ? Math.min(56, Math.max(12, n)) : DEFAULTS.cursorSize;
    return s;
  }
  return { DEFAULTS, normalize };
})();
