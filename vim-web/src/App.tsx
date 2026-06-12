import { CSSProperties, ChangeEvent, useEffect, useRef, useState } from 'react'
import { CustomInspector, ModelSource } from './CustomInspector'

// One available model, as reported by the dev server's /api/vims endpoint.
interface Model {
  name: string
  url: string
}

export function App() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [models, setModels] = useState<Model[]>([])
  // What the inspector loads. Kept as a stable object — a new identity
  // triggers a reload, so it's only replaced on an explicit user choice.
  const [source, setSource] = useState<ModelSource>()
  const [activeUrl, setActiveUrl] = useState('') // nav button highlight; '' when a local file is open
  const [fileName, setFileName] = useState<string>() // name of the locally opened file, if any
  const [status, setStatus] = useState('Starting…')

  // Fetch the list of available models once on mount. The viewer itself is
  // owned by CustomInspector, which loads whatever source we pass it.
  useEffect(() => {
    let cancelled = false

    fetch('/api/vims')
      .then((res) => res.json() as Promise<Model[]>)
      .then((list) => {
        if (cancelled) return
        setModels(list)
        if (list.length > 0) {
          // Auto-select the first model.
          setActiveUrl(list[0].url)
          setSource({ url: list[0].url })
          setStatus('')
        } else {
          setStatus('No .vim files found. Drop one into the vims/ folder, or use Open…')
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('Could not reach /api/vims — is the dev server running?')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const selectModel = (m: Model) => {
    setFileName(undefined)
    setActiveUrl(m.url)
    setSource({ url: m.url })
  }

  // Read the chosen .vim file from disk and hand it to the inspector as a buffer.
  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const file = input.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const buffer = event.target?.result
      if (buffer instanceof ArrayBuffer) {
        setFileName(file.name)
        setActiveUrl('')
        setSource({ buffer })
        setStatus('')
      }
    }
    reader.readAsArrayBuffer(file)
    // Clear the value so picking the same file again still fires `change`.
    input.value = ''
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      {/* Top-level nav bar: one button per available model, plus Open…. */}
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
            models.map((m) => (
              <button
                key={m.url}
                onClick={() => selectModel(m)}
                style={navButtonStyle(m.url === activeUrl)}
              >
                {m.name}
              </button>
            ))
          )}

          {/* Open a .vim file from disk. While one is loaded, its name shows
              as the active chip (the hidden input has no UI of its own). */}
          <input ref={fileInputRef} type="file" accept=".vim" onChange={handleFile} style={{ display: 'none' }} />
          <button onClick={() => fileInputRef.current?.click()} style={navButtonStyle(false)}>
            Open…
          </button>
          {fileName && <span style={{ ...navButtonStyle(true), cursor: 'default' }}>{fileName}</span>}
        </div>

        {status && <span style={{ marginLeft: 'auto', opacity: 0.8 }}>{status}</span>}
      </nav>

      {/* Inspector + viewer fill the remaining space below the nav bar.
          CustomInspector positions itself with absolute inset-0, so this
          wrapper must be position: relative. */}
      <main style={{ position: 'relative', flex: 1, minHeight: 0 }}>
        <CustomInspector source={source} />
      </main>
    </div>
  )
}

// Nav chip styling, shared by the model buttons, Open…, and the file-name chip.
function navButtonStyle(active: boolean): CSSProperties {
  return {
    padding: '6px 12px',
    borderRadius: 6,
    border: '1px solid transparent',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    color: '#fff',
    background: active ? '#3e9bff' : 'rgba(255, 255, 255, 0.1)',
    fontWeight: active ? 600 : 400,
  }
}
