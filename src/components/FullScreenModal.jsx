import { useEffect, useId, useRef } from 'react'
import { IconX } from '@tabler/icons-react'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Dialog modal dengan header & footer berwarna kontras. size="full" memakai lebar 96vw.
export default function FullScreenModal({ open, onClose, eyebrow, title, subtitle, size = 'full', footer, children }) {
  const titleId = useId()
  const panelRef = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return undefined
    const panel = panelRef.current
    const previous = document.activeElement

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const items = [...panel.querySelectorAll(FOCUSABLE)]
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    const target = panel.querySelector('[data-autofocus]') || panel.querySelector(FOCUSABLE)
    target.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
      previous.focus()
    }
  }, [open])

  if (!open) return null

  const panelSize = size === 'full' ? 'h-[94vh] w-full max-w-[96vw]' : 'max-h-[92vh] w-full max-w-lg'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-[var(--overlay)]" aria-hidden="true" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`fade-up relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl ${panelSize}`}
      >
        <div className="flex items-start gap-4 bg-chrome px-5 py-4 text-chrome-ink sm:px-7">
          <div className="min-w-0 flex-1">
            {eyebrow && <p className="eyebrow !text-chrome-muted">{eyebrow}</p>}
            <h2 id={titleId} className="display mt-1 text-[1.75rem] leading-tight sm:text-3xl">
              {title}
            </h2>
            {subtitle && <p className="mt-1 text-sm text-chrome-muted">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-btn !text-chrome-ink hover:!bg-white/10"
            aria-label="Tutup dialog"
          >
            <IconX size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-raised px-5 py-3.5 sm:px-7">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
