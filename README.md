# KitsumiZen

A tiny browser extension for **Chrome** and **Firefox** that hides the YouTube player UI and leaves only the video.
Use it for screen recording, presentations, screenshots, or distraction-free viewing.

It does **not** replace or redesign the player. It only injects CSS that hides the visual chrome, so YouTube's
own player, keyboard shortcuts (space, `k`, `f`, arrows, `c`, …) and SPA navigation keep working.

## What gets hidden

Control bar, progress bar, title bar, top/bottom gradients, tooltips and menus, pause overlay, cards and end-screen
suggestions, watermark, play/seek flash icons, loading spinner, annotations, and the mouse cursor over the player.
Captions are left alone.

## Use

- Click the toolbar icon and toggle **Hide player UI**, or
- press **Alt+Shift+Z** while on YouTube (change it in the popup: click the Hotkey field and press a new combo that includes Ctrl, Alt or Cmd).

Settings are remembered. Default is on.

### Options (toolbar popup)

- **Apply**: always, or only while the player is fullscreen.
- **Hide**: seek / volume popups (the "+5 seconds" flash), the hold-to-speed "2x" indicator, captions, and optionally the rest of the page
  (header, sidebar, comments; best effort since the layout is YouTube's own).
- **Pointer**: Hidden (default), System, or a custom pointer drawn over the video: Dot, Ring (smooth), Crosshair, Glow (smooth),
  Arrow, Comet trail. Choose color, size, opacity, fade-when-idle delay and an optional click ripple.
  Custom pointers are drawn inside the player, so they also show in fullscreen and in screen recordings.

## Install

Chrome / Edge / Brave:
1. Download or clone this repo.
2. Open `chrome://extensions`, enable **Developer mode**.
3. **Load unpacked** and select this folder.

Firefox (109+):
1. Open `about:debugging#/runtime/this-firefox`.
2. **Load Temporary Add-on…** and pick `manifest.json`.

To package a zip: `./scripts/build.sh` (outputs `dist/kitsumizen.zip`).

## How it works

`src/content.js` sets a `data-kitsumizen` attribute on `<html>` at `document_start`; `src/zen.css` hides player
elements only under that attribute. Because it is pure CSS keyed on the root element, it survives YouTube's dynamic
navigation and player re-renders with no observers or polling. No data is collected and no network requests are made.

If YouTube renames a class, add the new selector to `src/zen.css`.

## Development

`npm install && npm test` runs an end-to-end check in Chromium against a mock player page (no network).
Set `CHROME_PATH` if Playwright can't find a browser. Settings defaults and validation live in `src/defaults.js`.

## License

MIT
