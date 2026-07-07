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
- **Count by `domain`, not by geometry.** `hasGeometry` (a mesh exists to render) is *not* the physical-element rule: real elements can have no mesh — e.g. 2D door families (~150 of ~1,000 doors in the sample models) — and rooms *do* have meshes. Use `hasGeometry` only to decide what is renderable/selectable in the 3D scene; use `domain` / `ElementDomain` to decide what is a real building element. Gating a physical-element list or count on geometry under-counts (drops the 2D families) and, inverted, over-includes (rooms). Family/Type *definition* rows are likewise not building elements — they fall in the conceptual domain, which the `domain` filter already excludes, so a naive count-every-element over-counts (~34% on a typical model).
- **Identity is the element index** (the universal key used above for selection/coloring). `uniqueId` (the Revit GUID) can repeat across the linked documents of a federated model, so prefer the element index for anything you persist or match across documents.
- Models can be large (millions of elements). Aggregate first; fetch per-element data on demand.
