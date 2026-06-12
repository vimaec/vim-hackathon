# VIM Hackathon

Welcome! This repo is your launch pad for building something cool with VIM and Claude.
Pick a track:

## 🧩 `vim-flex/` — Script the VIM Flex desktop app with Claude

A starting point for writing [VIM Flex](https://vimaec.com/) plugins in AngelScript,
developed interactively through the local **MCP connection** to the app — with Claude
Code or Claude Desktop authoring and editing plugins for you. See
[`vim-flex/README.md`](./vim-flex/README.md).

**Good for:** custom workflows, BIM data queries, scripted analysis, anything inside the
VIM Flex desktop app. Requires VIM Flex Pro on Windows.

---

Not sure which? If you want to ship a web experience, start with `vim-web`. If you want
to automate or extend the desktop tool against real models, start with `vim-flex`.

## 🖥️ `vim-web/` — Build a BIM viewer in the browser

A minimal, ready-to-run [`vim-web`](https://www.npmjs.com/package/vim-web) project. With
Node/npm installed, it's just:

```bash
cd vim-web
npm install
npm run dev
```

…and you have a full-screen 3D BIM viewer loading a sample model. Build from there. See
[`vim-web/README.md`](./vim-web/README.md).

**Good for:** web apps, custom viewer UIs, embedding models in a page, anything browser-based.

