import { useEffect, useId, useRef, useState } from 'react'
import { IconLogout, IconMenu2, IconMoon, IconSun, IconX } from '@tabler/icons-react'
import { initials, linkHandler } from '../../../helpers/toolsHelper'

function navLinks(user) {
  const links = [{ to: '/', label: 'Beranda' }]
  if (user) links.push({ to: '/author', label: 'Ruang Kerja' })
  if (user?.role === 'admin') links.push({ to: '/admin', label: 'Admin' })
  return links
}

function isActive(path, to) {
  return to === '/' ? path === '/' || path === '/public' || path.startsWith('/posts/') : path === to
}

function UserMenu({ user, theme, onLogout }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const panelId = useId()

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      if (!rootRef.current.contains(event.target)) setOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const displayName = user.name || user.username

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="flex items-center gap-2 rounded-full border border-line-strong py-1 pl-1 pr-3 text-sm font-medium hover:bg-raised"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-ink text-xs font-semibold text-bg" aria-hidden="true">
          {initials(displayName)}
        </span>
        <span className="max-w-[9rem] truncate">{displayName}</span>
        <span className="sr-only">— buka menu akun</span>
      </button>
      {open && (
        <div id={panelId} className="menu top-12 w-64">
          <div className="border-b border-line px-3 pb-3 pt-2">
            <p className="font-semibold text-ink">{displayName}</p>
            <p className="meta">
              @{user.username} · {user.role === 'admin' ? 'Admin' : 'Penulis'}
            </p>
          </div>
          <fieldset className="border-b border-line px-3 py-3">
            <legend className="eyebrow mb-2">Warna aksen</legend>
            <div className="flex gap-2">
              {theme.accents.map((accent) => (
                <button
                  key={accent.id}
                  type="button"
                  aria-pressed={theme.accent === accent.id}
                  aria-label={`Aksen ${accent.name}`}
                  onClick={() => theme.setAccent(accent.id)}
                  className={`h-7 w-7 rounded-full border-2 ${theme.accent === accent.id ? 'border-ink' : 'border-transparent'}`}
                >
                  <span className="block h-full w-full rounded-full" style={{ background: accent.swatch }} />
                </button>
              ))}
            </div>
          </fieldset>
          <div className="pt-1.5">
            <button type="button" className="menu-item" onClick={onLogout}>
              <IconLogout size={18} aria-hidden="true" /> Keluar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Navbar atas sticky untuk seluruh halaman (tanpa sidebar).
export default function StickyNavbar({ path, user, theme, navigate, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const mobileId = useId()
  const links = navLinks(user)

  const go = (to) => {
    setMobileOpen(false)
    navigate(to)
  }

  const linkProps = (to) => ({
    href: to,
    onClick: linkHandler(go, to),
    'aria-current': isActive(path, to) ? 'page' : undefined,
  })

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur-md">
      <div className="page-wide flex h-16 items-center gap-3">
        <a href="/" onClick={linkHandler(go, '/')} className="flex items-baseline gap-1">
          <span className="display text-[1.7rem] leading-none">Delcom</span>
          <span className="display text-[1.7rem] italic leading-none text-muted">blog</span>
          <span className="ml-0.5 h-1.5 w-1.5 -translate-y-1 rounded-full bg-accent" aria-hidden="true" />
        </a>

        <nav aria-label="Navigasi utama" className="ml-6 hidden md:block">
          <ul className="flex items-center gap-1">
            {links.map((link) => (
              <li key={link.to}>
                <a
                  {...linkProps(link.to)}
                  className="rounded-full px-3.5 py-2 text-sm font-medium text-ink-2 hover:text-ink aria-[current=page]:bg-raised aria-[current=page]:text-ink"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            className="icon-btn"
            onClick={theme.toggleMode}
            aria-label={theme.mode === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
          >
            {theme.mode === 'dark' ? <IconSun size={19} aria-hidden="true" /> : <IconMoon size={19} aria-hidden="true" />}
          </button>

          {user ? (
            <div className="hidden md:block">
              <UserMenu user={user} theme={theme} onLogout={onLogout} />
            </div>
          ) : (
            <div className="hidden items-center gap-1.5 sm:flex">
              <a href="/login" onClick={linkHandler(go, '/login')} className="btn btn-sm text-ink-2 hover:bg-raised">
                Masuk
              </a>
              <a href="/register" onClick={linkHandler(go, '/register')} className="btn btn-sm btn-primary">
                Daftar
              </a>
            </div>
          )}

          <button
            type="button"
            className="icon-btn md:hidden"
            aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={mobileOpen}
            aria-controls={mobileId}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <IconX size={20} aria-hidden="true" /> : <IconMenu2 size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav id={mobileId} aria-label="Navigasi seluler" className="border-t border-line bg-bg md:hidden">
          <ul className="page-wide grid gap-1 py-3">
            {links.map((link) => (
              <li key={link.to}>
                <a {...linkProps(link.to)} className="block rounded-lg px-3 py-2.5 font-medium aria-[current=page]:bg-raised">
                  {link.label}
                </a>
              </li>
            ))}
            {user ? (
              <li>
                <button type="button" className="menu-item !px-3 !py-2.5 !text-base" onClick={onLogout}>
                  <IconLogout size={18} aria-hidden="true" /> Keluar ({user.username})
                </button>
              </li>
            ) : (
              <>
                <li>
                  <a {...linkProps('/login')} className="block rounded-lg px-3 py-2.5 font-medium">
                    Masuk
                  </a>
                </li>
                <li>
                  <a {...linkProps('/register')} className="block rounded-lg px-3 py-2.5 font-medium">
                    Daftar
                  </a>
                </li>
              </>
            )}
          </ul>
        </nav>
      )}
    </header>
  )
}
