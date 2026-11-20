import Swal from 'sweetalert2'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  countWords,
  formatDate,
  initials,
  linkHandler,
  readingTime,
  setPageMeta,
  showConfirmDialog,
  showErrorAlert,
  showSuccessAlert,
} from './toolsHelper'

describe('toolsHelper', () => {
  afterEach(() => {
    document.head.innerHTML = ''
    Swal.fire.mockClear()
  })

  it('formats dates and guards against empty or invalid values', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate('bukan tanggal')).toBe('—')
    expect(formatDate('2026-11-18T10:00:00Z')).toMatch(/18 Nov 2026/)
    expect(formatDate('2026-11-18T10:00:00Z', 'long')).toMatch(/November 2026/)
  })

  it('counts words and estimates reading time (min. 1 minute)', () => {
    expect(countWords()).toBe(0)
    expect(countWords('  satu  dua\ntiga ')).toBe(3)
    expect(readingTime()).toBe(1)
    expect(readingTime('kata '.repeat(201))).toBe(2)
  })

  it('builds initials', () => {
    expect(initials()).toBe('?')
    expect(initials('   ')).toBe('?')
    expect(initials('budi santoso putra')).toBe('BS')
  })

  it('updates the document title and meta description', () => {
    setPageMeta('Tanpa meta')
    expect(document.title).toBe('Tanpa meta — Delcom Blog')

    document.head.innerHTML = '<meta name="description" content="x">'
    setPageMeta()
    expect(document.title).toBe(DEFAULT_TITLE)
    const meta = document.querySelector('meta[name="description"]')
    expect(meta.content).toBe(DEFAULT_DESCRIPTION)

    setPageMeta('Artikel', 'Deskripsi artikel')
    expect(meta.content).toBe('Deskripsi artikel')
    setPageMeta('Artikel', '')
    expect(meta.content).toBe(DEFAULT_DESCRIPTION)
  })

  it('shows SweetAlert2 toasts and dialogs', async () => {
    await showSuccessAlert('Tersimpan')
    expect(Swal.fire).toHaveBeenLastCalledWith(expect.objectContaining({ toast: true, icon: 'success', title: 'Tersimpan' }))

    await showErrorAlert('Gagal')
    expect(Swal.fire).toHaveBeenLastCalledWith(expect.objectContaining({ icon: 'error', title: 'Terjadi kendala', text: 'Gagal' }))
    await showErrorAlert('Gagal', 'Judul')
    expect(Swal.fire).toHaveBeenLastCalledWith(expect.objectContaining({ title: 'Judul' }))
  })

  it('resolves confirm dialogs to a boolean', async () => {
    await expect(showConfirmDialog({ title: 'Yakin?', text: 'Teks' })).resolves.toBe(true)
    expect(Swal.fire).toHaveBeenLastCalledWith(
      expect.objectContaining({ confirmButtonText: 'Ya, lanjutkan', customClass: expect.objectContaining({ confirmButton: 'btn btn-primary' }) }),
    )

    Swal.fire.mockResolvedValueOnce({ isConfirmed: false })
    await expect(showConfirmDialog({ title: 'Hapus?', text: 'x', confirmText: 'Hapus', danger: true })).resolves.toBe(false)
    expect(Swal.fire).toHaveBeenLastCalledWith(
      expect.objectContaining({ confirmButtonText: 'Hapus', customClass: expect.objectContaining({ confirmButton: 'btn btn-danger' }) }),
    )
  })

  it('handles SPA link clicks but leaves modified clicks to the browser', () => {
    const navigate = vi.fn()
    const handler = linkHandler(navigate, '/posts/a')
    const event = (overrides = {}) => ({
      defaultPrevented: false,
      button: 0,
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      preventDefault: vi.fn(),
      ...overrides,
    })

    for (const modified of [{ defaultPrevented: true }, { button: 1 }, { metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { altKey: true }]) {
      const e = event(modified)
      handler(e)
      expect(e.preventDefault).not.toHaveBeenCalled()
    }
    expect(navigate).not.toHaveBeenCalled()

    const plain = event()
    handler(plain)
    expect(plain.preventDefault).toHaveBeenCalled()
    expect(navigate).toHaveBeenCalledWith('/posts/a')
  })
})
