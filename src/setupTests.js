import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'

// Toast UI bergantung pada API kanvas/seleksi yang tidak tersedia di JSDOM — diganti versi ringan.
vi.mock('@toast-ui/editor', async () => ({ default: (await import('./test/toastMock')).FakeEditor }))
vi.mock('@toast-ui/editor/viewer', async () => ({ default: (await import('./test/toastMock')).FakeViewer }))

// SweetAlert2 di-mock agar dialog dapat dikendalikan dari tes.
vi.mock('sweetalert2', () => ({ default: { fire: vi.fn(() => Promise.resolve({ isConfirmed: true })) } }))

// Polyfill JSDOM.
window.matchMedia =
  window.matchMedia ||
  ((query) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  }))
window.scrollTo = () => {}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.className = ''
  window.history.replaceState({}, '', '/')
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})
