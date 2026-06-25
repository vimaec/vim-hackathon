# VIM Hackathon

*French version below — la version française suit.*

A starter workspace for building BIM tools on top of `.vim` files — 3D building models exported from Revit, Navisworks, or IFC. Everything here is set up so you (and Claude Code) can go from zero to a working prototype quickly.

The goal of the hackathon: pick a building-industry workflow you care about — see [`IDEAS.md`](IDEAS.md) for starting points like model health, issue tracking, costing, scheduling, carbon analysis, facility management, or presentation fly-throughs — and build it on one of the two avenues below.

## Two avenues

| | **VIM Flex plugins** (`vim-flex/`) | **VIM Web viewer** (`vim-web/`) |
|---|---|---|
| What you build | Plugins for VIM Flex, a native Windows 3D BIM viewer: custom workflows, dockable panels, analytics | A browser-based 3D viewer app using the `vim-web` npm package |
| Stack | AngelScript, ImGui, DuckDB SQL | TypeScript, React, Vite, WebGL |
| Good fit if you want | Rich BIM analytics over SQL, deep viewer integration, agent-driven development (compile/query via MCP) | Web UI freedom, shareable in a browser, a familiar React workflow |
| Start here | [`vim-flex/README.md`](vim-flex/README.md) | [`vim-web/README.md`](vim-web/README.md) |

Both avenues read the same models and expose the same underlying BIM data: elements (walls, doors, ducts, rooms, ...) with categories, families and types, levels, rooms, worksets, and warnings.

## Sample models

The [`vims/`](vims/) folder ships with four sample models — Snowdon, a Substation, and two versions of the Wolford Residence (handy for model-comparison ideas). Open them directly in VIM Flex, or run the vim-web dev server and they appear in the model picker automatically. To add your own, drop a `.vim` file into `vims/` — see [`vims/README.md`](vims/README.md) for exporters and hosted samples.

## Prerequisites

- **VIM Flex avenue**: install [VIM Flex](https://vimaec.com/download) (Windows). For agent-driven development, enable Developer Mode (Settings > Developer Settings) and launch with `--start-mcp-server=true`.
- **VIM Web avenue**: Node.js 18+ and npm.

## Building with Claude Code

This repo is Claude Code-ready: `CLAUDE.md` files at the root and in each avenue give Claude the orientation, dev loops, and gotchas it needs, and `vim-flex/.claude/` ships project skills and specialized agents for BIM queries, plugin development, debugging, and report design. Open a session in the folder you're working in and describe what you want to build.

---

# Hackathon VIM

Un espace de travail de démarrage pour créer des outils BIM à partir de fichiers `.vim` — des maquettes 3D de bâtiments exportées depuis Revit, Navisworks ou IFC. Tout est déjà configuré pour que vous (et Claude Code) passiez de zéro à un prototype fonctionnel rapidement.

L'objectif du hackathon : choisissez un flux de travail du secteur du bâtiment qui vous tient à cœur — consultez [`IDEAS.md`](IDEAS.md) pour des points de départ comme la santé du modèle, le suivi des problèmes, l'estimation des coûts, l'échéancier, l'analyse carbone, la gestion des installations ou les survols de présentation — et réalisez-le sur l'une des deux avenues ci-dessous.

## Deux avenues

| | **Plugins VIM Flex** (`vim-flex/`) | **Visualiseur VIM Web** (`vim-web/`) |
|---|---|---|
| Ce que vous créez | Des plugins pour VIM Flex, un visualiseur BIM 3D natif Windows : flux de travail personnalisés, panneaux ancrables, analytique | Une application de visualisation 3D dans le navigateur avec le paquet npm `vim-web` |
| Technologies | AngelScript, ImGui, SQL DuckDB | TypeScript, React, Vite, WebGL |
| Un bon choix si vous voulez | Une analytique BIM riche en SQL, une intégration profonde au visualiseur, un développement piloté par agent (compilation et requêtes via MCP) | La liberté d'une interface Web, un résultat partageable dans un navigateur, un flux React familier |
| Commencez ici | [`vim-flex/README.md`](vim-flex/README.md) | [`vim-web/README.md`](vim-web/README.md) |

Les deux avenues lisent les mêmes maquettes et exposent les mêmes données BIM sous-jacentes : des éléments (murs, portes, conduits, pièces, ...) avec leurs catégories, familles et types, niveaux, pièces, sous-projets (worksets) et avertissements.

## Maquettes d'exemple

Le dossier [`vims/`](vims/) contient quatre maquettes d'exemple — Snowdon, un poste électrique (Substation) et deux versions de la résidence Wolford (pratiques pour les idées de comparaison de maquettes). Ouvrez-les directement dans VIM Flex, ou lancez le serveur de développement de vim-web et elles apparaîtront automatiquement dans le sélecteur de maquettes. Pour ajouter les vôtres, déposez un fichier `.vim` dans `vims/` — voir [`vims/README.md`](vims/README.md) pour les exportateurs et les maquettes d'exemple hébergées.

## Préalables

- **Avenue VIM Flex** : installez [VIM Flex](https://vimaec.com/download) (Windows). Pour le développement piloté par agent, activez le mode développeur (Settings > Developer Settings) et lancez avec `--start-mcp-server=true`.
- **Avenue VIM Web** : Node.js 18+ et npm.

## Développer avec Claude Code

Ce dépôt est prêt pour Claude Code : des fichiers `CLAUDE.md` à la racine et dans chaque avenue donnent à Claude l'orientation, les boucles de développement et les pièges à connaître, et `vim-flex/.claude/` fournit des compétences (skills) et des agents spécialisés pour les requêtes BIM, le développement de plugins, le débogage et la conception de rapports. Ouvrez une session dans le dossier où vous travaillez et décrivez ce que vous voulez créer.



