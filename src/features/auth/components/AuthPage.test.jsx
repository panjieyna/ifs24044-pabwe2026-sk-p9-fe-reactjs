import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deferred, makeUser } from '../../../test/fixtures'
import { login, register } from '../api/authApi'
import AuthForm from './AuthForm'
import AuthPage from './AuthPage'

vi.mock('../api/authApi', () => ({ login: vi.fn(), register: vi.fn() }))

const type = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } })

describe('AuthForm (login)', () => {
  beforeEach(() => {
    login.mockReset()
    register.mockReset()
  })

  it('exposes the required login ids and submits trimmed credentials', async () => {
    const onSuccess = vi.fn()
    const pending = deferred()
    login.mockReturnValue(pending.promise)
    render(<AuthForm mode="login" onSuccess={onSuccess} onSwitchMode={() => {}} />)

    expect(document.getElementById('login-username')).toBeInTheDocument()
    expect(document.getElementById('login-password')).toHaveAttribute('type', 'password')
    expect(document.getElementById('login-submit')).toHaveTextContent('Masuk')

    type('Username atau email', '  member ')
    type('Kata sandi', 'member')
    fireEvent.submit(document.getElementById('login-submit').closest('form'))

    expect(await screen.findByText('Memproses…')).toBeInTheDocument()
    expect(document.getElementById('login-submit')).toBeDisabled()
    pending.resolve({ token: 't', user: makeUser() })
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ token: 't', user: makeUser() }))
    expect(login).toHaveBeenCalledWith({ username: 'member', password: 'member' })
  })

  it('shows a translated error for known messages and the raw message otherwise', async () => {
    login.mockRejectedValueOnce(new Error('invalid username or password'))
    render(<AuthForm mode="login" onSuccess={() => {}} onSwitchMode={() => {}} />)
    const form = document.getElementById('login-submit').closest('form')

    fireEvent.submit(form)
    expect(await screen.findByRole('alert')).toHaveTextContent('Username/email atau kata sandi salah.')
    expect(form).toHaveAttribute('aria-describedby', screen.getByRole('alert').id)
    expect(document.getElementById('login-submit')).not.toBeDisabled()

    login.mockRejectedValueOnce(new Error('Server sibuk'))
    fireEvent.submit(form)
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Server sibuk'))
  })

  it('toggles password visibility and switches to register', () => {
    const onSwitchMode = vi.fn()
    render(<AuthForm mode="login" onSuccess={() => {}} onSwitchMode={onSwitchMode} />)
    fireEvent.click(screen.getByRole('button', { name: 'Tampilkan kata sandi' }))
    expect(document.getElementById('login-password')).toHaveAttribute('type', 'text')
    fireEvent.click(screen.getByRole('button', { name: 'Sembunyikan kata sandi' }))
    expect(document.getElementById('login-password')).toHaveAttribute('type', 'password')

    fireEvent.click(screen.getByRole('link', { name: 'Daftar sebagai penulis' }))
    expect(onSwitchMode).toHaveBeenCalledWith('register')
  })
})

describe('AuthForm (register)', () => {
  it('validates the password length locally before calling the API', async () => {
    render(<AuthForm mode="register" onSuccess={() => {}} onSwitchMode={() => {}} />)
    type('Kata sandi', '123')
    fireEvent.submit(document.getElementById('register-submit').closest('form'))
    expect(await screen.findByRole('alert')).toHaveTextContent('Kata sandi minimal 6 karakter.')
    expect(register).not.toHaveBeenCalled()
  })

  it('registers a new author with all fields', async () => {
    const onSuccess = vi.fn()
    register.mockResolvedValueOnce({ token: 't', user: makeUser() })
    register.mockRejectedValueOnce(new Error('username already registered'))
    const onSwitchMode = vi.fn()
    render(<AuthForm mode="register" onSuccess={onSuccess} onSwitchMode={onSwitchMode} />)

    type('Nama tampilan (opsional)', ' Budi ')
    type('Username', 'budi')
    type('Email', 'budi@example.com')
    type('Kata sandi', 'rahasia1')
    fireEvent.submit(document.getElementById('register-submit').closest('form'))
    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
    expect(register).toHaveBeenCalledWith({ name: 'Budi', username: 'budi', email: 'budi@example.com', password: 'rahasia1' })

    fireEvent.submit(document.getElementById('register-submit').closest('form'))
    expect(await screen.findByRole('alert')).toHaveTextContent('Username sudah dipakai penulis lain.')

    fireEvent.click(screen.getByRole('link', { name: 'Masuk di sini' }))
    expect(onSwitchMode).toHaveBeenCalledWith('login')
  })
})

describe('AuthPage', () => {
  it('renders the login page, sets the title, and navigates', () => {
    const navigate = vi.fn()
    render(<AuthPage mode="login" navigate={navigate} onAuthenticated={() => {}} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Selamat datang kembali.' })).toBeInTheDocument()
    expect(document.title).toBe('Masuk — Delcom Blog')

    fireEvent.click(screen.getByRole('link', { name: 'Kembali ke beranda' }))
    expect(navigate).toHaveBeenCalledWith('/')
    fireEvent.click(screen.getByRole('link', { name: 'Daftar sebagai penulis' }))
    expect(navigate).toHaveBeenCalledWith('/register')
  })

  it('renders the register page', () => {
    render(<AuthPage mode="register" navigate={() => {}} onAuthenticated={() => {}} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Mulai menulis.' })).toBeInTheDocument()
    expect(document.title).toBe('Daftar — Delcom Blog')
    expect(document.getElementById('register-email')).toBeInTheDocument()
  })
})
