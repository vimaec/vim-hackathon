import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { createReadStream } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { basename, extname, join } from 'node:path'

// Root-level vims/ folder of .vim models served by the dev server
// (the repo root, one level up from this vim-web/ project).
const VIMS_DIR = fileURLToPath(new URL('../vims', import.meta.url))

/**
 * Dev-server plugin that exposes the local `vims/` folder to the front-end:
 *  - GET /api/vims         → JSON array of { name, url } for each .vim file
 *  - GET /vims/<file>.vim  → streams that file
 *
 * The front-end fetches the list, then hands each file's localhost `url` to the
 * viewer's load() — so the server is the single source of truth for what's available.
 */
function serveVims(): Plugin {
  return {
    name: 'serve-vims',
    configureServer(server) {
      // List the available models.
      server.middlewares.use('/api/vims', async (req, res) => {
        try {
          const entries = await readdir(VIMS_DIR)
          const host = req.headers.host ?? 'localhost'
          const files = entries
            .filter((name) => extname(name).toLowerCase() === '.vim')
            .sort((a, b) => a.localeCompare(b))
            .map((name) => ({
              name,
              url: `http://${host}/vims/${encodeURIComponent(name)}`,
            }))
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(files))
        } catch {
          // Folder missing or unreadable → report an empty list rather than erroring.
          res.setHeader('Content-Type', 'application/json')
          res.end('[]')
        }
      })

      // Stream a single model. basename() strips any path, blocking directory traversal.
      server.middlewares.use(async (req, res, next) => {
        const path = req.url?.split('?')[0] ?? ''
        if (!path.startsWith('/vims/')) return next()

        const name = basename(decodeURIComponent(path))
        if (extname(name).toLowerCase() !== '.vim') return next()

        const file = join(VIMS_DIR, name)
        try {
          const info = await stat(file)
          if (!info.isFile()) return next()
          res.setHeader('Content-Type', 'application/octet-stream')
          res.setHeader('Content-Length', String(info.size))
          createReadStream(file).pipe(res)
        } catch {
          next()
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), serveVims()],
})
