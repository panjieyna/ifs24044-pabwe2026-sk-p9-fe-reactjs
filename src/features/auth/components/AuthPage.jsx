import { useEffect } from 'react'
import { IconArrowLeft } from '@tabler/icons-react'
import { linkHandler, setPageMeta } from '../../../helpers/toolsHelper'
import AuthForm from './AuthForm'

const FEATURES = [
  'Editor Markdown dengan pratinjau langsung',
  'Simpan sebagai draf, terbitkan kapan pun',
  'Asisten AI dengan rujukan dari mesin pencari',
]

// Halaman login (/login) dan registrasi (/register) mandiri.
export default function AuthPage({ mode, navigate, onAuthenticated }) {
  const isLogin = mode === 'login'

  useEffect(() => {
    setPageMeta(isLogin ? 'Masuk' : 'Daftar', 'Masuk atau daftar sebagai penulis di Delcom Blog.')
  }, [isLogin])

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <section
        aria-label="Tentang ruang penulis"
        className="relative hidden flex-col justify-between overflow-hidden bg-chrome p-12 text-chrome-ink lg:flex xl:p-16"
      >
        <p className="eyebrow !text-chrome-muted">Delcom Blog · Ruang penulis</p>
        <p className="display max-w-xl text-6xl xl:text-7xl">
          Tulis pelan-pelan. <em className="text-chrome-muted">Terbitkan saat siap.</em>
        </p>
        <ul className="grid gap-3 text-sm text-chrome-muted">
          {FEATURES.map((feature) => (
            <li key={feature} className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
              {feature}
            </li>
          ))}
        </ul>
      </section>

      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="fade-up w-full max-w-md">
          <a href="/" onClick={linkHandler(navigate, '/')} className="meta inline-flex items-center gap-2 hover:text-ink">
            <IconArrowLeft size={16} aria-hidden="true" /> Kembali ke beranda
          </a>
          <h1 className="display mt-8 text-5xl sm:text-6xl">{isLogin ? 'Selamat datang kembali.' : 'Mulai menulis.'}</h1>
          <p className="mt-3 text-ink-2">
            {isLogin
              ? 'Masuk untuk mengelola tulisan di ruang kerjamu.'
              : 'Buat akun penulis gratis — kurang dari semenit.'}
          </p>
          <div className="mt-8">
            <AuthForm key={mode} mode={mode} onSuccess={onAuthenticated} onSwitchMode={(next) => navigate(`/${next}`)} />
          </div>
        </div>
      </div>
    </div>
  )
}
