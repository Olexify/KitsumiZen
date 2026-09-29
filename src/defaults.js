// Shared by the content script and the popup (loaded first in both).
globalThis.KZ = (() => {
  const DEFAULTS = {
    enabled: true,
    scope: "always", // always | fullscreen
    hotkey: "Alt+Shift+KeyZ",
    hideSeek: true,
    hideSpeed: true,
    hideCaptions: false,
    hidePage: false, // hide masthead, sidebar, comments, etc. (best effort)
    cursor: "hidden", // hidden | system | dot | ring | crosshair | glow | arrow | trail
    cursorColor: "#ffffff",
    cursorSize: 22,
    cursorOpacity: 100, // percent
    idleHide: 0, // seconds until the custom pointer fades; 0 = never
    ripple: true,
  };
  const CURSORS = ["hidden", "system", "dot", "ring", "crosshair", "glow", "arrow", "trail"];
  const HOTKEY_RE = /^(?:(?:Ctrl|Alt|Shift|Meta)\+)+(?:Key[A-Z]|Digit\d|F\d{1,2})$/;
  const clamp = (v, lo, hi, d) => (Number.isFinite(+v) ? Math.min(hi, Math.max(lo, +v)) : d);

  // "Alt+Shift+KeyZ" for a keydown event, or null for a bare modifier press.
  function hotkeyOf(e) {
    if (/^(Control|Alt|Shift|Meta)(Left|Right)$/.test(e.code)) return null;
    const mods = [e.ctrlKey && "Ctrl", e.altKey && "Alt", e.shiftKey && "Shift", e.metaKey && "Meta"];
    return [...mods.filter(Boolean), e.code].join("+");
  }
  // Must include Ctrl/Alt/Meta so plain typing never triggers it.
  const validHotkey = (h) => HOTKEY_RE.test(h) && /(?:Ctrl|Alt|Meta)\+/.test(h);

  // Coerce anything read from storage into a valid settings object.
  function normalize(raw) {
    const s = { ...DEFAULTS, ...raw };
    for (const k of ["enabled", "ripple", "hideSeek", "hideSpeed"]) s[k] = s[k] !== false;
    for (const k of ["hideCaptions", "hidePage"]) s[k] = s[k] === true;
    if (!["always", "fullscreen"].includes(s.scope)) s.scope = DEFAULTS.scope;
    if (!validHotkey(s.hotkey)) s.hotkey = DEFAULTS.hotkey;
    if (!CURSORS.includes(s.cursor)) s.cursor = DEFAULTS.cursor;
    if (!/^#[0-9a-f]{6}$/i.test(s.cursorColor)) s.cursorColor = DEFAULTS.cursorColor;
    s.cursorSize = clamp(s.cursorSize, 12, 56, DEFAULTS.cursorSize);
    s.cursorOpacity = clamp(s.cursorOpacity, 20, 100, DEFAULTS.cursorOpacity);
    s.idleHide = clamp(s.idleHide, 0, 10, DEFAULTS.idleHide);
    return s;
  }
  return { DEFAULTS, normalize, hotkeyOf, validHotkey };
})();
