import { useCallback, useEffect, useState } from 'react'

export const THEME_KEY = 'delcom-theme'
export const ACCENT_KEY = 'delcom-accent'

export const ACCENTS = [
  { id: 'vermilion', name: 'Vermilion', swatch: '#B8361C' },
  { id: 'cobalt', name: 'Kobalt', swatch: '#2343C8' },
  { id: 'moss', name: 'Lumut', swatch: '#3F6B2A' },
]

function readStorage(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Penyimpanan diblokir (mode privat) — preferensi cukup berlaku untuk sesi ini.
  }
}

function initialMode() {
  const saved = readStorage(THEME_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function initialAccent() {
  const saved = readStorage(ACCENT_KEY)
  return ACCENTS.some((a) => a.id === saved) ? saved : ACCENTS[0].id
}

// Mengelola mode terang/gelap dan warna aksen, disinkronkan ke <html> dan localStorage.
export default function useTheme() {
  const [mode, setMode] = useState(initialMode)
  const [accent, setAccentState] = useState(initialAccent)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark')
    writeStorage(THEME_KEY, mode)
  }, [mode])

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent)
    writeStorage(ACCENT_KEY, accent)
  }, [accent])

  const toggleMode = useCallback(() => setMode((m) => (m === 'dark' ? 'light' : 'dark')), [])
  const setAccent = useCallback((id) => {
    if (ACCENTS.some((a) => a.id === id)) setAccentState(id)
  }, [])

  return { mode, toggleMode, accent, setAccent, accents: ACCENTS }
}
