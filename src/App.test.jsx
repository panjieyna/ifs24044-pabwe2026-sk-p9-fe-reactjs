import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import Swal from 'sweetalert2'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App, { parseRoute } from './App'
import { getUsers, getAllPosts } from './features/admin/api/adminApi'
import { getProfile, login, logout } from './features/auth/api/authApi'
import * as blogApi from './features/blog/api/blogApi'
import { fetchData, getAccessToken } from './helpers/apiHelper'
import { makePost, makeUser } from './test/fixtures'

vi.mock('./features/auth/api/authApi', () => ({
  getProfile: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
}))
vi.mock('./features/admin/api/adminApi', () => ({ getUsers: vi.fn(), getAllPosts: vi.fn(), getUserPosts: vi.fn() }))
vi.mock('./features/blog/api/blogApi', async (importOriginal) => ({
  ...(await importOriginal()),
  getCategories: vi.fn(),
  getPublicPosts: vi.fn(),
  getPublicPost: vi.fn(),
  getMyPosts: vi.fn(),
  getPostStats: vi.fn(),
}))

function signIn(user = makeUser()) {
  localStorage.setItem('delcom-token', 'token')
  localStorage.setItem('delcom-user', JSON.stringify(user))
}

function visit(path) {
  window.history.replaceState({}, '', path)
  return render(<App />)
}

describe('parseRoute', () => {
  it('maps paths to routes', () => {
    expect(parseRoute('/')).toEqual({ name: 'home' })
    expect(parseRoute('/public')).toEqual({ name: 'home' })
    expect(parseRoute('/posts/judul%20aneh/')).toEqual({ name: 'post', slug: 'judul aneh' })
    expect(parseRoute('/posts/a/b')).toEqual({ name: 'notfound' })
    expect(parseRoute('/author')).toEqual({ name: 'author' })
    expect(parseRoute('/admin/')).toEqual({ name: 'admin' })
    expect(parseRoute('/login')).toEqual({ name: 'login' })
    expect(parseRoute('/register')).toEqual({ name: 'register' })
    expect(parseRoute('/apa-saja')).toEqual({ name: 'notfound' })
  })
})

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    blogApi.getCategories.mockResolvedValue(['Teknologi'])
    blogApi.getPublicPosts.mockResolvedValue([makePost({ title: 'Artikel Publik', slug: 'artikel-publik' })])
    blogApi.getPublicPost.mockResolvedValue(makePost({ title: 'Detail Artikel' }))
    blogApi.getMyPosts.mockResolvedValue([])
    blogApi.getPostStats.mockResolvedValue({ total: 0, published: 0, draft: 0 })
    getUsers.mockResolvedValue([])
    getAllPosts.mockResolvedValue([])
    getProfile.mockResolvedValue(makeUser())
    logout.mockResolvedValue()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the public home with skip link, navbar, and guest footer', async () => {
    visit('/')
    expect(screen.getByRole('link', { name: 'Lewati ke konten' })).toHaveAttribute('href', '#konten')
    expect(await screen.findByRole('heading', { level: 2, name: 'Artikel Publik' })).toBeInTheDocument()
    const footer = screen.getByRole('navigation', { name: 'Tautan footer' })
    expect(within(footer).getAllByRole('link').map((a) => a.textContent)).toEqual(['Beranda', 'Masuk', 'Daftar'])
    expect(getProfile).not.toHaveBeenCalled()
  })

  it('opens the auth modal from the hero and moves to registration', async () => {
    visit('/')
    fireEvent.click(screen.getByRole('button', { name: 'Mulai menulis' }))
    const dialog = screen.getByRole('dialog', { name: 'Masuk untuk menulis' })
    fireEvent.click(within(dialog).getByRole('link', { name: 'Daftar sebagai penulis' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Mulai menulis.' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/register')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Tautan footer' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('link', { name: 'Kembali ke beranda' }))
    await screen.findByRole('heading', { level: 2, name: 'Artikel Publik' })

    fireEvent.click(screen.getByRole('button', { name: 'Mulai menulis' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tutup dialog' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('logs in from the login page and lands in the workspace', async () => {
    login.mockResolvedValue({ token: 'jwt', user: makeUser({ name: '', username: 'siti' }) })
    visit('/login')
    await screen.findByRole('heading', { level: 1, name: 'Selamat datang kembali.' })
    fireEvent.change(document.getElementById('login-username'), { target: { value: 'siti' } })
    fireEvent.change(document.getElementById('login-password'), { target: { value: 'rahasia' } })
    fireEvent.click(document.getElementById('login-submit'))

    expect(await screen.findByRole('heading', { level: 1, name: 'Halo, siti.' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/author')
    expect(getAccessToken()).toBe('jwt')
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: 'Selamat datang, siti' }))
  })

  it('welcomes users by display name after modal login', async () => {
    login.mockResolvedValue({ token: 'jwt', user: makeUser() })
    visit('/')
    fireEvent.click(screen.getByRole('button', { name: 'Mulai menulis' }))
    fireEvent.change(document.getElementById('login-username'), { target: { value: 'budi' } })
    fireEvent.change(document.getElementById('login-password'), { target: { value: 'rahasia' } })
    fireEvent.click(document.getElementById('login-submit'))
    await screen.findByRole('heading', { level: 1, name: 'Halo, Budi.' })
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: 'Selamat datang, Budi Santoso' }))
  })

  it('guards private routes', async () => {
    const guest = visit('/author')
    expect(await screen.findByRole('heading', { level: 1, name: 'Selamat datang kembali.' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/login')
    guest.unmount()

    const guestAdmin = visit('/admin')
    await waitFor(() => expect(window.location.pathname).toBe('/login'))
    guestAdmin.unmount()

    signIn()
    const member = visit('/admin')
    expect(await screen.findByRole('heading', { level: 1, name: 'Halo, Budi.' })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/author')
    member.unmount()

    for (const path of ['/login', '/register']) {
      const view = visit(path)
      await waitFor(() => expect(window.location.pathname).toBe('/author'))
      view.unmount()
    }
  })

  it('shows the admin panel for admins with a signed-in footer', async () => {
    const admin = makeUser({ role: 'admin', name: 'Administrator', username: 'admin' })
    signIn(admin)
    getProfile.mockResolvedValue(admin)
    visit('/admin')
    expect(await screen.findByRole('heading', { level: 1, name: 'Ikhtisar sistem.' })).toBeInTheDocument()
    const footer = screen.getByRole('navigation', { name: 'Tautan footer' })
    expect(within(footer).getAllByRole('link').map((a) => a.textContent)).toEqual(['Beranda', 'Ruang kerja'])
  })

  it('refreshes the stored profile and tolerates a failed refresh', async () => {
    signIn(makeUser({ name: 'Nama Lama' }))
    getProfile.mockResolvedValueOnce(makeUser({ name: 'Nama Baru' }))
    const first = visit('/')
    expect(await screen.findByRole('button', { name: /Nama Baru/ })).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('delcom-user')).name).toBe('Nama Baru')
    first.unmount()

    getProfile.mockRejectedValueOnce(new Error('offline'))
    visit('/')
    await waitFor(() => expect(getProfile).toHaveBeenCalledTimes(2))
    expect(screen.getByRole('button', { name: /Nama Baru/ })).toBeInTheDocument()
  })

  it('logs out through the user menu', async () => {
    signIn()
    visit('/')
    fireEvent.click(await screen.findByRole('button', { name: /Budi Santoso/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Keluar' }))
    await waitFor(() => expect(getAccessToken()).toBe(''))
    expect(logout).toHaveBeenCalled()
    expect(window.location.pathname).toBe('/')
    expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: 'Kamu telah keluar' }))
  })

  it('ends the session when an authenticated request is rejected', async () => {
    signIn()
    visit('/author')
    await screen.findByRole('heading', { level: 1, name: 'Halo, Budi.' })
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({ message: 'Unauthorized' }) })))
    await act(async () => {
      await fetchData('/posts').catch(() => {})
    })
    expect(await screen.findByRole('heading', { level: 1, name: 'Selamat datang kembali.' })).toBeInTheDocument()
    expect(getAccessToken()).toBe('')
  })

  it('renders article pages, a 404 page, and follows browser history', async () => {
    const view = visit('/posts/detail-artikel')
    expect(await screen.findByRole('heading', { level: 1, name: 'Detail Artikel' })).toBeInTheDocument()
    view.unmount()

    visit('/tidak-ada')
    expect(screen.getByRole('heading', { level: 1, name: 'Halaman ini tidak ada.' })).toBeInTheDocument()
    expect(document.title).toBe('Halaman tidak ditemukan — Delcom Blog')
    fireEvent.click(screen.getByRole('link', { name: 'Kembali ke beranda' }))
    expect(await screen.findByRole('heading', { level: 2, name: 'Artikel Publik' })).toBeInTheDocument()

    act(() => {
      window.history.pushState({}, '', '/tidak-ada-lagi')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    expect(screen.getByRole('heading', { level: 1, name: 'Halaman ini tidak ada.' })).toBeInTheDocument()
  })
})
