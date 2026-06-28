"use client";

import { HTMLAttributes, forwardRef } from "react";

export interface TableSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  rows?: number;
  columns?: number;
  variant?: "table" | "cards" | "stats";
}



export const TableSkeleton = forwardRef<HTMLDivElement, TableSkeletonProps>(
  ({ rows = 5, columns = 4, variant = "table", className = "", ...props }, ref) => {
    if (variant === "stats") {
      return (
        <div ref={ref} className={`flex flex-col gap-8 ${className}`} {...props}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className="relative h-32 bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-zinc-800 shadow-sm overflow-hidden"
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent" />
                <div className="p-6">
                  <div className="h-3 w-20 bg-gray-100 dark:bg-zinc-800 rounded mb-4" />
                  <div className="h-8 w-24 bg-gray-100 dark:bg-zinc-800 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
          <div className="relative h-20 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent" />
          </div>
        </div>
      );
    }

    if (variant === "cards") {
      return (
        <div ref={ref} className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`} {...props}>
          {[...Array(rows)].map((_, i) => (
            <div 
              key={i} 
              className="relative bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-6 shadow-sm overflow-hidden"
            >
              {/* Emerald shimmer */}
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent" />
              
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className="w-12 h-12 bg-gray-100 dark:bg-zinc-800 rounded-xl" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 dark:bg-zinc-800 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-50 dark:bg-zinc-900 rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2 relative z-10">
                <div className="h-3 bg-gray-50 dark:bg-zinc-900 rounded" />
                <div className="h-3 bg-gray-50 dark:bg-zinc-900 rounded w-5/6" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Table variant
    return (
      <div 
        ref={ref} 
        className={`
          bg-white dark:bg-zinc-900 rounded-[2rem] border border-gray-100 dark:border-zinc-800 
          overflow-hidden shadow-sm 
          ${className}
        `} 
        {...props}
      >
        {/* Header with emerald gradient */}
        <div className="relative h-16 bg-gradient-to-r from-gray-50/80 via-white to-gray-50/80 dark:from-zinc-900/80 dark:via-zinc-900 dark:to-zinc-900/80 border-b border-gray-100 dark:border-zinc-800 px-8 flex items-center gap-8 overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent" />
          {[...Array(columns)].map((_, i) => (
            <div 
              key={i} 
              className={`h-3 bg-gray-200 dark:bg-zinc-800 rounded ${i === 0 ? "w-1/4" : "w-20"} relative z-10`} 
            />
          ))}
        </div>
        
        {/* Rows with alternating shimmer */}
        {[...Array(rows)].map((_, rowIndex) => (
          <div 
            key={rowIndex} 
            className={`
              relative flex items-center justify-between px-8 py-6 
              border-b border-gray-50 dark:border-zinc-800/50 
              last:border-0
              ${rowIndex % 2 === 0 ? "bg-white dark:bg-zinc-900" : "bg-gray-50/30 dark:bg-zinc-900/30"}
            `}
          >
            {/* Row shimmer */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent" />
            
            <div className="h-4 bg-gray-100 dark:bg-zinc-800 rounded w-1/3 relative z-10" />
            <div className="h-6 bg-gray-50 dark:bg-zinc-900 rounded-xl w-24 relative z-10" />
            <div className="h-8 bg-gray-100 dark:bg-zinc-800 rounded-xl w-28 relative z-10" />
          </div>
        ))}
      </div>
    );
  }
);

TableSkeleton.displayName = "TableSkeleton";

export const TableRowSkeleton = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => (
    <div 
      ref={ref} 
      className={`relative flex items-center gap-4 py-4 ${className}`} 
      {...props}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent" />
      {children || (
        <>
          <div className="h-4 bg-gray-100 dark:bg-zinc-800 rounded w-1/4 animate-pulse relative z-10" />
          <div className="h-4 bg-gray-50 dark:bg-zinc-900 rounded w-1/3 animate-pulse relative z-10" />
          <div className="h-6 bg-gray-100 dark:bg-zinc-800 rounded w-20 animate-pulse ml-auto relative z-10" />
        </>
      )}
    </div>
  )
);

TableRowSkeleton.displayName = "TableRowSkeleton";

export default TableSkeleton;