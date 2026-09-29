// KitsumiZen content script. Mirrors settings onto <html> attributes (zen.css does
// the hiding) and draws the optional custom pointer inside the player element.
(() => {
  const api = globalThis.browser ?? globalThis.chrome;
  const root = document.documentElement;
  const { DEFAULTS, normalize } = globalThis.KZ;
  const CUSTOM = new Set(["dot", "ring", "crosshair", "glow", "arrow", "trail"]);
  const EASED = new Set(["ring", "glow"]);
  const TRAIL_LEN = 9;
  let S = normalize();

  const flag = (name, on) =>
    on ? root.setAttribute(name, "") : root.removeAttribute(name);

  function apply() {
    flag("data-kitsumizen", S.enabled);
    flag("data-kz-seek", S.hideSeek);
    flag("data-kz-speed", S.hideSpeed);
    root.setAttribute("data-kz-cursor", S.cursor);
    root.style.setProperty("--kz-color", S.cursorColor);
    root.style.setProperty("--kz-size", `${S.cursorSize}px`);
    syncCursor();
  }

  // ---------- custom pointer ----------
  let box = null, ptr = null, trail = [];
  let active = false, raf = 0;
  let mx = 0, my = 0, tx = 0, ty = 0, cx = 0, cy = 0, player = null, snap = true;

  function build() {
    box = document.createElement("div");
    box.className = "kz-cursor kz-off";
    ptr = document.createElement("div");
    ptr.className = "kz-ptr";
    ptr.innerHTML = '<div class="kz-shape"></div>';
    box.appendChild(ptr);
    trail = [];
  }

  function syncCursor() {
    const want = S.enabled && CUSTOM.has(S.cursor);
    if (want && !active) {
      active = true;
      if (!box) build();
      window.addEventListener("pointermove", onMove, true);
      window.addEventListener("pointerdown", onDown, true);
      window.addEventListener("pointerup", onUp, true);
      document.documentElement.addEventListener("pointerleave", hide);
    } else if (!want && active) {
      active = false;
      window.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("pointerup", onUp, true);
      document.documentElement.removeEventListener("pointerleave", hide);
      cancelAnimationFrame(raf); raf = 0;
      box?.remove();
    }
    if (!active) return;
    box.dataset.style = S.cursor;
    // trail dots exist only for the trail style
    const n = S.cursor === "trail" ? TRAIL_LEN : 0;
    while (trail.length > n) trail.pop().el.remove();
    while (trail.length < n) {
      const el = document.createElement("div");
      el.className = "kz-t";
      const i = trail.length;
      const k = 1 - (i + 1) / (TRAIL_LEN + 1);
      el.style.opacity = (0.55 * k).toFixed(3);
      el.style.scale = (0.25 + 0.75 * k).toFixed(3);
      box.insertBefore(el, ptr);
      trail.push({ el, x: cx, y: cy });
    }
  }

  function hide() { box?.classList.add("kz-off"); }

  function onMove(e) {
    if (e.pointerType === "touch") return;
    const p = e.target instanceof Element ? e.target.closest(".html5-video-player") : null;
    if (!p) return hide();
    if (box.parentNode !== p) { p.appendChild(box); snap = true; }
    player = p;
    mx = e.clientX; my = e.clientY;
    if (snap || box.classList.contains("kz-off")) { snap = true; measure(); }
    box.classList.remove("kz-off");
    if (!raf) raf = requestAnimationFrame(tick);
  }

  // Player-relative target position; measured once per frame, not per event.
  function measure() {
    const r = player.getBoundingClientRect();
    tx = mx - r.left;
    ty = my - r.top;
    if (snap) {
      cx = tx; cy = ty; snap = false;
      trail.forEach((t) => { t.x = tx; t.y = ty; });
    }
  }

  function tick() {
    raf = 0;
    if (!active || box.classList.contains("kz-off")) return;
    measure();
    const f = EASED.has(S.cursor) ? 0.22 : 1;
    cx += (tx - cx) * f;
    cy += (ty - cy) * f;
    ptr.style.transform = `translate(${cx}px, ${cy}px)`;
    let px = cx, py = cy, moving = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.1;
    for (const t of trail) {
      t.x += (px - t.x) * 0.4;
      t.y += (py - t.y) * 0.4;
      t.el.style.transform = `translate(${t.x}px, ${t.y}px)`;
      if (Math.abs(px - t.x) + Math.abs(py - t.y) > 0.1) moving = true;
      px = t.x; py = t.y;
    }
    if (moving) raf = requestAnimationFrame(tick);
  }

  function onDown(e) {
    if (!player || box.classList.contains("kz-off") || e.button !== 0) return;
    box.classList.add("kz-down");
    if (!S.ripple) return;
    const r = document.createElement("div");
    r.className = "kz-ripple";
    r.style.setProperty("--x", `${tx}px`);
    r.style.setProperty("--y", `${ty}px`);
    r.addEventListener("animationend", () => r.remove());
    box.appendChild(r);
  }
  function onUp() { box?.classList.remove("kz-down"); }

  // ---------- settings ----------
  apply(); // defaults immediately (no flash of UI), then saved values
  try {
    api.storage.local.get(DEFAULTS, (res) => { if (res) { S = normalize(res); apply(); } });
    api.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      const next = { ...S };
      for (const k in changes) if (k in DEFAULTS) next[k] = changes[k].newValue;
      S = normalize(next);
      apply();
    });
  } catch (_) { /* storage unavailable: defaults stay */ }

  // Hotkey: Alt+Shift+Z toggles. Capture phase so YouTube can't swallow it.
  window.addEventListener("keydown", (e) => {
    if (e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && e.code === "KeyZ") {
      e.preventDefault();
      S.enabled = !S.enabled;
      apply();
      try { api.storage.local.set({ enabled: S.enabled }); } catch (_) {}
    }
  }, true);
})();
