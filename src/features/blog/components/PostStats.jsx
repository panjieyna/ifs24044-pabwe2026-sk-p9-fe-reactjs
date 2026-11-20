const ITEMS = [
  { key: 'total', label: 'Total artikel', note: 'Semua tulisanmu' },
  { key: 'published', label: 'Terbit', note: 'Tayang di beranda publik' },
  { key: 'draft', label: 'Draf', note: 'Belum diterbitkan' },
]

// Tiga kartu ringkasan statistik penulis: Total, Terbit, Draf.
export default function PostStats({ stats, loading }) {
  const ratio = stats.total ? Math.round((stats.published / stats.total) * 100) : 0

  return (
    <section aria-label="Ringkasan statistik tulisan" className="grid border-y border-line sm:grid-cols-3">
      {ITEMS.map((item, i) => (
        <div key={item.key} className={`py-6 sm:px-8 ${i === 0 ? 'sm:pl-0' : 'border-t border-line sm:border-l sm:border-t-0'}`}>
          <p className="eyebrow">{item.label}</p>
          <p className="display mt-2 text-6xl tabular-nums" data-testid={`stat-${item.key}`}>
            {loading ? '—' : stats[item.key]}
          </p>
          <p className="meta mt-1">{item.key === 'published' && !loading ? `${ratio}% dari total tulisan` : item.note}</p>
        </div>
      ))}
    </section>
  )
}
