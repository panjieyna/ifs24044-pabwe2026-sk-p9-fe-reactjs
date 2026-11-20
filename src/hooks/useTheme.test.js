import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import useTheme, { ACCENT_KEY, THEME_KEY } from './useTheme'

const originalMatchMedia = window.matchMedia

describe('useTheme', () => {
  afterEach(() => {
    window.matchMedia = originalMatchMedia
    vi.restoreAllMocks()
  })

  it('defaults to the system light scheme and vermilion accent', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.mode).toBe('light')
    expect(result.current.accent).toBe('vermilion')
    expect(result.current.accents).toHaveLength(3)
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.dataset.accent).toBe('vermilion')
    expect(localStorage.getItem(THEME_KEY)).toBe('light')
  })

  it('follows a dark system preference when nothing is saved', () => {
    window.matchMedia = () => ({ matches: true })
    localStorage.setItem(THEME_KEY, 'sepia')
    localStorage.setItem(ACCENT_KEY, 'neon')
    const { result } = renderHook(() => useTheme())
    expect(result.current.mode).toBe('dark')
    expect(result.current.accent).toBe('vermilion')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('restores saved preferences and updates them', () => {
    localStorage.setItem(THEME_KEY, 'dark')
    localStorage.setItem(ACCENT_KEY, 'cobalt')
    const { result } = renderHook(() => useTheme())
    expect(result.current.mode).toBe('dark')
    expect(result.current.accent).toBe('cobalt')

    act(() => result.current.toggleMode())
    expect(result.current.mode).toBe('light')
    act(() => result.current.toggleMode())
    expect(result.current.mode).toBe('dark')

    act(() => result.current.setAccent('moss'))
    expect(result.current.accent).toBe('moss')
    expect(localStorage.getItem(ACCENT_KEY)).toBe('moss')
    act(() => result.current.setAccent('unknown'))
    expect(result.current.accent).toBe('moss')
  })

  it('keeps working when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const { result } = renderHook(() => useTheme())
    expect(result.current.mode).toBe('light')
    act(() => result.current.toggleMode())
    expect(result.current.mode).toBe('dark')
  })
})
