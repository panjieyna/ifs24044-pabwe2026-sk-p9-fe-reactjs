import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deferred, makePost, makeUser } from '../../../test/fixtures'
import { getCategories, getPublicPosts } from '../api/blogApi'
import PublicArticleList from './PublicArticleList'

vi.mock('../api/blogApi', async (importOriginal) => ({
  ...(await importOriginal()),
  getCategories: vi.fn(),
  getPublicPosts: vi.fn(),
}))

function setup(props = {}) {
  const navigate = vi.fn()
  const onStartWriting = vi.fn()
  const utils = render(<PublicArticleList navigate={navigate} user={null} onStartWriting={onStartWriting} {...props} />)
  return { navigate, onStartWriting, ...utils }
}

describe('PublicArticleList', () => {
  beforeEach(() => {
    getCategories.mockReset().mockResolvedValue(['Teknologi', 'Sains'])
    getPublicPosts.mockReset()
  })

  it('shows the featured post and a numbered list of the rest', async () => {
    const posts = [makePost({ title: 'Utama' }), makePost({ title: 'Kedua', published_at: null }), makePost({ title: 'Ketiga' })]
    getPublicPosts.mockResolvedValue(posts)
    const { navigate } = setup()

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
    expect(await screen.findByRole('heading', { level: 2, name: 'Utama' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Terbaru' }).closest('section')).toHaveClass('mt-20')
    expect(screen.getByText('02')).toBeInTheDocument()
    expect(screen.getByText('03')).toBeInTheDocument()
    expect(screen.getByText('3 artikel ditampilkan')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: 'Sains' })).toBeInTheDocument()
    expect(document.title).toBe('Delcom Blog — Tulisan yang layak dibaca pelan-pelan')

    fireEvent.click(screen.getByRole('link', { name: 'Kedua' }))
    expect(navigate).toHaveBeenCalledWith(`/posts/${posts[1].slug}`)
    expect(getPublicPosts).toHaveBeenCalledWith({ q: '', category: '' })
  })

  it('renders only the featured post when there is a single article', async () => {
    getPublicPosts.mockResolvedValue([makePost({ title: 'Satu-satunya' })])
    getCategories.mockRejectedValue(new Error('offline'))
    setup()
    expect(await screen.findByRole('heading', { level: 2, name: 'Satu-satunya' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Terbaru' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pendidikan' })).toBeInTheDocument()
  })

  it('filters by category and debounced search, then resets an empty result', async () => {
    getPublicPosts.mockResolvedValue([makePost(), makePost()])
    setup()
    await screen.findByText('Terbaru')

    getPublicPosts.mockResolvedValue([makePost({ title: 'Hasil Teknologi' })])
    const pill = screen.getByRole('button', { name: 'Teknologi' })
    fireEvent.click(pill)
    expect(pill).toHaveAttribute('aria-pressed', 'true')
    expect(await screen.findByRole('heading', { name: 'Hasil penelusuran' })).toBeInTheDocument()
    const list = screen.getByRole('heading', { name: 'Hasil penelusuran' }).closest('section')
    expect(list).not.toHaveClass('mt-20')
    expect(within(list).getByText('01')).toBeInTheDocument()

    getPublicPosts.mockResolvedValue([])
    fireEvent.change(screen.getByLabelText('Cari artikel'), { target: { value: '  zzz  ' } })
    await waitFor(() => expect(getPublicPosts).toHaveBeenLastCalledWith({ q: 'zzz', category: 'Teknologi' }))
    expect(await screen.findByText('Belum ada artikel yang cocok.')).toBeInTheDocument()

    getPublicPosts.mockResolvedValue([makePost({ title: 'Kembali' })])
    fireEvent.click(screen.getByRole('button', { name: 'Tampilkan semua artikel' }))
    expect(await screen.findByRole('heading', { level: 2, name: 'Kembali' })).toBeInTheDocument()
    expect(screen.getByLabelText('Cari artikel')).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Semua' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows an empty state without reset when nothing is published yet', async () => {
    getPublicPosts.mockResolvedValue([])
    setup()
    expect(await screen.findByText('Belum ada artikel yang cocok.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tampilkan semua artikel' })).not.toBeInTheDocument()
  })

  it('shows an error with retry', async () => {
    getPublicPosts.mockRejectedValueOnce(new Error('Server sedang sibuk')).mockResolvedValueOnce([makePost({ title: 'Pulih' })])
    setup()
    expect(await screen.findByRole('alert')).toHaveTextContent('Server sedang sibuk')
    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))
    expect(await screen.findByRole('heading', { level: 2, name: 'Pulih' })).toBeInTheDocument()
  })

  it('ignores responses that arrive after unmount', async () => {
    const ok = deferred()
    getPublicPosts.mockReturnValueOnce(ok.promise)
    const first = setup()
    first.unmount()
    ok.resolve([makePost()])

    const fail = deferred()
    getPublicPosts.mockReturnValueOnce(fail.promise)
    const second = setup()
    second.unmount()
    fail.reject(new Error('late'))
    await Promise.resolve()
    expect(getPublicPosts).toHaveBeenCalledTimes(2)
  })

  it('invites guests to write and sends signed-in users to the workspace', async () => {
    getPublicPosts.mockResolvedValue([])
    const guest = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Mulai menulis' }))
    expect(guest.onStartWriting).toHaveBeenCalled()
    guest.unmount()

    const member = setup({ user: makeUser() })
    fireEvent.click(screen.getByRole('button', { name: 'Buka ruang kerja' }))
    expect(member.navigate).toHaveBeenCalledWith('/author')
    await screen.findByText('Belum ada artikel yang cocok.')
  })
})
