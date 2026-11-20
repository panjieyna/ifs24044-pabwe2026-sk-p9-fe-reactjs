import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import useTheme from './hooks/useTheme'
import { clearSession, getAccessToken, getUser, onUnauthorized, putAccessToken, putUser } from './helpers/apiHelper'
import { linkHandler, setPageMeta, showSuccessAlert } from './helpers/toolsHelper'
import { getProfile, logout } from './features/auth/api/authApi'
import AuthModal from './features/auth/modals/AuthModal'
import PublicArticleDetail from './features/blog/components/PublicArticleDetail'
import PublicArticleList from './features/blog/components/PublicArticleList'
import StickyNavbar from './features/blog/components/StickyNavbar'

const AuthorDashboard = lazy(() => import('./features/blog/components/AuthorDashboard'))
const AdminDashboard = lazy(() => import('./features/admin/components/AdminDashboard'))
const AuthPage = lazy(() => import('./features/auth/components/AuthPage'))

export function parseRoute(pathname) {
  if (pathname === '/' || pathname === '/public') return { name: 'home' }
  const post = pathname.match(/^\/posts\/([^/]+)\/?$/)
  if (post) return { name: 'post', slug: decodeURIComponent(post[1]) }
  const simple = { '/author': 'author', '/admin': 'admin', '/login': 'login', '/register': 'register' }
  return { name: simple[pathname.replace(/\/+$/, '')] || 'notfound' }
}

function PageFallback() {
  return (
    <div role="status" aria-busy="true" className="page-wide min-h-screen space-y-4 py-16">
      <span className="sr-only">Memuat halaman…</span>
      <div className="skeleton h-3 w-28" />
      <div className="skeleton h-14 w-3/4" />
      <div className="skeleton h-14 w-1/2" />
    </div>
  )
}

function NotFound({ navigate }) {
  useEffect(() => setPageMeta('Halaman tidak ditemukan'), [])
  return (
    <div className="page-wide py-24 text-center">
      <p className="display text-[7rem] leading-none text-muted" aria-hidden="true">
        404
      </p>
      <h1 className="display mt-4 text-4xl">Halaman ini tidak ada.</h1>
      <p className="mt-3 text-ink-2">Tautan mungkin salah ketik atau halaman sudah dipindahkan.</p>
      <a href="/" onClick={linkHandler(navigate, '/')} className="btn btn-primary mt-8">
        Kembali ke beranda
      </a>
    </div>
  )
}

function SiteFooter({ user, navigate }) {
  const links = user
    ? [
        ['/', 'Beranda'],
        ['/author', 'Ruang kerja'],
      ]
    : [
        ['/', 'Beranda'],
        ['/login', 'Masuk'],
        ['/register', 'Daftar'],
      ]
  return (
    <footer className="border-t border-line">
      <div className="page-wide flex flex-col gap-8 py-12 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="display text-3xl">
            Delcom <em className="text-muted">blog</em>
          </p>
          <p className="meta mt-2 max-w-sm">Ruang menulis yang tenang untuk mahasiswa dan praktisi.</p>
        </div>
        <nav aria-label="Tautan footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
            {links.map(([to, label]) => (
              <li key={to}>
                <a href={to} onClick={linkHandler(navigate, to)} className="link-sweep">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <p className="meta">© {new Date().getFullYear()} Delcom Blog</p>
      </div>
    </footer>
  )
}

// Orkestrator SPA: routing berbasis History API, sesi login, tema, dan penjaga hak akses.
export default function App() {
  const theme = useTheme()
  const [path, setPath] = useState(() => window.location.pathname)
  const [user, setUser] = useState(() => (getAccessToken() ? getUser() : null))
  const [authModalOpen, setAuthModalOpen] = useState(false)

  const navigate = useCallback((to, { replace = false } = {}) => {
    window.history[replace ? 'replaceState' : 'pushState']({}, '', to)
    setPath(to)
    window.scrollTo(0, 0)
  }, [])

  const endSession = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    onUnauthorized(() => {
      endSession()
      navigate('/login', { replace: true })
    })
    return () => onUnauthorized(null)
  }, [endSession, navigate])

  useEffect(() => {
    if (!getAccessToken()) return
    getProfile()
      .then((profile) => {
        putUser(profile)
        setUser(profile)
      })
      .catch(() => {})
  }, [])

  const route = parseRoute(path)

  useEffect(() => {
    const needsAuth = route.name === 'author' || route.name === 'admin'
    if (needsAuth && !user) navigate('/login', { replace: true })
    else if (route.name === 'admin' && user.role !== 'admin') navigate('/author', { replace: true })
    else if ((route.name === 'login' || route.name === 'register') && user) navigate('/author', { replace: true })
  }, [route.name, user, navigate])

  const handleAuthenticated = ({ token, user: account }) => {
    putAccessToken(token)
    putUser(account)
    setUser(account)
    setAuthModalOpen(false)
    showSuccessAlert(`Selamat datang, ${account.name || account.username}`)
    navigate('/author')
  }

  const handleLogout = async () => {
    await logout()
    endSession()
    showSuccessAlert('Kamu telah keluar')
    navigate('/')
  }

  let page
  switch (route.name) {
    case 'home':
      page = <PublicArticleList navigate={navigate} user={user} onStartWriting={() => setAuthModalOpen(true)} />
      break
    case 'post':
      page = <PublicArticleDetail key={route.slug} slug={route.slug} navigate={navigate} />
      break
    case 'author':
      page = user && <AuthorDashboard user={user} navigate={navigate} />
      break
    case 'admin':
      page = user?.role === 'admin' && <AdminDashboard navigate={navigate} />
      break
    case 'login':
    case 'register':
      page = !user && <AuthPage mode={route.name} navigate={navigate} onAuthenticated={handleAuthenticated} />
      break
    default:
      page = <NotFound navigate={navigate} />
  }

  const isAuthRoute = route.name === 'login' || route.name === 'register'

  return (
    <>
      <a
        href="#konten"
        className="sr-only-focusable fixed left-4 top-3 z-[60] rounded-full bg-ink px-4 py-2 text-sm font-semibold text-bg"
      >
        Lewati ke konten
      </a>
      <StickyNavbar path={path} user={user} theme={theme} navigate={navigate} onLogout={handleLogout} />
      <main id="konten" tabIndex={-1} className="min-h-[70vh] focus:outline-none">
        <Suspense fallback={<PageFallback />}>{page}</Suspense>
      </main>
      {!isAuthRoute && <SiteFooter user={user} navigate={navigate} />}
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuthenticated={handleAuthenticated}
        onRegister={() => {
          setAuthModalOpen(false)
          navigate('/register')
        }}
      />
    </>
  )
}
