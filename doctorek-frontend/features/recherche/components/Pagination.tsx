import { ChevronIcon } from './icons'

interface PaginationProps {
  page: number
  totalPages: number
  onPage: (p: number) => void
}

export function Pagination({ page, totalPages, onPage }: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages)
  const safePage = Math.min(Math.max(1, page), safeTotalPages)

  const pages: (number | '…')[] = []
  if (safeTotalPages <= 7) {
    for (let i = 1; i <= safeTotalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (safePage > 3) pages.push('…')
    for (let i = Math.max(2, safePage - 1); i <= Math.min(safeTotalPages - 1, safePage + 1); i++) pages.push(i)
    if (safePage < safeTotalPages - 2) pages.push('…')
    pages.push(safeTotalPages)
  }

  return (
    <nav className="flex flex-wrap items-center justify-center gap-1.5 py-7" aria-label="Pagination des médecins">
      <button
        type="button"
        onClick={() => onPage(safePage - 1)}
        disabled={safePage === 1}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#DCE5EE] bg-white text-[#607080] shadow-sm transition-colors hover:border-[#9CCEFF] hover:text-[#007DFF] disabled:cursor-not-allowed disabled:opacity-35"
        aria-label="Page précédente"
      >
        <ChevronIcon direction="left" />
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className="flex h-9 w-9 items-center justify-center text-sm text-zinc-400">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPage(p)}
            aria-current={p === safePage ? 'page' : undefined}
            aria-label={`Page ${p}`}
            className={`flex h-10 min-w-10 items-center justify-center rounded-xl border px-2 text-sm font-bold transition-colors ${
              p === safePage
                ? 'border-[#007DFF] bg-[#007DFF] text-white shadow-[0_6px_16px_rgba(0,125,255,0.24)]'
                : 'border-[#DCE5EE] bg-white text-[#465058] hover:border-[#9CCEFF] hover:text-[#007DFF]'
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPage(safePage + 1)}
        disabled={safePage === safeTotalPages}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#DCE5EE] bg-white text-[#607080] shadow-sm transition-colors hover:border-[#9CCEFF] hover:text-[#007DFF] disabled:cursor-not-allowed disabled:opacity-35"
        aria-label="Page suivante"
      >
        <ChevronIcon direction="right" />
      </button>
      <span className="ml-2 text-xs font-medium text-[#7A8795] sm:hidden">
        Page {safePage} sur {safeTotalPages}
      </span>
    </nav>
  )
}
