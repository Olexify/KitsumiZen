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
- press **Alt+Shift+Z** while on YouTube.

Settings are remembered. Default is on.

### Options (toolbar popup)

- **Pointer**: Hidden (default), System, or a custom pointer drawn over the video: Dot, Ring (smooth), Crosshair,
  Glow (smooth), Arrow, Comet trail. Pick a color and size; optional click ripple.
  Custom pointers are drawn inside the player, so they also show in fullscreen and in screen recordings.
- **Hide seek / volume popups**: the "+5 seconds" / "-10 seconds" flash from arrow keys or double-tap, plus volume and speed-change flashes.
- **Hide hold-to-speed 2x**: the "2x" indicator shown while you hold to speed up.

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

## License

MIT
