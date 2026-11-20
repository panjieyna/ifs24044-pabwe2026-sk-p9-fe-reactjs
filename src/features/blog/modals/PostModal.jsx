import { lazy, Suspense, useCallback, useEffect, useId, useState } from 'react'
import { IconLoader2 } from '@tabler/icons-react'
import FullScreenModal from '../../../components/FullScreenModal'
import { countWords, readingTime } from '../../../helpers/toolsHelper'
import { DEFAULT_CATEGORIES } from '../api/blogApi'

const MarkdownEditor = lazy(() => import('../../../components/MarkdownEditor'))

const EMPTY = { title: '', category: 'Umum', excerpt: '', content: '', cover_image_path: '', is_published: false }

// Modal layar penuh untuk menulis / mengubah artikel dengan Toast UI Editor.
export default function PostModal({ open, initial, onClose, onSubmit }) {
  const formId = useId()
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const editId = initial?.id

  useEffect(() => {
    if (!open) return
    setValues({ ...EMPTY, ...initial })
    setErrors({})
    setFormError('')
    setSaving(false)
  }, [open, initial])

  const bind = (key) => (event) => {
    const { type, checked, value } = event.target
    setValues((v) => ({ ...v, [key]: type === 'checkbox' ? checked : value }))
  }
  const setContent = useCallback((content) => setValues((v) => ({ ...v, content })), [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    const next = {}
    if (!values.title.trim()) next.title = 'Judul wajib diisi.'
    if (!values.content.trim()) next.content = 'Isi artikel tidak boleh kosong.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSaving(true)
    setFormError('')
    try {
      await onSubmit(
        {
          title: values.title.trim(),
          category: values.category,
          excerpt: values.excerpt.trim(),
          content: values.content,
          cover_image_path: values.cover_image_path.trim(),
          is_published: values.is_published,
        },
        editId,
      )
    } catch (err) {
      setFormError(err.message)
      setSaving(false)
    }
  }

  const categories = DEFAULT_CATEGORIES.includes(values.category) ? DEFAULT_CATEGORIES : [...DEFAULT_CATEGORIES, values.category]

  const footer = (
    <>
      <p className="meta mr-auto hidden sm:block">Markdown didukung penuh — gunakan tab Preview untuk melihat hasilnya.</p>
      <button type="button" className="btn btn-ghost" onClick={onClose}>
        Batal
      </button>
      <button type="submit" form={formId} className="btn btn-primary" disabled={saving}>
        {saving ? (
          <>
            <IconLoader2 size={17} className="spin" aria-hidden="true" /> Menyimpan…
          </>
        ) : values.is_published ? (
          'Simpan & terbitkan'
        ) : (
          'Simpan draf'
        )}
      </button>
    </>
  )

  return (
    <FullScreenModal
      open={open}
      onClose={onClose}
      eyebrow="Ruang kerja"
      title={editId ? 'Ubah artikel' : 'Tulis artikel baru'}
      footer={footer}
    >
      <form id={formId} onSubmit={handleSubmit} noValidate className="grid min-h-full lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="space-y-6 p-5 sm:p-7">
          <div>
            <label htmlFor="post-title" className="field-label">
              Judul
            </label>
            <input
              id="post-title"
              data-autofocus
              className="field !h-14 font-serif !text-2xl"
              value={values.title}
              onChange={bind('title')}
              maxLength={255}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={errors.title ? 'post-title-error' : undefined}
            />
            {errors.title && (
              <p id="post-title-error" className="field-error">
                {errors.title}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="post-excerpt" className="field-label">
              Ringkasan <span className="font-normal text-muted">(opsional)</span>
            </label>
            <textarea
              id="post-excerpt"
              rows={2}
              maxLength={300}
              className="field"
              value={values.excerpt}
              onChange={bind('excerpt')}
              aria-describedby="post-excerpt-hint"
            />
            <p id="post-excerpt-hint" className="field-hint">
              Kosongkan untuk ringkasan otomatis dari isi artikel.
            </p>
          </div>

          <div>
            <p className="field-label">Isi artikel</p>
            <Suspense fallback={<div className="skeleton h-[520px]" />}>
              <MarkdownEditor value={values.content} onChange={setContent} label="Isi artikel" />
            </Suspense>
            {errors.content && (
              <p className="field-error" role="alert">
                {errors.content}
              </p>
            )}
          </div>
        </div>

        <aside aria-label="Pengaturan artikel" className="space-y-6 border-t border-line bg-bg/60 p-5 sm:p-7 lg:border-l lg:border-t-0">
          <div>
            <label htmlFor="post-category" className="field-label">
              Kategori
            </label>
            <select id="post-category" className="field" value={values.category} onChange={bind('category')}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="post-cover" className="field-label">
              URL gambar sampul <span className="font-normal text-muted">(opsional)</span>
            </label>
            <input
              id="post-cover"
              type="url"
              inputMode="url"
              className="field"
              placeholder="https://…"
              value={values.cover_image_path}
              onChange={bind('cover_image_path')}
            />
            {values.cover_image_path.trim() && (
              <img
                src={values.cover_image_path.trim()}
                alt="Pratinjau gambar sampul"
                className="mt-3 aspect-video w-full rounded-lg border border-line object-cover"
              />
            )}
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-line-strong p-4">
            <input
              id="post-publish"
              type="checkbox"
              className="mt-1 h-4 w-4 accent-[var(--accent)]"
              checked={values.is_published}
              onChange={bind('is_published')}
            />
            <label htmlFor="post-publish">
              <span className="block text-sm font-semibold">Terbitkan sekarang</span>
              <span className="meta">Jika tidak dicentang, artikel disimpan sebagai draf.</span>
            </label>
          </div>

          <dl className="grid grid-cols-2 gap-4 border-t border-line pt-5">
            <div>
              <dt className="eyebrow">Kata</dt>
              <dd className="display mt-1 text-3xl tabular-nums">{countWords(values.content)}</dd>
            </div>
            <div>
              <dt className="eyebrow">Waktu baca</dt>
              <dd className="display mt-1 text-3xl tabular-nums">{readingTime(values.content)} mnt</dd>
            </div>
          </dl>

          {formError && (
            <p role="alert" className="rounded-lg border border-danger/40 px-3.5 py-2.5 text-sm text-danger">
              {formError}
            </p>
          )}
        </aside>
      </form>
    </FullScreenModal>
  )
}
