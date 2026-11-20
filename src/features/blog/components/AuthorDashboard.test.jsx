import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import Swal from 'sweetalert2'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makePost, makeUser } from '../../../test/fixtures'
import { FakeEditor } from '../../../test/toastMock'
import * as api from '../api/blogApi'
import AuthorDashboard from './AuthorDashboard'

vi.mock('../api/blogApi', async (importOriginal) => ({
  ...(await importOriginal()),
  getMyPosts: vi.fn(),
  getPostStats: vi.fn(),
  createPost: vi.fn(),
  updatePost: vi.fn(),
  togglePublish: vi.fn(),
  deletePost: vi.fn(),
  generatePost: vi.fn(),
}))

const alpha = () => makePost({ id: 1, title: 'Alpha', slug: 'alpha', is_published: true })
const beta = () => makePost({ id: 2, title: 'Beta', slug: 'beta', is_published: false, published_at: null })
const stats = { total: 2, published: 1, draft: 1 }

function setup(user = makeUser()) {
  const navigate = vi.fn()
  render(<AuthorDashboard user={user} navigate={navigate} />)
  return { navigate }
}

const row = (title) => screen.getByText(title).closest('tr')
const lastToast = () => Swal.fire.mock.calls.at(-1)[0]

describe('AuthorDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    FakeEditor.instances.length = 0
    api.getMyPosts.mockResolvedValue([alpha(), beta()])
    api.getPostStats.mockResolvedValue(stats)
  })

  it('shows the greeting, stats, and the posts table', async () => {
    setup()
    expect(screen.getByRole('heading', { level: 1, name: 'Halo, Budi.' })).toBeInTheDocument()
    expect(await screen.findByText('Alpha')).toBeInTheDocument()
    expect(document.title).toBe('Ruang Kerja — Delcom Blog')
    expect(screen.getByTestId('stat-total')).toHaveTextContent('2')
    expect(within(row('Alpha')).getByRole('switch')).toHaveAttribute('aria-checked', 'true')
    expect(within(row('Beta')).getByText('Draf')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Semua 2' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('greets by username when the display name is empty', async () => {
    setup(makeUser({ name: '', username: 'siti' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Halo, siti.' })).toBeInTheDocument()
    await screen.findByText('Alpha')
  })

  it('filters by status and title', async () => {
    setup()
    await screen.findByText('Alpha')
    fireEvent.click(screen.getByRole('button', { name: 'Terbit 1' }))
    expect(screen.queryByText('Beta')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Draf 1' }))
    expect(screen.queryByText('Alpha')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Semua 2' }))
    fireEvent.change(screen.getByLabelText('Cari tulisan'), { target: { value: 'ALP' } })
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.queryByText('Beta')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Cari tulisan'), { target: { value: 'zzz' } })
    expect(screen.getByText('Tidak ada tulisan yang cocok.')).toBeInTheDocument()
  })

  it('shows an empty workspace with a call to action', async () => {
    api.getMyPosts.mockResolvedValue([])
    api.getPostStats.mockResolvedValue({ total: 0, published: 0, draft: 0 })
    setup()
    fireEvent.click(await screen.findByRole('button', { name: 'Tulis artikel pertama' }))
    expect(await screen.findByRole('dialog', { name: 'Tulis artikel baru' })).toBeInTheDocument()
  })

  it('recovers from a failed load', async () => {
    api.getMyPosts.mockRejectedValueOnce(new Error('Server sibuk'))
    setup()
    expect(await screen.findByRole('alert')).toHaveTextContent('Server sibuk')
    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))
    expect(await screen.findByText('Alpha')).toBeInTheDocument()
  })

  it('toggles publish status with feedback', async () => {
    setup()
    await screen.findByText('Beta')

    api.togglePublish.mockResolvedValueOnce({ ...beta(), is_published: true })
    fireEvent.click(within(row('Beta')).getByRole('switch'))
    await waitFor(() => expect(within(row('Beta')).getByRole('switch')).toHaveAttribute('aria-checked', 'true'))
    expect(lastToast().title).toBe('Artikel diterbitkan')
    expect(api.getPostStats).toHaveBeenCalledTimes(2)

    api.togglePublish.mockResolvedValueOnce({ ...alpha(), is_published: false })
    api.getPostStats.mockRejectedValueOnce(new Error('offline'))
    fireEvent.click(within(row('Alpha')).getByRole('switch'))
    await waitFor(() => expect(lastToast().title).toBe('Artikel dikembalikan ke draf'))

    api.togglePublish.mockRejectedValueOnce(new Error('post not found'))
    fireEvent.click(within(row('Alpha')).getByRole('switch'))
    await waitFor(() => expect(lastToast()).toMatchObject({ icon: 'error', text: 'post not found' }))
    expect(within(row('Alpha')).getByRole('switch')).not.toBeDisabled()
  })

  it('offers kebab actions: view (published only), edit, and delete', async () => {
    const { navigate } = setup()
    await screen.findByText('Alpha')

    fireEvent.click(screen.getByRole('button', { name: 'Aksi untuk “Beta”' }))
    expect(screen.queryByRole('menuitem', { name: 'Lihat di blog' })).not.toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })

    fireEvent.click(screen.getByRole('button', { name: 'Aksi untuk “Alpha”' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Lihat di blog' }))
    expect(navigate).toHaveBeenCalledWith('/posts/alpha')

    api.updatePost.mockResolvedValueOnce(alpha())
    fireEvent.click(screen.getByRole('button', { name: 'Aksi untuk “Alpha”' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Ubah' }))
    expect(await screen.findByRole('dialog', { name: 'Ubah artikel' })).toBeInTheDocument()
    await screen.findByTestId('markdown-editor')
    fireEvent.click(screen.getByRole('button', { name: 'Simpan & terbitkan' }))
    await waitFor(() => expect(api.updatePost).toHaveBeenCalledWith(1, expect.objectContaining({ title: 'Alpha' })))
    await waitFor(() => expect(lastToast().title).toBe('Perubahan artikel disimpan'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('deletes after confirmation and reports failures', async () => {
    setup()
    await screen.findByText('Alpha')
    const remove = () => {
      fireEvent.click(screen.getByRole('button', { name: 'Aksi untuk “Beta”' }))
      fireEvent.click(screen.getByRole('menuitem', { name: 'Hapus' }))
    }

    Swal.fire.mockResolvedValueOnce({ isConfirmed: false })
    remove()
    await waitFor(() => expect(Swal.fire).toHaveBeenCalledWith(expect.objectContaining({ title: 'Hapus artikel?' })))
    expect(api.deletePost).not.toHaveBeenCalled()

    api.deletePost.mockResolvedValueOnce()
    remove()
    await waitFor(() => expect(api.deletePost).toHaveBeenCalledWith(2))
    await waitFor(() => expect(lastToast().title).toBe('Artikel dihapus'))

    api.deletePost.mockRejectedValueOnce(new Error('gagal hapus'))
    remove()
    await waitFor(() => expect(lastToast()).toMatchObject({ icon: 'error', text: 'gagal hapus' }))
  })

  it('creates drafts and published articles from the editor modal', async () => {
    setup()
    await screen.findByText('Alpha')
    api.createPost.mockResolvedValue(alpha())

    const write = async (publish) => {
      fireEvent.click(screen.getByRole('button', { name: 'Tulis artikel' }))
      await screen.findByTestId('markdown-editor')
      fireEvent.change(screen.getByLabelText('Judul'), { target: { value: 'Baru' } })
      act(() => FakeEditor.instances.at(-1).type('isi baru'))
      if (publish) fireEvent.click(screen.getByLabelText(/Terbitkan sekarang/))
      fireEvent.click(screen.getByRole('button', { name: publish ? 'Simpan & terbitkan' : 'Simpan draf' }))
    }

    await write(false)
    await waitFor(() => expect(lastToast().title).toBe('Draf tersimpan'))
    await write(true)
    await waitFor(() => expect(lastToast().title).toBe('Artikel diterbitkan'))
    expect(api.createPost).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'Baru', content: 'isi baru', is_published: true }))

    fireEvent.click(screen.getByRole('button', { name: 'Tulis artikel' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Batal' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('moves an AI draft into the editor', async () => {
    setup()
    await screen.findByText('Alpha')
    api.generatePost.mockResolvedValue({
      title: 'Draf AI',
      category: 'Opini',
      excerpt: 'Ringkas',
      content: 'Isi AI',
      reading_time: 1,
      search_sources: [],
      generator: 'openai',
    })

    fireEvent.click(screen.getByRole('button', { name: 'AI Generator' }))
    fireEvent.click(screen.getByRole('button', { name: 'Batal' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'AI Generator' }))
    fireEvent.change(screen.getByLabelText('Topik artikel'), { target: { value: 'opini' } })
    fireEvent.click(screen.getByRole('button', { name: /Buat draf/ }))
    const useDraftButton = screen.getByRole('button', { name: 'Gunakan draf' })
    await waitFor(() => expect(useDraftButton).not.toBeDisabled())
    fireEvent.click(useDraftButton)

    expect(await screen.findByRole('dialog', { name: 'Tulis artikel baru' })).toBeInTheDocument()
    expect(screen.getByLabelText('Judul')).toHaveValue('Draf AI')
    expect(screen.getByLabelText('Kategori')).toHaveValue('Opini')
  })
})
