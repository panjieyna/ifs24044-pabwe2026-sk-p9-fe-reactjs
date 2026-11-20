import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deferred } from '../../../test/fixtures'
import { generatePost } from '../api/blogApi'
import AiPostGeneratorModal from './AiPostGeneratorModal'

vi.mock('../api/blogApi', async (importOriginal) => ({ ...(await importOriginal()), generatePost: vi.fn() }))

const result = (overrides = {}) => ({
  title: 'Go untuk Backend',
  category: 'Teknologi',
  excerpt: 'Ringkasan draf.',
  content: '## Isi\n\nDraf lengkap.',
  reading_time: 4,
  search_sources: [
    { title: 'Go (bahasa pemrograman)', url: 'https://id.wikipedia.org/wiki/Go', snippet: 'Bahasa dari Google' },
    { title: 'Tanpa cuplikan', url: 'https://contoh.test', snippet: '' },
  ],
  used_web_search: true,
  generator: 'openai',
  ...overrides,
})

function setup(props = {}) {
  const onClose = vi.fn()
  const onUseDraft = vi.fn()
  const utils = render(<AiPostGeneratorModal open onClose={onClose} onUseDraft={onUseDraft} {...props} />)
  return { onClose, onUseDraft, ...utils }
}

const generate = () => fireEvent.click(screen.getByRole('button', { name: /Buat (draf|ulang)/ }))

describe('AiPostGeneratorModal', () => {
  beforeEach(() => {
    generatePost.mockReset()
  })

  it('starts idle and requires a topic', () => {
    setup()
    expect(screen.getByRole('dialog', { name: 'AI Blog Generator' })).toBeInTheDocument()
    expect(screen.getByText('Draf akan muncul di sini.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gunakan draf' })).toBeDisabled()
    expect(screen.getByLabelText('Topik artikel')).toHaveFocus()

    generate()
    expect(screen.getByRole('alert')).toHaveTextContent('Tuliskan topik artikel terlebih dahulu.')
    expect(generatePost).not.toHaveBeenCalled()
  })

  it('sends all options, previews the draft with sources, and applies it', async () => {
    const pending = deferred()
    generatePost.mockReturnValue(pending.promise)
    const { onUseDraft } = setup()

    fireEvent.change(screen.getByLabelText('Topik artikel'), { target: { value: '  Go untuk backend  ' } })
    fireEvent.change(screen.getByLabelText('Kategori'), { target: { value: 'Teknologi' } })
    fireEvent.change(screen.getByLabelText('Gaya bahasa'), { target: { value: 'Santai' } })
    fireEvent.change(screen.getByLabelText('Kata kunci (opsional)'), { target: { value: ' gin, gorm ' } })
    fireEvent.click(screen.getByLabelText(/Telusuri web/))
    generate()

    expect(screen.getByRole('status')).toHaveTextContent('Menelusuri sumber')
    expect(screen.getByRole('button', { name: 'Buat draf' })).toBeDisabled()
    expect(generatePost).toHaveBeenCalledWith(
      { topic: 'Go untuk backend', category: 'Teknologi', tone: 'Santai', keywords: 'gin, gorm', include_web_search: false },
      expect.any(AbortSignal),
    )

    const data = result()
    pending.resolve(data)
    expect(await screen.findByRole('heading', { level: 3, name: 'Go untuk Backend' })).toBeInTheDocument()
    expect(screen.queryByText(/Layanan AI sedang tidak tersedia/)).not.toBeInTheDocument()
    expect(screen.getByText('Teknologi · 4 menit baca')).toBeInTheDocument()
    expect(await screen.findByTestId('markdown-viewer')).toHaveTextContent('Draf lengkap.')
    expect(screen.getByRole('link', { name: /Go \(bahasa pemrograman\)/ })).toHaveAttribute('target', '_blank')
    expect(screen.getByText('Bahasa dari Google')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Buat ulang/ })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Gunakan draf' }))
    expect(onUseDraft).toHaveBeenCalledWith(data)
  })

  it('labels outline fallbacks and hides empty source lists', async () => {
    generatePost.mockResolvedValue(result({ generator: 'fallback', search_sources: [] }))
    setup()
    fireEvent.change(screen.getByLabelText('Topik artikel'), { target: { value: 'AI' } })
    generate()
    expect(await screen.findByText(/Layanan AI sedang tidak tersedia/)).toBeInTheDocument()
    expect(screen.queryByText('Sumber penelusuran')).not.toBeInTheDocument()
  })

  it('shows API errors', async () => {
    generatePost.mockRejectedValue(new Error('Too many requests, please slow down'))
    setup()
    fireEvent.change(screen.getByLabelText('Topik artikel'), { target: { value: 'AI' } })
    generate()
    expect(await screen.findByRole('alert')).toHaveTextContent('Too many requests')
  })

  it('aborts an in-flight request when closed and resets when reopened', async () => {
    const pending = deferred()
    generatePost.mockReturnValue(pending.promise)
    const { rerender, onClose } = setup()
    fireEvent.change(screen.getByLabelText('Topik artikel'), { target: { value: 'AI' } })
    generate()
    const signal = generatePost.mock.calls[0][1]

    fireEvent.click(screen.getByRole('button', { name: 'Batal' }))
    expect(onClose).toHaveBeenCalled()
    rerender(<AiPostGeneratorModal open={false} onClose={onClose} onUseDraft={() => {}} />)
    expect(signal.aborted).toBe(true)
    pending.reject(Object.assign(new Error('aborted'), { name: 'AbortError' }))
    await Promise.resolve()

    rerender(<AiPostGeneratorModal open onClose={onClose} onUseDraft={() => {}} />)
    expect(await screen.findByText('Draf akan muncul di sini.')).toBeInTheDocument()
  })

  it('closes cleanly when nothing was generated', () => {
    const { rerender } = setup()
    rerender(<AiPostGeneratorModal open={false} onClose={() => {}} onUseDraft={() => {}} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
