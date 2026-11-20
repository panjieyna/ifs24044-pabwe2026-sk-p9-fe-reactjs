import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import Swal from 'sweetalert2'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deferred, makePost } from '../../../test/fixtures'
import { getAllPosts, getUserPosts, getUsers } from '../api/adminApi'
import AdminDashboard from './AdminDashboard'

vi.mock('../api/adminApi', () => ({ getUsers: vi.fn(), getAllPosts: vi.fn(), getUserPosts: vi.fn() }))

const users = [
  { id: 1, name: 'Administrator', username: 'admin', email: 'admin@delcom.org', role: 'admin', created_at: '2026-11-01T00:00:00Z', total_posts: 1, total_published: 1 },
  { id: 2, name: '', username: 'siti', email: 'siti@example.com', role: 'member', created_at: '2026-11-02T00:00:00Z', total_posts: 0, total_published: 0 },
]
const posts = [makePost({ title: 'Terbit', slug: 'terbit' }), makePost({ title: 'Masih draf', is_published: false })]

function setup() {
  const navigate = vi.fn()
  render(<AdminDashboard navigate={navigate} />)
  return { navigate }
}

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getUsers.mockResolvedValue(users)
    getAllPosts.mockResolvedValue(posts)
  })

  it('summarises users and posts', async () => {
    setup()
    expect(screen.getByRole('status')).toBeInTheDocument()
    const summary = await screen.findByRole('region', { name: 'Ringkasan sistem' })
    expect(summary).toHaveTextContent('Pengguna2')
    expect(summary).toHaveTextContent('1 admin')
    expect(summary).toHaveTextContent('Penulis aktif1')
    expect(summary).toHaveTextContent('dari 2 total artikel')
    expect(document.title).toBe('Panel Admin — Delcom Blog')

    const table = screen.getByRole('table', { name: 'Direktori pengguna' })
    expect(within(table).getByText('Administrator')).toBeInTheDocument()
    expect(within(table).getAllByText('siti')).toHaveLength(1)
    expect(within(table).getByText('Penulis')).toBeInTheDocument()
  })

  it('switches tabs by click and arrow keys', async () => {
    const { navigate } = setup()
    const usersTab = await screen.findByRole('tab', { name: 'Pengguna' })
    const postsTab = screen.getByRole('tab', { name: 'Semua artikel' })
    expect(usersTab).toHaveAttribute('aria-selected', 'true')
    expect(postsTab).toHaveAttribute('tabindex', '-1')

    fireEvent.click(postsTab)
    const panel = screen.getByRole('tabpanel', { name: 'Semua artikel' })
    fireEvent.click(within(panel).getByRole('link', { name: 'Terbit' }))
    expect(navigate).toHaveBeenCalledWith('/posts/terbit')
    expect(within(panel).queryByRole('link', { name: 'Masih draf' })).not.toBeInTheDocument()

    fireEvent.keyDown(postsTab, { key: 'ArrowLeft' })
    expect(usersTab).toHaveAttribute('aria-selected', 'true')
    expect(usersTab).toHaveFocus()
    fireEvent.keyDown(usersTab, { key: 'Enter' })
    expect(usersTab).toHaveAttribute('aria-selected', 'true')
    fireEvent.keyDown(usersTab, { key: 'ArrowRight' })
    expect(postsTab).toHaveFocus()
  })

  it('shows posts of a selected user and clears the filter', async () => {
    const pending = deferred()
    getUserPosts.mockReturnValueOnce(pending.promise)
    setup()
    fireEvent.click(await screen.findByRole('button', { name: 'Lihat artikel milik Administrator' }))
    expect(screen.getByRole('tab', { name: 'Semua artikel' })).toHaveAttribute('aria-selected', 'true')
    expect(within(screen.getByRole('tabpanel')).getByRole('status')).toBeInTheDocument()

    pending.resolve([makePost({ title: 'Milik admin' })])
    expect(await screen.findByText('Milik admin')).toBeInTheDocument()
    expect(screen.getByText('Administrator', { selector: 'strong' })).toBeInTheDocument()
    expect(getUserPosts).toHaveBeenCalledWith(1)

    fireEvent.click(screen.getByRole('button', { name: 'Tampilkan semua' }))
    expect(screen.getByText('Masih draf')).toBeInTheDocument()
  })

  it('reports a failed user-posts request and shows an empty table', async () => {
    getUserPosts.mockRejectedValueOnce(new Error('user not found'))
    setup()
    fireEvent.click(await screen.findByRole('button', { name: 'Lihat artikel milik siti' }))
    expect(await screen.findByText('Belum ada artikel.')).toBeInTheDocument()
    expect(screen.getByText('siti', { selector: 'strong' })).toBeInTheDocument()
    await waitFor(() => expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ icon: 'error', text: 'user not found' })))
  })

  it('recovers from a failed initial load', async () => {
    getUsers.mockRejectedValueOnce(new Error('Forbidden: insufficient privileges'))
    setup()
    expect(await screen.findByRole('alert')).toHaveTextContent('Forbidden')
    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))
    expect(await screen.findByRole('region', { name: 'Ringkasan sistem' })).toBeInTheDocument()
  })
})
