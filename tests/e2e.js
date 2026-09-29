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
<div class="ytp-caption-window-container"></div></div><div id="below">below</div><div id="masthead-container">m</div></body></html>`;

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

    // new options
    await set({ hideCaptions: true }); await settle();
    assert.equal(await shown(".ytp-caption-window-container"), false, "captions hide on request");
    await set({ hideCaptions: false, hidePage: true }); await settle();
    assert.equal(await shown("#below"), false, "rest of page hidden");
    assert.equal(await shown(".html5-video-player"), true, "player itself stays");
    await set({ hidePage: false }); await settle();
    assert.equal(await shown("#below"), true, "page returns when option off");

    await set({ hotkey: "Ctrl+Alt+KeyK" }); await settle();
    await p.keyboard.press("Alt+Shift+KeyZ"); await settle();
    assert.equal(await shown(".ytp-chrome-bottom"), false, "old hotkey ignored");
    await p.keyboard.press("Control+Alt+KeyK"); await settle();
    assert.equal(await shown(".ytp-chrome-bottom"), true, "custom hotkey toggles");
    await p.keyboard.press("Control+Alt+KeyK"); await settle();
    await set({ hotkey: "K" }); await settle(); // invalid -> default
    await p.keyboard.press("Alt+Shift+KeyZ"); await settle();
    assert.equal(await shown(".ytp-chrome-bottom"), true, "invalid hotkey falls back to default");
    await p.keyboard.press("Alt+Shift+KeyZ"); await settle();

    await set({ cursor: "ring", idleHide: 1, cursorOpacity: 50 }); await settle();
    await p.mouse.move(120, 120); await p.mouse.move(200, 150, { steps: 3 });
    assert.equal(await p.$eval(".kz-cursor", (e) => e.classList.contains("kz-idle")), false, "not idle while moving");
    await p.waitForTimeout(1500);
    assert.equal(await p.$eval(".kz-cursor", (e) => e.classList.contains("kz-idle")), true, "fades when idle");
    await p.mouse.move(220, 160);
    assert.equal(await p.$eval(".kz-cursor", (e) => e.classList.contains("kz-idle")), false, "wakes on move");
    assert.equal(await p.evaluate(() => document.documentElement.style.getPropertyValue("--kz-opacity")), "0.5", "opacity applied");
    await set({ idleHide: 0, cursorOpacity: 100 });

    // fullscreen scope: idle outside fullscreen, active inside
    await set({ scope: "fullscreen", cursor: "hidden" }); await settle();
    assert.equal(await shown(".ytp-chrome-bottom"), true, "scope=fullscreen: UI visible when not fullscreen");
    await p.mouse.click(300, 200);
    await p.evaluate(() => document.querySelector(".html5-video-player").requestFullscreen()).catch(() => {});
    await settle();
    if (await p.evaluate(() => !!document.fullscreenElement)) {
      assert.equal(await shown(".ytp-chrome-bottom"), false, "scope=fullscreen: hidden in fullscreen");
    } else console.log("e2e: fullscreen unavailable in this browser, skipped that check");
    await p.evaluate(() => document.exitFullscreen()).catch(() => {});
    await set({ scope: "always" }); await settle();

    await set({ cursor: "system" }); await settle();
    assert.equal(await p.$(".kz-cursor"), null, "no custom pointer in system mode");

    await set({ cursor: "bogus", cursorColor: "red;}", cursorSize: "x" }); await settle();
    assert.equal(await p.evaluate(() => document.documentElement.getAttribute("data-kz-cursor")), "hidden", "bad stored values fall back");
    console.log("e2e: all checks passed");
  } finally {
    await ctx.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
