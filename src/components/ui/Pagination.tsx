"use client";

import { HTMLAttributes, forwardRef } from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "./Button";

export interface PaginationProps extends HTMLAttributes<HTMLDivElement> {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPageSizeSelector?: boolean;
  pageSizeOptions?: number[];
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  compact?: boolean;
}

export const Pagination = forwardRef<HTMLDivElement, PaginationProps>(
  ({
    currentPage,
    totalPages,
    onPageChange,
    showFirstLast = true,
    showPageSizeSelector = false,
    pageSizeOptions = [10, 25, 50, 100],
    pageSize = 10,
    onPageSizeChange,
    compact = false,
    className = "",
    ...props
  }, ref) => {
    const getVisiblePages = (): (number | "...")[] => {
      if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
      }

      if (currentPage <= 3) {
        return [1, 2, 3, 4, 5, "...", totalPages];
      }

      if (currentPage >= totalPages - 2) {
        return [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
      }

      return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
    };

    if (compact) {
      return (
        <div ref={ref} className={`flex items-center justify-between gap-4 ${className}`} {...props}>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="w-8 h-8 p-0 hover:text-emerald-500"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 min-w-[60px] text-center">
              <span className="text-emerald-500">{currentPage}</span> / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="w-8 h-8 p-0 hover:text-emerald-500"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
          {showPageSizeSelector && onPageSizeChange && (
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-2 py-1.5 text-[10px] font-bold bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} / page
                </option>
              ))}
            </select>
          )}
        </div>
      );
    }

    return (
      <div ref={ref} className={`flex items-center justify-between gap-6 ${className}`} {...props}>
        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Rows
            </span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="px-3 py-2 text-[11px] font-bold bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-colors"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-1">
          {showFirstLast && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className="w-9 h-9 p-0 hover:text-emerald-500"
              aria-label="First page"
            >
              <ChevronsLeft size={16} />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-9 h-9 p-0 hover:text-emerald-500"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </Button>

          <div className="flex items-center gap-1 mx-2">
            {getVisiblePages().map((page, index) =>
              page === "..." ? (
                <span
                  key={`ellipsis-${index}`}
                  className="w-9 h-9 flex items-center justify-center text-[11px] font-medium text-gray-300 dark:text-gray-600"
                >
                  •••
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`
                    w-9 h-9 rounded-lg text-[11px] font-bold transition-all duration-150
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2
                    ${currentPage === page
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 hover:text-emerald-500 active:scale-95"
                    }
                  `}
                  aria-label={`Page ${page}`}
                  aria-current={currentPage === page ? "page" : undefined}
                >
                  {page}
                </button>
              )
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="w-9 h-9 p-0 hover:text-emerald-500"
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </Button>

          {showFirstLast && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="w-9 h-9 p-0 hover:text-emerald-500"
              aria-label="Last page"
            >
              <ChevronsRight size={16} />
            </Button>
          )}
        </div>
      </div>
    );
  }
);

Pagination.displayName = "Pagination";