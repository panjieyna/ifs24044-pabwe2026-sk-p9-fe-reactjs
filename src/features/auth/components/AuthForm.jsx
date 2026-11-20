import { useId, useState } from 'react'
import { IconArrowRight, IconEye, IconEyeOff, IconLoader2 } from '@tabler/icons-react'
import useInput from '../../../hooks/useInput'
import { login, register } from '../api/authApi'

const MESSAGES = {
  'invalid username or password': 'Username/email atau kata sandi salah.',
  'username already registered': 'Username sudah dipakai penulis lain.',
  'email already registered': 'Email sudah terdaftar.',
  'username may only contain letters, numbers, dots, underscores, and dashes':
    'Username hanya boleh berisi huruf, angka, titik, garis bawah, dan tanda hubung.',
}

// Form login/registrasi yang dipakai bersama oleh AuthPage dan AuthModal.
// Form login memakai id wajib: login-username, login-password, login-submit.
export default function AuthForm({ mode, onSuccess, onSwitchMode }) {
  const isLogin = mode === 'login'
  const prefix = isLogin ? 'login' : 'register'
  const errorId = useId()

  const [name, onName] = useInput('')
  const [username, onUsername] = useInput('')
  const [email, onEmail] = useInput('')
  const [password, onPassword] = useInput('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (!isLogin && password.length < 6) {
      setError('Kata sandi minimal 6 karakter.')
      return
    }
    setLoading(true)
    try {
      const data = isLogin
        ? await login({ username: username.trim(), password })
        : await register({ name: name.trim(), username: username.trim(), email: email.trim(), password })
      onSuccess(data)
    } catch (err) {
      setError(MESSAGES[err.message] || err.message)
      setLoading(false)
    }
  }

  const switchTo = isLogin ? 'register' : 'login'

  return (
    <form onSubmit={handleSubmit} className="space-y-5" aria-describedby={error ? errorId : undefined}>
      {!isLogin && (
        <div>
          <label htmlFor="register-name" className="field-label">
            Nama tampilan <span className="font-normal text-muted">(opsional)</span>
          </label>
          <input id="register-name" className="field" value={name} onChange={onName} autoComplete="name" maxLength={255} />
        </div>
      )}

      <div>
        <label htmlFor={`${prefix}-username`} className="field-label">
          {isLogin ? 'Username atau email' : 'Username'}
        </label>
        <input
          id={`${prefix}-username`}
          name="username"
          className="field"
          value={username}
          onChange={onUsername}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={255}
        />
      </div>

      {!isLogin && (
        <div>
          <label htmlFor="register-email" className="field-label">
            Email
          </label>
          <input
            id="register-email"
            name="email"
            type="email"
            className="field"
            value={email}
            onChange={onEmail}
            autoComplete="email"
            required
          />
        </div>
      )}

      <div>
        <label htmlFor={`${prefix}-password`} className="field-label">
          Kata sandi
        </label>
        <div className="relative">
          <input
            id={`${prefix}-password`}
            name="password"
            type={showPassword ? 'text' : 'password'}
            className="field pr-12"
            value={password}
            onChange={onPassword}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            required
            maxLength={72}
          />
          <button
            type="button"
            className="icon-btn absolute right-1 top-1/2 -translate-y-1/2"
            aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((v) => !v)}
          >
            {showPassword ? <IconEyeOff size={18} aria-hidden="true" /> : <IconEye size={18} aria-hidden="true" />}
          </button>
        </div>
        {!isLogin && <p className="field-hint">Minimal 6 karakter.</p>}
      </div>

      {error && (
        <p id={errorId} role="alert" className="rounded-lg border border-danger/40 px-3.5 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      <button id={`${prefix}-submit`} type="submit" className="btn btn-primary h-11 w-full" disabled={loading}>
        {loading ? (
          <>
            <IconLoader2 size={18} className="spin" aria-hidden="true" /> Memproses…
          </>
        ) : (
          <>
            {isLogin ? 'Masuk' : 'Buat akun'} <IconArrowRight size={18} aria-hidden="true" />
          </>
        )}
      </button>

      <p className="text-center text-sm text-muted">
        {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
        <a
          href={`/${switchTo}`}
          className="font-semibold text-ink underline underline-offset-4"
          onClick={(event) => {
            event.preventDefault()
            onSwitchMode(switchTo)
          }}
        >
          {isLogin ? 'Daftar sebagai penulis' : 'Masuk di sini'}
        </a>
      </p>
    </form>
  )
}
