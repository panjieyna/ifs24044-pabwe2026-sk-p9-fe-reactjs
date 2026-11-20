import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

function render() {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

// Font sudah di-preload di index.html. Render pertama menunggu font siap (maks. 1,5 detik)
// agar judul tidak berpindah baris saat font cadangan diganti (mencegah layout shift).
const fonts = document.fonts
if (fonts && typeof fonts.load === 'function') {
  const ready = Promise.all([
    fonts.load('400 1em "Instrument Serif"'),
    fonts.load('italic 400 1em "Instrument Serif"'),
    fonts.load('400 1em "Inter Variable"'),
  ])
  Promise.race([ready, new Promise((resolve) => setTimeout(resolve, 1500))]).finally(render)
} else {
  render()
}
