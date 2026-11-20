import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { makeUser, theme } from '../../../test/fixtures'
import StickyNavbar from './StickyNavbar'

function setup(props = {}) {
  const navigate = vi.fn()
  const onLogout = vi.fn()
  const t = theme(props.theme)
  render(<StickyNavbar path="/" user={null} navigate={navigate} onLogout={onLogout} {...props} theme={t} />)
  return { navigate, onLogout, t }
}

const mainNav = () => screen.getByRole('navigation', { name: 'Navigasi utama' })

describe('StickyNavbar', () => {
  it('shows guest navigation and auth links', () => {
    const { navigate } = setup()
    expect(within(mainNav()).getAllByRole('link')).toHaveLength(1)
    expect(within(mainNav()).getByRole('link', { name: 'Beranda' })).toHaveAttribute('aria-current', 'page')

    fireEvent.click(screen.getByRole('link', { name: 'Masuk' }))
    fireEvent.click(screen.getByRole('link', { name: 'Daftar' }))
    fireEvent.click(screen.getByRole('link', { name: /Delcom/ }))
    expect(navigate.mock.calls.map((c) => c[0])).toEqual(['/login', '/register', '/'])
  })

  it('marks Beranda active for /public and article pages only', () => {
    for (const [path, current] of [
      ['/public', true],
      ['/posts/abc', true],
      ['/login', false],
    ]) {
      const { unmount } = render(<StickyNavbar path={path} user={null} theme={theme()} navigate={() => {}} onLogout={() => {}} />)
      const link = within(screen.getByRole('navigation', { name: 'Navigasi utama' })).getByRole('link', { name: 'Beranda' })
      expect(link.hasAttribute('aria-current')).toBe(current)
      unmount()
    }
  })

  it('toggles the theme with a descriptive label', () => {
    const toggleMode = vi.fn()
    setup({ theme: { toggleMode } })
    fireEvent.click(screen.getByRole('button', { name: 'Aktifkan mode gelap' }))
    expect(toggleMode).toHaveBeenCalled()
  })

  it('shows workspace and admin links for an admin user with the user menu', () => {
    const setAccent = vi.fn()
    const { onLogout } = setup({ path: '/admin', user: makeUser({ role: 'admin', name: '', username: 'root' }), theme: { mode: 'dark', setAccent } })
    expect(screen.getByRole('button', { name: 'Aktifkan mode terang' })).toBeInTheDocument()
    expect(within(mainNav()).getByRole('link', { name: 'Admin' })).toHaveAttribute('aria-current', 'page')
    expect(within(mainNav()).getByRole('link', { name: 'Ruang Kerja' })).not.toHaveAttribute('aria-current')

    const trigger = screen.getByRole('button', { name: /root/ })
    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('@root · Admin')).toBeInTheDocument()

    const swatches = screen.getAllByRole('button', { name: /^Aksen/ })
    expect(swatches[0]).toHaveAttribute('aria-pressed', 'true')
    expect(swatches[1]).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(swatches[1])
    expect(setAccent).toHaveBeenCalledWith('cobalt')

    fireEvent.click(screen.getByRole('button', { name: 'Keluar' }))
    expect(onLogout).toHaveBeenCalled()
  })

  it('closes the user menu with Escape or an outside click, but not inside clicks or other keys', () => {
    setup({ user: makeUser() })
    const trigger = screen.getByRole('button', { name: /Budi Santoso/ })
    fireEvent.click(trigger)
    expect(screen.getByText('@budi · Penulis')).toBeInTheDocument()

    fireEvent.mouseDown(screen.getByText('@budi · Penulis'))
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(screen.getByText('@budi · Penulis')).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByText('@budi · Penulis')).not.toBeInTheDocument()

    fireEvent.click(trigger)
    fireEvent.mouseDown(document.body)
    expect(screen.queryByText('@budi · Penulis')).not.toBeInTheDocument()

    fireEvent.click(trigger)
    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('offers a mobile menu for guests', () => {
    const { navigate } = setup()
    const toggle = screen.getByRole('button', { name: 'Buka menu' })
    fireEvent.click(toggle)
    const mobile = screen.getByRole('navigation', { name: 'Navigasi seluler' })
    expect(toggle).toHaveAttribute('aria-controls', mobile.id)

    fireEvent.click(within(mobile).getByRole('link', { name: 'Masuk' }))
    expect(navigate).toHaveBeenCalledWith('/login')
    expect(screen.queryByRole('navigation', { name: 'Navigasi seluler' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Buka menu' }))
    fireEvent.click(within(screen.getByRole('navigation', { name: 'Navigasi seluler' })).getByRole('link', { name: 'Daftar' }))
    expect(navigate).toHaveBeenLastCalledWith('/register')

    fireEvent.click(screen.getByRole('button', { name: 'Buka menu' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tutup menu' }))
    expect(screen.queryByRole('navigation', { name: 'Navigasi seluler' })).not.toBeInTheDocument()
  })

  it('offers a mobile menu with logout for signed-in users', () => {
    const { navigate, onLogout } = setup({ user: makeUser(), path: '/author' })
    fireEvent.click(screen.getByRole('button', { name: 'Buka menu' }))
    const mobile = screen.getByRole('navigation', { name: 'Navigasi seluler' })
    fireEvent.click(within(mobile).getByRole('link', { name: 'Ruang Kerja' }))
    expect(navigate).toHaveBeenCalledWith('/author')

    fireEvent.click(screen.getByRole('button', { name: 'Buka menu' }))
    fireEvent.click(screen.getByRole('button', { name: 'Keluar (budi)' }))
    expect(onLogout).toHaveBeenCalled()
  })
})
