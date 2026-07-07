# VIM Web — Starter

A minimal, ready-to-run example of the [`vim-web`](https://www.npmjs.com/package/vim-web)
BIM model viewer. Clone, install, and run — you get a full-screen 3D viewer loading a
sample building model in your browser.

This is a distilled version of the official
[vim-web-demo](https://github.com/vimaec/vim-web-demo). The demo showcases dozens of
features across many pages; this starter strips it down to the smallest thing that
actually renders a model, so you have a clean foundation to build your hackathon project on.

## Prerequisites

- **Node.js and npm.** Install the LTS release from <https://nodejs.org> if you don't
  have it. Check your install with:
  ```bash
  node --version
  npm --version
  ```
  Any recent LTS (Node 18+) is fine.

## Getting started

From this `vim-web/` folder:

```bash
npm install
npm run dev
```

Vite will print a local URL (usually <http://localhost:5173>). Open it in your browser.
The nav bar across the top has a button for every `.vim` file in the repo's `vims/`
folder — click one and it loads and frames itself — plus an **Open…** button to load a
`.vim` file straight from your disk. Left-drag to orbit, right-drag to pan, scroll to
zoom, and click an element to isolate it.

The pane on the left is a custom inspector that replaces the viewer's built-in BIM
panels: a tree grouping every physical element that has geometry (i.e. renderable in the
3D scene) by Category > Family > Type (click a row
to select and frame it), and a Parameters section showing the BIM properties of the
current selection.

## Adding models

Drop `.vim` files into the **`vims/` folder at the repo root** (`../vims`, alongside
this `vim-web/` project). The dev server serves them automatically — add or remove
files, then reload the page to refresh the picker. See [`../vims/README.md`](../vims/README.md)
for where to get a `.vim` file.

You don't reference files by hand: the dev server enumerates the folder and hands each
file's `localhost` URL to the viewer.

## How model serving works

A small Vite dev-server plugin in `vite.config.ts` exposes the root `vims/` folder:

- `GET /api/vims` → a JSON list of `{ name, url }` for each `.vim` file.
- `GET /vims/<file>.vim` → streams that file (path-traversal is blocked).

On load, the front-end (`src/App.tsx`) fetches `/api/vims`, builds the nav bar, and
hands the chosen model's server-provided URL to `src/CustomInspector.tsx`, which calls
`viewer.load({ url })`. To serve from a different location, change `VIMS_DIR` in
`vite.config.ts`.

## Project layout

```
vims/                    # ← repo-root folder of .vim models (served by the dev server)
vim-web/
├── index.html           # Page shell; mounts the React app
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript config
├── vite.config.ts       # Vite + React plugin + the vims/ serving plugin
└── src/
    ├── main.tsx             # React entry point; imports vim-web's stylesheet
    ├── App.tsx              # Nav bar: lists models, Open… for local files
    ├── CustomInspector.tsx  # The viewer + custom inspector tree  ← start here
    ├── elementDomain.ts     # Element-domain filtering (port of vim-format's ElementDomain.cs)
    └── vite-env.d.ts
```

## The viewer API in 4 lines

The viewer integration lives in `src/CustomInspector.tsx` (`App.tsx` only decides
*which* model to load):

```ts
const viewer = await VIM.React.Webgl.createViewer(container)  // mount into a <div>
const request = viewer.load({ url })                          // load a model (auto-frames)
const vim = await request.getVim()                            // the loaded model handle
viewer.unload(vim)                                            // remove it (e.g. before loading another)
```

The React `load()` shows a progress modal and frames the model automatically when it
finishes. From the `viewer` object you can reach selection, isolation, sectioning,
camera framing, markers, and more. Explore what's available — autocomplete on the `viewer`
object is your friend — and see the
[vim-web-demo](https://github.com/vimaec/vim-web-demo) for worked examples of each
feature.

## Scripts

| Command             | What it does                                  |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | Start the Vite dev server with hot reload     |
| `npm run build`     | Type-check and produce a production build      |
| `npm run preview`   | Serve the production build locally            |
| `npm run typecheck` | Type-check without emitting                   |

## Tips for building with Claude Code

You're already in a Claude Code-friendly project. Some things to try asking:

- "Add a button that toggles a section box on the model."
- "Group the inspector tree by Room first." (one-line change: `GROUPING_ORDER` in
  `src/CustomInspector.tsx`)
- "Load two models side by side."

Claude can read the `src/` files and the `vim-web` type definitions in `node_modules` to
discover the exact API surface, so run `npm install` first for the best results.
