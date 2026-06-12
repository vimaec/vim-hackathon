# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this folder.

## What This Is

A minimal React + TypeScript + Vite starter around the [`vim-web`](https://www.npmjs.com/package/vim-web) npm package — a browser-based WebGL viewer for `.vim` BIM models. It's a distilled version of the official [vim-web-demo](https://github.com/vimaec/vim-web-demo). See the root `CLAUDE.md` for shared BIM concepts.

## Commands

```bash
npm install        # once, before anything else (also enables API discovery via node_modules types)
npm run dev        # Vite dev server with HMR, usually http://localhost:5173
npm run build      # type-check (tsc --noEmit) + production build
npm run typecheck  # type-check only
npm run preview    # serve the production build
```

There are no tests; `npm run typecheck` is the correctness gate.

## Architecture

- `vite.config.ts` — besides React, a custom dev-server plugin (`serveVims`) exposes the repo-root `vims/` folder: `GET /api/vims` returns `[{ name, url }]` for each `.vim` file, and `GET /vims/<file>.vim` streams it (path traversal blocked via `basename`). The server is the single source of truth for available models; change `VIMS_DIR` to serve from elsewhere. Drop `.vim` files into `../vims/` and reload — no code changes needed.
- `src/App.tsx` — nav bar listing models from `/api/vims`, plus an Open… button for local files. Passes a `ModelSource` (`{ url }` or `{ buffer: ArrayBuffer }`) down to the inspector. The source object's identity triggers reloads, so it's only replaced on explicit user choice.
- `src/CustomInspector.tsx` — owns the single long-lived viewer. The built-in BIM tree and info panel expose no structural API, so they're hidden (`ui.panelBimTree: false`, `ui.panelBimInfo: false`) and replaced by a custom left-pane tree + "BIM Inspector" section. The tree groups geometry elements by `GROUPING_ORDER` (`['Category', 'Family', 'Type']` — reorder/extend this single knob to restructure, e.g. prepend `'Room'`). `SHOWN_DOMAINS` controls which element domains appear and stay visible.
- `src/elementDomain.ts` — TypeScript port of vim-format's `CategoryDomain.cs`/`ElementDomain.cs`; computes each element's `ElementDomain` for filtering.

## Viewer API

Core integration is four calls:

```ts
const viewer = await VIM.React.Webgl.createViewer(container)  // mount into a <div>
const request = viewer.load({ url })   // or { buffer }; shows progress, auto-frames
const vim = await request.getVim()     // the loaded model handle (IWebglVim)
viewer.unload(vim)                     // remove before loading another
```

- From `viewer` you can reach selection, isolation, sectioning, camera framing, markers, and UI toggles. **Discover the exact API surface from the type definitions in `node_modules/vim-web`** (and the vim-web-demo repo for worked examples) — don't guess.
- BIM data comes from `vim` handles: `VIM.BIM.VimDocument` / `IElement` give async access to element properties, categories, etc.
- Useful namespaces: `VIM.React.Webgl` (React viewer), `VIM.Core.Webgl` (core viewer types), `VIM.BIM` (document/element data), `VIM.THREE` (the bundled three.js — `CustomInspector` adds raw THREE meshes via the renderer's non-public `add`/`remove`, deliberately outside the viewer's tracking).
