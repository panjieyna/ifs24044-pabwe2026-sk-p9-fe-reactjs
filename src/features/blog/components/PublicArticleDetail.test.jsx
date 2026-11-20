import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import Swal from 'sweetalert2'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { deferred, makePost } from '../../../test/fixtures'
import { getPublicPost, getPublicPosts } from '../api/blogApi'
import PublicArticleDetail from './PublicArticleDetail'

vi.mock('../api/blogApi', () => ({ getPublicPost: vi.fn(), getPublicPosts: vi.fn() }))

describe('PublicArticleDetail', () => {
  beforeEach(() => {
    getPublicPost.mockReset()
    getPublicPosts.mockReset()
    Swal.fire.mockClear()
  })

  afterEach(() => {
    delete navigator.clipboard
  })

  it('renders the full article with meta rail, markdown, cover, and related posts', async () => {
    const post = makePost({ title: 'Belajar Gin', slug: 'belajar-gin', content: 'satu dua tiga', cover_image_path: 'https://img.test/a.jpg', category: 'Teknologi' })
    getPublicPost.mockResolvedValue(post)
    getPublicPosts.mockResolvedValue([post, makePost({ title: 'Lain', category: 'Teknologi' })])
    const navigate = vi.fn()
    render(<PublicArticleDetail slug="belajar-gin" navigate={navigate} />)

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 1, name: 'Belajar Gin' })).toBeInTheDocument()
    expect(document.title).toBe('Belajar Gin — Delcom Blog')
    expect(screen.getByText(post.excerpt)).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Informasi artikel' })).toHaveTextContent('3 kata')
    expect(document.querySelector('figure img')).toHaveAttribute('src', 'https://img.test/a.jpg')
    expect(await screen.findByTestId('markdown-viewer')).toHaveTextContent('satu dua tiga')

    const related = await screen.findByRole('link', { name: 'Lain' })
    fireEvent.click(related)
    fireEvent.click(screen.getByRole('link', { name: 'Semua artikel' }))
    expect(navigate.mock.calls.map((c) => c[0])).toEqual([expect.stringMatching(/^\/posts\//), '/'])
    expect(getPublicPost).toHaveBeenCalledWith('belajar-gin')
  })

  it('omits optional parts and survives a failed related-posts request', async () => {
    getPublicPost.mockResolvedValue(makePost({ title: 'Tanpa sampul', excerpt: '' }))
    getPublicPosts.mockRejectedValue(new Error('offline'))
    render(<PublicArticleDetail slug="x" navigate={() => {}} />)
    expect(await screen.findByRole('heading', { level: 1, name: 'Tanpa sampul' })).toBeInTheDocument()
    expect(document.querySelector('figure')).toBeNull()
    await waitFor(() => expect(getPublicPosts).toHaveBeenCalled())
    expect(screen.queryByRole('heading', { name: 'Bacaan berikutnya' })).not.toBeInTheDocument()
  })

  it('copies the article link, reporting failures', async () => {
    getPublicPost.mockResolvedValue(makePost())
    getPublicPosts.mockResolvedValue([])
    render(<PublicArticleDetail slug="x" navigate={() => {}} />)
    const button = await screen.findByRole('button', { name: 'Salin tautan' })

    fireEvent.click(button)
    await waitFor(() => expect(Swal.fire).toHaveBeenLastCalledWith(expect.objectContaining({ icon: 'error' })))

    const writeText = vi.fn(() => Promise.resolve())
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    fireEvent.click(button)
    await waitFor(() => expect(Swal.fire).toHaveBeenLastCalledWith(expect.objectContaining({ icon: 'success' })))
    expect(writeText).toHaveBeenCalledWith(window.location.href)
  })

  it('shows a 404 state and a generic error state', async () => {
    getPublicPost.mockRejectedValueOnce(Object.assign(new Error('post not found'), { status: 404 }))
    const { unmount } = render(<PublicArticleDetail slug="hilang" navigate={() => {}} />)
    expect(await screen.findByRole('heading', { level: 1, name: 'Artikel tidak ditemukan.' })).toBeInTheDocument()
    expect(document.title).toBe('Artikel tidak ditemukan — Delcom Blog')
    unmount()

    getPublicPost.mockRejectedValueOnce(Object.assign(new Error('boom'), { status: 500 }))
    render(<PublicArticleDetail slug="rusak" navigate={() => {}} />)
    expect(await screen.findByRole('heading', { level: 1, name: 'Artikel belum bisa dimuat.' })).toBeInTheDocument()
  })

  it('ignores late responses after unmount', async () => {
    const post = deferred()
    getPublicPost.mockReturnValueOnce(post.promise)
    const first = render(<PublicArticleDetail slug="a" navigate={() => {}} />)
    first.unmount()
    post.resolve(makePost())

    const failing = deferred()
    getPublicPost.mockReturnValueOnce(failing.promise)
    const second = render(<PublicArticleDetail slug="b" navigate={() => {}} />)
    second.unmount()
    failing.reject(new Error('late'))

    const related = deferred()
    getPublicPost.mockResolvedValueOnce(makePost({ title: 'Cepat' }))
    getPublicPosts.mockReturnValueOnce(related.promise)
    const third = render(<PublicArticleDetail slug="c" navigate={() => {}} />)
    await screen.findByRole('heading', { level: 1, name: 'Cepat' })
    third.unmount()
    related.resolve([makePost()])
    await Promise.resolve()
    expect(getPublicPost).toHaveBeenCalledTimes(3)
  })
})
