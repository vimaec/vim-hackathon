# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A VIM hackathon workspace. Attendees build BIM (Building Information Modeling) tools on top of `.vim` files — a format for 3D building models exported from Revit and similar tools. There are **two avenues of exploration**, each with its own CLAUDE.md:

1. **VIM Flex plugins** (`vim-flex/`) — AngelScript plugins for VIM Flex, a native Windows 3D BIM viewer. Plugins add workflows, dockable ImGui panels, and DuckDB SQL analytics. See **`vim-flex/CLAUDE.md`** before doing any work there.
2. **VIM Web viewer** (`vim-web/`) — a minimal React + TypeScript + Vite starter around the `vim-web` npm package, rendering models in the browser with WebGL. See **`vim-web/CLAUDE.md`** before doing any work there.

Pick the avenue the attendee is working in and follow that folder's CLAUDE.md; don't mix the two (different languages, runtimes, and APIs).

Other root-level items:

- `vims/` — sample VIM models shared by both avenues (Snowdon, Substation, Wolford Residence v1/v2). VIM Flex opens them from disk; the vim-web dev server serves them over HTTP.
- `IDEAS.md` — hackathon workflow ideas (model health, issues, costing, scheduling, carbon, FM, presentation/fly-through).

## Common BIM Concepts

Both avenues expose the same underlying VIM data model:

- **Elements** are the unit of everything: walls, doors, ducts, rooms, annotations. Each has an index (the universal key for selection, isolation, and coloring in both viewers), a Category (e.g. Walls, Doors), a Family and FamilyType, and usually a Level.
- Supporting entities: **Categories**, **Levels** (with elevation), **Rooms** (with area), **Worksets**, **Warnings**, **BimDocuments** (a model can contain linked documents).
- **Element domains** classify elements by physical presence: most analytics filter to physical elements and skip conceptual/annotation/symbol elements. In vim-flex SQL this is the string `e.domain = 'Physical-Visible'`; in vim-web it's the `ElementDomain` type (`'PhysicalVisible'`, plus `'PhysicalNotInstanced'` for system families like walls/floors/roofs that aren't family instances).
- Models can be large (millions of elements). Aggregate first; fetch per-element data on demand.
