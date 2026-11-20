import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import KebabMenu from './KebabMenu'

function setup() {
  const onEdit = vi.fn()
  const onDelete = vi.fn()
  render(
    <>
      <p>Di luar</p>
      <KebabMenu
        label="Aksi artikel"
        items={[
          { label: 'Ubah', icon: <span>e</span>, onSelect: onEdit },
          { label: 'Hapus', danger: true, onSelect: onDelete },
        ]}
      />
    </>,
  )
  return { onEdit, onDelete, trigger: screen.getByRole('button', { name: 'Aksi artikel' }) }
}

describe('KebabMenu', () => {
  it('opens a menu, focuses the first item, and runs the selected action', () => {
    const { onDelete, trigger } = setup()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).not.toHaveAttribute('aria-controls')

    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(trigger).toHaveAttribute('aria-controls', screen.getByRole('menu').id)
    const items = screen.getAllByRole('menuitem')
    expect(items[0]).toHaveFocus()
    expect(items[1]).toHaveClass('menu-item-danger')

    fireEvent.click(items[1])
    expect(onDelete).toHaveBeenCalled()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('supports arrow-key navigation with wrap-around', () => {
    const { trigger } = setup()
    fireEvent.click(trigger)
    const [edit, del] = screen.getAllByRole('menuitem')
    fireEvent.keyDown(document, { key: 'ArrowDown' })
    expect(del).toHaveFocus()
    fireEvent.keyDown(document, { key: 'ArrowDown' })
    expect(edit).toHaveFocus()
    fireEvent.keyDown(document, { key: 'ArrowUp' })
    expect(del).toHaveFocus()
    fireEvent.keyDown(document, { key: 'Enter' })
    expect(del).toHaveFocus()
  })

  it('closes on Escape (returning focus) and on outside clicks only', () => {
    const { trigger } = setup()
    fireEvent.click(trigger)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()

    fireEvent.click(trigger)
    fireEvent.mouseDown(screen.getAllByRole('menuitem')[0])
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.mouseDown(screen.getByText('Di luar'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    fireEvent.click(trigger)
    fireEvent.click(trigger)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
