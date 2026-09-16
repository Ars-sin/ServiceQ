import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Pagination({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  className,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))

  if (totalItems === 0) return null

  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems)
  const endItem = Math.min(currentPage * pageSize, totalItems)

  // Generate visible page numbers
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages]
    }

    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages]
  }

  const pages = getPageNumbers()

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100 px-1',
        className
      )}
    >
      {/* Item range count */}
      <div className="text-xs text-gray-500 font-medium order-2 sm:order-1">
        Showing <span className="font-semibold text-gray-800">{startItem}</span> to{' '}
        <span className="font-semibold text-gray-800">{endItem}</span> of{' '}
        <span className="font-semibold text-gray-800">{totalItems}</span> results
      </div>

      {/* Page Navigation Buttons */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        {/* Previous */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium flex items-center gap-1"
          aria-label="Previous page"
        >
          <ChevronLeft size={15} />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Numeric page pills */}
        <div className="flex items-center gap-1">
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-xs text-gray-400 font-bold select-none"
                >
                  ...
                </span>
              )
            }

            const isActive = p === currentPage
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={cn(
                  'min-w-[32px] h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center px-2',
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                {p}
              </button>
            )
          })}
        </div>

        {/* Next */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-medium flex items-center gap-1"
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  )
}
