import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import FullScreenModal from './FullScreenModal'

function renderModal(props = {}) {
  const onClose = vi.fn()
  const utils = render(
    <>
      <button type="button">Pemicu</button>
      <FullScreenModal open onClose={onClose} title="Judul dialog" {...props}>
        <input aria-label="Isian" />
      </FullScreenModal>
    </>,
  )
  return { onClose, ...utils }
}

describe('FullScreenModal', () => {
  it('renders nothing when closed', () => {
    render(<FullScreenModal open={false} onClose={() => {}} title="X" />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders an accessible full-size dialog with header, body, and footer', () => {
    renderModal({ eyebrow: 'Ruang kerja', subtitle: 'Sub judul', footer: <button type="button">Simpan</button> })
    const dialog = screen.getByRole('dialog', { name: 'Judul dialog' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog.className).toContain('max-w-[96vw]')
    expect(screen.getByText('Ruang kerja')).toBeInTheDocument()
    expect(screen.getByText('Sub judul')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Simpan' })).toBeInTheDocument()
    expect(document.body.style.overflow).toBe('hidden')
    expect(screen.getByRole('button', { name: 'Tutup dialog' })).toHaveFocus()
  })

  it('supports the small size without optional slots and focuses [data-autofocus]', () => {
    render(
      <FullScreenModal open onClose={() => {}} title="Kecil" size="sm">
        <input aria-label="Biasa" />
        <input aria-label="Fokus" data-autofocus />
      </FullScreenModal>,
    )
    expect(screen.getByRole('dialog').className).toContain('max-w-lg')
    expect(screen.getByLabelText('Fokus')).toHaveFocus()
  })

  it('closes with Escape, the close button, and the backdrop', () => {
    const { onClose, container } = renderModal()
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.click(screen.getByRole('button', { name: 'Tutup dialog' }))
    fireEvent.click(container.ownerDocument.querySelector('[aria-hidden="true"].absolute'))
    expect(onClose).toHaveBeenCalledTimes(3)
  })

  it('traps focus with Tab and Shift+Tab and ignores other keys', () => {
    renderModal({ footer: <button type="button">Terakhir</button> })
    const first = screen.getByRole('button', { name: 'Tutup dialog' })
    const middle = screen.getByLabelText('Isian')
    const last = screen.getByRole('button', { name: 'Terakhir' })

    last.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(first).toHaveFocus()

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(last).toHaveFocus()

    middle.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    fireEvent.keyDown(document, { key: 'a' })
    expect(middle).toHaveFocus()
  })

  it('restores focus and scrolling when closed', () => {
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()
    const { rerender } = render(<FullScreenModal open onClose={() => {}} title="X" />)
    rerender(<FullScreenModal open={false} onClose={() => {}} title="X" />)
    expect(trigger).toHaveFocus()
    expect(document.body.style.overflow).toBe('')
    trigger.remove()
  })
})
