import { useEffect, useRef } from 'react'
import Editor from '@toast-ui/editor'
import '@toast-ui/editor/dist/toastui-editor.css'
import '@toast-ui/editor/dist/theme/toastui-editor-dark.css'

// Toast UI memakai atribut non-standar `aria-role`; ubah ke `role` yang valid dan beri label
// pada textarea clipboard tersembunyi agar lolos pemeriksaan aksesibilitas (axe).
export function patchAccessibility(root) {
  root.querySelectorAll('[aria-role]').forEach((el) => {
    el.setAttribute('role', el.getAttribute('aria-role'))
    el.removeAttribute('aria-role')
  })
  root.querySelectorAll('.toastui-editor-tabs').forEach((el) => el.setAttribute('role', 'tablist'))
  root.querySelectorAll('.toastui-editor-popup:not([aria-label])').forEach((el) => el.setAttribute('aria-label', 'Pilihan format'))
  root.querySelectorAll('.toastui-editor-pseudo-clipboard').forEach((el) => {
    el.setAttribute('aria-label', 'Papan klip editor')
    el.setAttribute('tabindex', '-1')
  })
}

// Pembungkus Toast UI Editor: mode Markdown dengan tab pratinjau dan dukungan tema gelap.
export default function MarkdownEditor({
  value = '',
  onChange,
  height = '520px',
  label = 'Isi artikel',
  placeholder = 'Tulis isi artikel dalam Markdown…',
}) {
  const elRef = useRef(null)
  const editorRef = useRef(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    const editor = new Editor({
      el: elRef.current,
      height,
      initialEditType: 'markdown',
      previewStyle: 'tab',
      initialValue: value,
      placeholder,
      usageStatistics: false,
      autofocus: false,
      theme: isDark ? 'dark' : 'light',
      events: {
        change: () => onChangeRef.current(editor.getMarkdown()),
      },
    })
    editorRef.current = editor

    const root = elRef.current
    patchAccessibility(root)
    const observer = new MutationObserver(() => patchAccessibility(root))
    observer.observe(root, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      editor.destroy()
      editorRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const editor = editorRef.current
    if (value !== editor.getMarkdown()) editor.setMarkdown(value, false)
  }, [value])

  return (
    <div
      role="group"
      aria-label={label}
      className="editor-shell overflow-hidden rounded-xl border border-line-strong bg-surface"
      data-testid="markdown-editor"
    >
      <div ref={elRef} />
    </div>
  )
}
