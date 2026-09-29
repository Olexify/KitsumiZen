// End-to-end check in Chromium against a mock YouTube player (no real network).
// Usage: npm install && npm test   (set CHROME_PATH to use a specific Chromium)
const { chromium } = require("playwright");
const crypto = require("crypto");
const path = require("path");
const assert = require("assert");

const EXT = path.resolve(__dirname, "..");
const MOCK = `<html><body style="margin:0"><div class="html5-video-player" style="position:relative;width:640px;height:360px">
<video></video><div class="ytp-chrome-bottom"></div><div class="ytp-ce-element"></div>
<div class="ytp-bezel"></div><div class="ytp-speedmaster-overlay"></div>
<div class="ytp-caption-window-container"></div></div></body></html>`;

(async () => {
  // Unpacked extension ids are derived from the folder path.
  const id = [...crypto.createHash("sha256").update(EXT).digest("hex").slice(0, 32)]
    .map((c) => String.fromCharCode(97 + parseInt(c, 16))).join("");
  const ctx = await chromium.launchPersistentContext(
    path.join(require("os").tmpdir(), "kz-e2e-profile"),
    { headless: false, executablePath: process.env.CHROME_PATH || undefined,
      args: [`--disable-extensions-except=${EXT}`, `--load-extension=${EXT}`, "--headless=new"] });
  try {
    await ctx.route("**/*", (r) => r.fulfill({ contentType: "text/html", body: MOCK }));
    const pop = await ctx.newPage();
    await pop.goto(`chrome-extension://${id}/src/popup.html`);
    const set = (o) => pop.evaluate((o) => new Promise((r) => chrome.storage.local.set(o, r)), o);
    await set({ enabled: true, cursor: "hidden", hideSeek: true, hideSpeed: true });

    const p = await ctx.newPage();
    await p.goto("https://www.youtube.com/watch?v=x");
    const shown = (s) => p.$eval(s, (e) => getComputedStyle(e).display !== "none");
    const settle = () => p.waitForTimeout(200);

    assert.equal(await shown(".ytp-chrome-bottom"), false, "control bar hidden");
    assert.equal(await shown(".ytp-ce-element"), false, "end card hidden");
    assert.equal(await shown(".ytp-caption-window-container"), true, "captions kept");

    await set({ hideSeek: false }); await settle();
    assert.equal(await shown(".ytp-bezel"), true, "seek popup shows when option off");
    await set({ hideSeek: true, hideSpeed: false }); await settle();
    assert.equal(await shown(".ytp-speedmaster-overlay"), true, "2x shows when option off");
    await set({ hideSpeed: true });

    await p.keyboard.press("Alt+Shift+KeyZ"); await settle();
    assert.equal(await shown(".ytp-chrome-bottom"), true, "hotkey disables");
    await p.keyboard.press("Alt+Shift+KeyZ"); await settle();
    assert.equal(await shown(".ytp-chrome-bottom"), false, "hotkey re-enables");

    for (const style of ["dot", "ring", "crosshair", "glow", "arrow", "trail"]) {
      await set({ cursor: style }); await settle();
      await p.mouse.move(100, 100); await p.mouse.move(300, 200, { steps: 5 });
      await p.mouse.down(); await p.waitForTimeout(80);
      const r = await p.evaluate(() => ({
        on: !!document.querySelector(".kz-cursor") && !document.querySelector(".kz-cursor").classList.contains("kz-off"),
        ripple: !!document.querySelector(".kz-ripple"),
      }));
      await p.mouse.up();
      assert.ok(r.on && r.ripple, `${style}: pointer + ripple render`);
    }
    await p.mouse.move(700, 500); await settle();
    assert.ok(await p.$eval(".kz-cursor", (e) => e.classList.contains("kz-off")), "pointer hides outside player");

    await set({ cursor: "system" }); await settle();
    assert.equal(await p.$(".kz-cursor"), null, "no custom pointer in system mode");

    await set({ cursor: "bogus", cursorColor: "red;}", cursorSize: "x" }); await settle();
    assert.equal(await p.evaluate(() => document.documentElement.getAttribute("data-kz-cursor")), "hidden", "bad stored values fall back");
    console.log("e2e: all checks passed");
  } finally {
    await ctx.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
