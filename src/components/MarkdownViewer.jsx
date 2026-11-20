import { useEffect, useRef } from 'react'
import Viewer from '@toast-ui/editor/viewer'
import '@toast-ui/editor/dist/toastui-editor-viewer.css'

// Pembungkus Toast UI Viewer untuk merender Markdown artikel (sanitasi HTML bawaan Toast UI).
export default function MarkdownViewer({ content = '', className = '' }) {
  const elRef = useRef(null)
  const viewerRef = useRef(null)

  useEffect(() => {
    viewerRef.current = new Viewer({
      el: elRef.current,
      initialValue: content,
      usageStatistics: false,
      linkAttributes: { target: '_blank', rel: 'noopener noreferrer' },
    })
    return () => {
      viewerRef.current.destroy()
      viewerRef.current = null
    }
    // Instance dibuat sekali; perubahan konten ditangani efek di bawah.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    viewerRef.current.setMarkdown(content)
  }, [content])

  return (
    <div className={`prose-delcom ${className}`.trim()} data-testid="markdown-viewer">
      <div ref={elRef} />
    </div>
  )
}
