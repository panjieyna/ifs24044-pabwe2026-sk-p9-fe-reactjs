import { lazy, Suspense, useEffect, useId, useRef, useState } from 'react'
import { IconAlertTriangle, IconExternalLink, IconLoader2, IconSparkles } from '@tabler/icons-react'
import FullScreenModal from '../../../components/FullScreenModal'
import useInput from '../../../hooks/useInput'
import { DEFAULT_CATEGORIES, generatePost } from '../api/blogApi'

const MarkdownViewer = lazy(() => import('../../../components/MarkdownViewer'))

const TONES = ['Informatif', 'Santai', 'Formal', 'Persuasif', 'Reflektif']
const STEPS = [
  ['01', 'Telusuri', 'Mesin pencari mengumpulkan fakta dan rujukan terkini.'],
  ['02', 'Susun', 'AI menulis judul, ringkasan, dan isi Markdown bersitasi.'],
  ['03', 'Sunting', 'Terapkan ke editor, periksa fakta, lalu terbitkan.'],
]

// Modal layar penuh AI Blog Generator dengan opsi penelusuran mesin pencari.
export default function AiPostGeneratorModal({ open, onClose, onUseDraft }) {
  const formId = useId()
  const [topic, onTopic] = useInput('')
  const [category, onCategory] = useInput('')
  const [tone, onTone] = useInput(TONES[0])
  const [keywords, onKeywords] = useInput('')
  const [includeWeb, setIncludeWeb] = useState(true)
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const controllerRef = useRef(null)

  useEffect(() => {
    if (open) {
      setStatus('idle')
      setResult(null)
      setError('')
    }
    return () => controllerRef.current?.abort()
  }, [open])

  const handleGenerate = async (event) => {
    event.preventDefault()
    if (!topic.trim()) {
      setError('Tuliskan topik artikel terlebih dahulu.')
      setStatus('error')
      return
    }
    const controller = new AbortController()
    controllerRef.current = controller
    setStatus('loading')
    setError('')
    try {
      const data = await generatePost(
        { topic: topic.trim(), category, tone, keywords: keywords.trim(), include_web_search: includeWeb },
        controller.signal,
      )
      setResult(data)
      setStatus('done')
    } catch (err) {
      if (err.name === 'AbortError') return
      setError(err.message)
      setStatus('error')
    }
  }

  const loading = status === 'loading'

  const footer = (
    <>
      <button type="button" className="btn btn-ghost" onClick={onClose}>
        Batal
      </button>
      <button type="submit" form={formId} className="btn btn-ghost" disabled={loading}>
        <IconSparkles size={17} aria-hidden="true" /> {result ? 'Buat ulang' : 'Buat draf'}
      </button>
      <button type="button" className="btn btn-primary" disabled={status !== 'done'} onClick={() => onUseDraft(result)}>
        Gunakan draf
      </button>
    </>
  )

  return (
    <FullScreenModal
      open={open}
      onClose={onClose}
      eyebrow="Asisten AI · terhubung mesin pencari"
      title="AI Blog Generator"
      subtitle="Tulis topik, biarkan AI menelusuri sumber terkini dan menyusun draf yang bisa kamu sunting."
      footer={footer}
    >
      <div className="grid min-h-full lg:grid-cols-[26rem_minmax(0,1fr)]">
        <form id={formId} onSubmit={handleGenerate} noValidate className="space-y-5 border-b border-line p-5 sm:p-7 lg:border-b-0 lg:border-r">
          <div>
            <label htmlFor="ai-topic" className="field-label">
              Topik artikel
            </label>
            <textarea
              id="ai-topic"
              data-autofocus
              rows={3}
              maxLength={500}
              className="field"
              placeholder="Contoh: Dampak AI generatif terhadap cara mahasiswa belajar"
              value={topic}
              onChange={onTopic}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div>
              <label htmlFor="ai-category" className="field-label">
                Kategori
              </label>
              <select id="ai-category" className="field" value={category} onChange={onCategory}>
                <option value="">Otomatis</option>
                {DEFAULT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ai-tone" className="field-label">
                Gaya bahasa
              </label>
              <select id="ai-tone" className="field" value={tone} onChange={onTone}>
                {TONES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="ai-keywords" className="field-label">
              Kata kunci <span className="font-normal text-muted">(opsional)</span>
            </label>
            <input id="ai-keywords" className="field" placeholder="mis. etika, produktivitas" value={keywords} onChange={onKeywords} />
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-line-strong p-4">
            <input
              id="ai-web"
              type="checkbox"
              className="mt-1 h-4 w-4 accent-[var(--accent)]"
              checked={includeWeb}
              onChange={(e) => setIncludeWeb(e.target.checked)}
            />
            <label htmlFor="ai-web">
              <span className="block text-sm font-semibold">Telusuri web untuk fakta terkini</span>
              <span className="meta">Sumber dari mesin pencari ditampilkan di bawah draf agar bisa diperiksa ulang.</span>
            </label>
          </div>
        </form>

        <section aria-label="Pratinjau draf" className="p-5 sm:p-7 lg:p-10">
          {status === 'idle' && (
            <div className="mx-auto max-w-2xl py-6">
              <p className="display text-4xl text-muted sm:text-5xl">Draf akan muncul di sini.</p>
              <ol className="mt-10 grid gap-6 sm:grid-cols-3">
                {STEPS.map(([num, name, text]) => (
                  <li key={num} className="border-t border-line pt-4">
                    <p className="display text-2xl text-accent">{num}</p>
                    <p className="mt-1 font-semibold">{name}</p>
                    <p className="meta mt-1">{text}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {loading && (
            <div role="status" className="flex items-center gap-3 py-10 text-ink-2">
              <IconLoader2 size={22} className="spin text-accent" aria-hidden="true" />
              Menelusuri sumber dan menyusun draf… biasanya 10–40 detik.
            </div>
          )}

          {status === 'error' && (
            <p role="alert" className="rounded-xl border border-danger/40 px-4 py-3 text-danger">
              {error}
            </p>
          )}

          {status === 'done' && (
            <article className="fade-up mx-auto max-w-3xl">
              {result.generator === 'fallback' && (
                <p role="status" className="mb-6 flex gap-3 rounded-xl border border-warn/50 px-4 py-3 text-sm text-warn">
                  <IconAlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                  Layanan AI sedang tidak tersedia — ini kerangka otomatis berbasis hasil penelusuran. Lengkapi sebelum diterbitkan.
                </p>
              )}
              <p className="eyebrow text-accent">
                {result.category} · {result.reading_time} menit baca
              </p>
              <h3 className="display mt-3 text-4xl sm:text-5xl">{result.title}</h3>
              <p className="mt-4 text-lg text-ink-2">{result.excerpt}</p>
              <div className="mt-8 border-t border-line pt-8">
                <Suspense fallback={<div className="skeleton h-40" />}>
                  <MarkdownViewer content={result.content} />
                </Suspense>
              </div>
              {result.search_sources.length > 0 && (
                <div className="mt-10 rounded-2xl border border-line p-5">
                  <h4 className="eyebrow">Sumber penelusuran</h4>
                  <ol className="mt-3 space-y-3">
                    {result.search_sources.map((source, i) => (
                      <li key={source.url} className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-2 text-sm">
                        <span className="tabular-nums text-muted">{i + 1}.</span>
                        <div>
                          <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold underline underline-offset-4">
                            {source.title} <IconExternalLink size={14} aria-hidden="true" />
                            <span className="sr-only">(membuka tab baru)</span>
                          </a>
                          {source.snippet && <p className="meta mt-0.5">{source.snippet}</p>}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </article>
          )}
        </section>
      </div>
    </FullScreenModal>
  )
}
