// Utilitas umum: format tanggal, estimasi waktu baca, meta halaman, dan dialog SweetAlert2.

export const SITE_NAME = 'Delcom Blog'
export const DEFAULT_TITLE = 'Delcom Blog — Tulisan yang layak dibaca pelan-pelan'
export const DEFAULT_DESCRIPTION =
  'Delcom Blog: kumpulan artikel teknologi, pendidikan, gaya hidup, bisnis, dan opini dari para penulis Delcom. Baca gratis, tulis dengan editor Markdown dan asisten AI.'

const shortDate = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
const longDate = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export function formatDate(value, style = 'short') {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return (style === 'long' ? longDate : shortDate).format(date)
}

export function countWords(text = '') {
  return text.split(/\s+/).filter(Boolean).length
}

export function readingTime(text = '') {
  return Math.max(1, Math.ceil(countWords(text) / 200))
}

export function initials(name = '') {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
  return (letters || '?').toUpperCase()
}

export function setPageMeta(title = '', description = DEFAULT_DESCRIPTION) {
  document.title = title ? `${title} — ${SITE_NAME}` : DEFAULT_TITLE
  const meta = document.querySelector('meta[name="description"]')
  if (meta) meta.setAttribute('content', description || DEFAULT_DESCRIPTION)
}

async function loadSwal() {
  const mod = await import('sweetalert2')
  return mod.default
}

const buttonClasses = {
  confirmButton: 'btn btn-primary',
  cancelButton: 'btn btn-ghost',
}

export async function showSuccessAlert(message) {
  const Swal = await loadSwal()
  return Swal.fire({
    toast: true,
    position: 'bottom-end',
    icon: 'success',
    title: message,
    showConfirmButton: false,
    timer: 2600,
    timerProgressBar: true,
  })
}

export async function showErrorAlert(message, title = 'Terjadi kendala') {
  const Swal = await loadSwal()
  return Swal.fire({
    icon: 'error',
    title,
    text: message,
    confirmButtonText: 'Mengerti',
    buttonsStyling: false,
    customClass: buttonClasses,
  })
}

export async function showConfirmDialog({ title, text, confirmText = 'Ya, lanjutkan', danger = false }) {
  const Swal = await loadSwal()
  const result = await Swal.fire({
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: 'Batal',
    reverseButtons: true,
    focusCancel: true,
    buttonsStyling: false,
    customClass: { ...buttonClasses, confirmButton: danger ? 'btn btn-danger' : 'btn btn-primary' },
  })
  return Boolean(result.isConfirmed)
}

// Menangani klik tautan internal agar navigasi SPA tidak me-reload halaman,
// tetapi tetap menghormati ctrl/cmd/shift-klik dan klik tengah.
export function linkHandler(navigate, to) {
  return (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return
    }
    event.preventDefault()
    navigate(to)
  }
}
