import { useEffect, useRef, useState } from 'react'
import * as VIM from 'vim-web'

// Types inferred from the factory so we don't depend on named exports.
type Viewer = Awaited<ReturnType<typeof VIM.React.Webgl.createViewer>>
type LoadRequest = ReturnType<Viewer['load']>
type Vim = Awaited<ReturnType<LoadRequest['getVim']>>

// One available model, as reported by the dev server's /api/vims endpoint.
interface Model {
  name: string
  url: string
}

export function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const currentVimRef = useRef<Vim | null>(null)

  const [viewer, setViewer] = useState<Viewer | null>(null)
  const [models, setModels] = useState<Model[]>([])
  const [selected, setSelected] = useState('')
  const [status, setStatus] = useState('Starting…')

  // Create the viewer and fetch the list of available models, once on mount.
  useEffect(() => {
    let cancelled = false
    let created: Viewer | undefined

    VIM.React.Webgl.createViewer(containerRef.current ?? undefined).then((v) => {
      if (cancelled) {
        v.dispose()
        return
      }
      created = v
      v.isolation.autoIsolate.set(true) // isolate the clicked element, ghost the rest
      setViewer(v)
    })

    fetch('/api/vims')
      .then((res) => res.json() as Promise<Model[]>)
      .then((list) => {
        if (cancelled) return
        setModels(list)
        if (list.length > 0) {
          setSelected(list[0].url) // auto-select the first model
        } else {
          setStatus('No .vim files found. Drop one into the vims/ folder and reload.')
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('Could not reach /api/vims — is the dev server running?')
      })

    return () => {
      cancelled = true
      created?.dispose()
    }
  }, [])

  // (Re)load whenever the viewer is ready and the selection changes.
  useEffect(() => {
    if (!viewer || !selected) return
    let cancelled = false
    let request: LoadRequest | null = null

    const load = async () => {
      // Remove the previously loaded model before loading the next.
      if (currentVimRef.current) {
        viewer.unload(currentVimRef.current)
        currentVimRef.current = null
      }

      setStatus('Loading…')
      request = viewer.load({ url: selected }) // shows a progress modal and auto-frames
      try {
        const vim = await request.getVim()
        if (cancelled) {
          viewer.unload(vim)
          return
        }
        currentVimRef.current = vim
        setStatus('')
      } catch {
        if (!cancelled) setStatus('Failed to load model.')
      }
    }

    load()

    return () => {
      cancelled = true
      request?.abort()
    }
  }, [viewer, selected])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      {/* Top-level nav bar: one button per available model. */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexShrink: 0,
          height: 52,
          padding: '0 16px',
          background: '#1f2933',
          color: '#fff',
          font: '14px sans-serif',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 16, marginRight: 4 }}>VIM Web</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto' }}>
          {models.length === 0 ? (
            <span style={{ opacity: 0.7 }}>No .vim files in the vims/ folder</span>
          ) : (
            models.map((m) => {
              const active = m.url === selected
              return (
                <button
                  key={m.url}
                  onClick={() => setSelected(m.url)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    border: '1px solid transparent',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    color: '#fff',
                    background: active ? '#3e9bff' : 'rgba(255, 255, 255, 0.1)',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {m.name}
                </button>
              )
            })
          )}
        </div>

        {status && <span style={{ marginLeft: 'auto', opacity: 0.8 }}>{status}</span>}
      </nav>

      {/* Viewer fills the remaining space below the nav bar. */}
      <main style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
      </main>
    </div>
  )
}
