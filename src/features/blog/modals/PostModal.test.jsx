import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deferred, makePost } from '../../../test/fixtures'
import { FakeEditor } from '../../../test/toastMock'
import PostModal from './PostModal'

const lastEditor = () => FakeEditor.instances[FakeEditor.instances.length - 1]

async function openModal(props = {}) {
  const onClose = vi.fn()
  const onSubmit = vi.fn(() => Promise.resolve())
  const utils = render(<PostModal open initial={null} onClose={onClose} onSubmit={onSubmit} {...props} />)
  await screen.findByTestId('markdown-editor')
  return { onClose, onSubmit, ...utils }
}

describe('PostModal', () => {
  beforeEach(() => {
    FakeEditor.instances.length = 0
  })

  it('renders nothing while closed', () => {
    render(<PostModal open={false} initial={null} onClose={() => {}} onSubmit={() => {}} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('validates required title and content', async () => {
    const { onSubmit } = await openModal()
    expect(screen.getByRole('dialog', { name: 'Tulis artikel baru' })).toBeInTheDocument()
    expect(screen.getByLabelText('Kategori')).toHaveValue('Umum')

    fireEvent.click(screen.getByRole('button', { name: 'Simpan draf' }))
    expect(await screen.findByText('Judul wajib diisi.')).toBeInTheDocument()
    expect(screen.getByText('Isi artikel tidak boleh kosong.')).toBeInTheDocument()
    expect(screen.getByLabelText('Judul')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Judul')).toHaveAttribute('aria-describedby', 'post-title-error')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits a new published article with a live word count and cover preview', async () => {
    const pending = deferred()
    const onSubmit = vi.fn(() => pending.promise)
    await openModal({ onSubmit })

    fireEvent.change(screen.getByLabelText('Judul'), { target: { value: '  Judul Baru  ' } })
    fireEvent.change(screen.getByLabelText('Ringkasan (opsional)'), { target: { value: ' Ringkas ' } })
    fireEvent.change(screen.getByLabelText('Kategori'), { target: { value: 'Opini' } })
    fireEvent.change(screen.getByLabelText('URL gambar sampul (opsional)'), { target: { value: ' https://img.test/c.png ' } })
    expect(screen.getByAltText('Pratinjau gambar sampul')).toHaveAttribute('src', 'https://img.test/c.png')
    fireEvent.click(screen.getByLabelText(/Terbitkan sekarang/))
    lastEditor().type('satu dua tiga')
    expect(await screen.findByText('3')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Simpan & terbitkan' }))
    expect(await screen.findByText('Menyimpan…')).toBeInTheDocument()
    expect(onSubmit).toHaveBeenCalledWith(
      { title: 'Judul Baru', category: 'Opini', excerpt: 'Ringkas', content: 'satu dua tiga', cover_image_path: 'https://img.test/c.png', is_published: true },
      undefined,
    )
    pending.resolve()
  })

  it('edits an existing article, keeps custom categories, and shows submit errors', async () => {
    const post = makePost({ id: 42, title: 'Lama', category: 'Kuliner', content: 'isi lama', is_published: false })
    const onSubmit = vi.fn(() => Promise.reject(new Error('post not found')))
    const { onClose } = await openModal({ initial: post, onSubmit })

    expect(screen.getByRole('dialog', { name: 'Ubah artikel' })).toBeInTheDocument()
    expect(screen.getByLabelText('Judul')).toHaveValue('Lama')
    expect(screen.getByRole('option', { name: 'Kuliner' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Simpan draf' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('post not found')
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: 'Lama', content: 'isi lama' }), 42)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Simpan draf' })).not.toBeDisabled())

    fireEvent.click(screen.getByRole('button', { name: 'Batal' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('resets the form every time it opens', async () => {
    const { rerender } = await openModal({ initial: makePost({ title: 'Pertama' }) })
    rerender(<PostModal open={false} initial={null} onClose={() => {}} onSubmit={() => {}} />)
    rerender(<PostModal open initial={null} onClose={() => {}} onSubmit={() => {}} />)
    expect(await screen.findByLabelText('Judul')).toHaveValue('')
  })
})
