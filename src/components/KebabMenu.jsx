import { useEffect, useId, useRef, useState } from 'react'
import { IconDotsVertical } from '@tabler/icons-react'

// Menu aksi vertikal (⋮) dengan navigasi keyboard: panah atas/bawah, Escape, klik di luar.
export default function KebabMenu({ label, items }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return undefined
    const root = rootRef.current
    const menuItems = () => [...root.querySelectorAll('[role="menuitem"]')]

    const onPointerDown = (event) => {
      if (!root.contains(event.target)) setOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current.focus()
        return
      }
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
      event.preventDefault()
      const list = menuItems()
      const index = list.indexOf(document.activeElement)
      const step = event.key === 'ArrowDown' ? 1 : -1
      list[(index + step + list.length) % list.length].focus()
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    menuItems()[0].focus()
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        className="icon-btn"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <IconDotsVertical size={18} aria-hidden="true" />
      </button>
      {open && (
        <div id={menuId} role="menu" aria-label={label} className="menu top-11">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className={`menu-item ${item.danger ? 'menu-item-danger' : ''}`}
              onClick={() => {
                setOpen(false)
                item.onSelect()
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
