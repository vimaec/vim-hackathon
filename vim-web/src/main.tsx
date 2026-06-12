import { createRoot } from 'react-dom/client'
import { App } from './App'

// vim-web ships its own stylesheet for the viewer UI — it must be imported once.
import 'vim-web/style.css'

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root container #root not found in index.html')
}

createRoot(container).render(<App />)
