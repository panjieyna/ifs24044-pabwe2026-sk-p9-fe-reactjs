import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FakeEditor, FakeViewer } from '../test/toastMock'
import MarkdownEditor, { patchAccessibility } from './MarkdownEditor'
import MarkdownViewer from './MarkdownViewer'

describe('MarkdownViewer', () => {
  beforeEach(() => {
    FakeViewer.instances.length = 0
  })

  it('renders markdown through Toast UI Viewer and updates on change', () => {
    const { rerender, unmount } = render(<MarkdownViewer content="# Halo" className="mt-4" />)
    const wrapper = screen.getByTestId('markdown-viewer')
    expect(wrapper).toHaveClass('prose-delcom', 'mt-4')

    const viewer = FakeViewer.instances[0]
    expect(viewer.options).toMatchObject({ initialValue: '# Halo', usageStatistics: false })
    expect(viewer.options.linkAttributes.rel).toBe('noopener noreferrer')

    rerender(<MarkdownViewer content="## Baru" className="mt-4" />)
    expect(viewer.markdown).toBe('## Baru')

    unmount()
    expect(viewer.destroyed).toBe(true)
  })

  it('uses empty defaults', () => {
    render(<MarkdownViewer />)
    expect(screen.getByTestId('markdown-viewer').className).toBe('prose-delcom')
    expect(FakeViewer.instances[0].markdown).toBe('')
  })
})

describe('MarkdownEditor', () => {
  beforeEach(() => {
    FakeEditor.instances.length = 0
  })

  it('creates a markdown editor, reports changes, and syncs external values', () => {
    const onChange = vi.fn()
    const { rerender, unmount } = render(<MarkdownEditor value="awal" onChange={onChange} />)
    expect(screen.getByRole('group', { name: 'Isi artikel' })).toBeInTheDocument()

    const editor = FakeEditor.instances[0]
    expect(editor.options).toMatchObject({ initialValue: 'awal', height: '520px', theme: 'light', usageStatistics: false })

    editor.type('ketikan')
    expect(onChange).toHaveBeenCalledWith('ketikan')

    const setSpy = vi.spyOn(editor, 'setMarkdown')
    rerender(<MarkdownEditor value="ketikan" onChange={onChange} />)
    expect(setSpy).not.toHaveBeenCalled()
    rerender(<MarkdownEditor value="dari luar" onChange={onChange} />)
    expect(setSpy).toHaveBeenCalledWith('dari luar', false)

    unmount()
    expect(editor.destroyed).toBe(true)
  })

  it('uses the dark theme and default value when html has the dark class', () => {
    document.documentElement.classList.add('dark')
    render(<MarkdownEditor onChange={() => {}} label="Konten" height="300px" />)
    expect(FakeEditor.instances[0].options).toMatchObject({ theme: 'dark', initialValue: '', height: '300px' })
    expect(screen.getByRole('group', { name: 'Konten' })).toBeInTheDocument()
  })

  it('patches Toast UI ARIA attributes, including nodes added later', async () => {
    render(<MarkdownEditor onChange={() => {}} />)
    const root = screen.getByTestId('markdown-editor')
    expect(root.querySelector('.tab-item')).toHaveAttribute('role', 'tab')
    expect(root.querySelector('.tab-item')).not.toHaveAttribute('aria-role')
    expect(root.querySelector('.toastui-editor-tabs')).toHaveAttribute('role', 'tablist')
    expect(root.querySelector('.toastui-editor-popup')).toHaveAttribute('aria-label', 'Pilihan format')
    expect(root.querySelector('.toastui-editor-pseudo-clipboard')).toHaveAttribute('aria-label', 'Papan klip editor')

    const menu = document.createElement('ul')
    menu.setAttribute('aria-role', 'menu')
    root.querySelector('.toastui-editor-defaultUI').appendChild(menu)
    await waitFor(() => expect(menu).toHaveAttribute('role', 'menu'))
  })

  it('patchAccessibility is safe on plain markup', () => {
    const div = document.createElement('div')
    div.innerHTML = '<p>teks</p>'
    patchAccessibility(div)
    expect(div.innerHTML).toBe('<p>teks</p>')
  })
})
