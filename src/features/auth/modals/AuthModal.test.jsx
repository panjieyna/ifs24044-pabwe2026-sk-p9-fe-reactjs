import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AuthModal from './AuthModal'

vi.mock('../api/authApi', () => ({ login: vi.fn(), register: vi.fn() }))

describe('AuthModal', () => {
  it('shows the login form in a dialog and links to registration', () => {
    const onRegister = vi.fn()
    const onClose = vi.fn()
    render(<AuthModal open onClose={onClose} onAuthenticated={() => {}} onRegister={onRegister} />)

    expect(screen.getByRole('dialog', { name: 'Masuk untuk menulis' })).toBeInTheDocument()
    expect(document.getElementById('login-username')).toBeInTheDocument()
    expect(document.getElementById('login-password')).toBeInTheDocument()
    expect(document.getElementById('login-submit')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('link', { name: 'Daftar sebagai penulis' }))
    expect(onRegister).toHaveBeenCalledWith('register')
    fireEvent.click(screen.getByRole('button', { name: 'Tutup dialog' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('renders nothing when closed', () => {
    render(<AuthModal open={false} onClose={() => {}} onAuthenticated={() => {}} onRegister={() => {}} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
