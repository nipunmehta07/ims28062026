"use client";

import { HTMLAttributes, forwardRef, TableHTMLAttributes, ThHTMLAttributes, TdHTMLAttributes } from "react";

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  minWidth?: string;
  variant?: "default" | "clean" | "bordered";
}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ minWidth = "min-w-[900px]", variant = "default", className = "", children, ...props }, ref) => (
    <div className={`overflow-x-auto ${variant === "bordered" ? "border border-gray-200 dark:border-zinc-700 rounded-xl" : ""}`}>
      <table
        ref={ref}
        className={`w-full text-left ${minWidth} ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  )
);
Table.displayName = "Table";

export const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement> & { sticky?: boolean }>(
  ({ sticky, className = "", children, ...props }, ref) => {
    // Clone children to apply gradient header styling to TableHead cells
    const processedChildren = Array.isArray(children)
      ? children.map((child: React.ReactNode) => {
          if (child && typeof child === 'object' && 'props' in child) {
            const childElement = child as React.ReactElement<{ className?: string }>;
            const childClassName = childElement.props.className || "";
            return React.cloneElement(childElement, {
              className: `${childClassName} bg-gradient-to-b from-gray-50 to-transparent dark:from-zinc-800 dark:to-transparent`.trim()
            });
          }
          return child;
        })
      : children;

    return (
      <thead 
        ref={ref} 
        className={`
          border-b border-gray-100 dark:border-zinc-800 
          ${sticky ? "sticky top-0 z-10" : ""}
          ${className}
        `} 
        {...props}
      >
        {processedChildren}
      </thead>
    );
  }
);
TableHeader.displayName = "TableHeader";

export const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = "", children, ...props }, ref) => (
    <tbody ref={ref} className={`divide-y divide-gray-100 dark:divide-zinc-800 ${className}`} {...props}>
      {children}
    </tbody>
  )
);
TableBody.displayName = "TableBody";

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  selected?: boolean;
  hover?: boolean;
  variant?: "default" | "ghost";
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ selected, hover = true, variant = "default", className = "", children, ...props }, ref) => (
    <tr
      ref={ref}
      className={`
        transition-all duration-150
        ${selected ? "bg-emerald-50/50 dark:bg-emerald-950/30" : ""}
        ${hover ? `hover:bg-gray-50/70 dark:hover:bg-zinc-900/70 ${variant === "ghost" ? "hover:shadow-sm" : ""}` : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </tr>
  )
);
TableRow.displayName = "TableRow";

export interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "center" | "right";
  width?: string;
  sticky?: boolean;
}

export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ align = "left", width, sticky, className = "", children, ...props }, ref) => (
    <th
      ref={ref}
      scope="col"
      className={`
        px-4 py-5 text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider
        ${align === "center" ? "text-center" : align === "right" ? "text-right" : ""}
        ${sticky ? "sticky left-0 z-20 bg-inherit" : ""}
        ${className}
      `}
      style={{ width }}
      {...props}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {/* Emerald accent line */}
        <span className="w-4 h-0.5 bg-gradient-to-r from-emerald-500 to-transparent rounded-full opacity-60" />
      </span>
    </th>
  )
);
TableHead.displayName = "TableHead";

export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  align?: "left" | "center" | "right";
  sticky?: boolean;
}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ align = "left", sticky, className = "", children, ...props }, ref) => (
    <td
      ref={ref}
      className={`
        px-4 py-4 text-[12px] font-medium text-gray-900 dark:text-gray-100
        ${align === "center" ? "text-center" : align === "right" ? "text-right" : ""}
        ${sticky ? "sticky left-0 z-10 bg-white dark:bg-zinc-900 shadow-[2px_0_8px_-2px_rgba(0,0,0,0.1)] dark:shadow-[2px_0_8px_-2px_rgba(0,0,0,0.3)]" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </td>
  )
);
TableCell.displayName = "TableCell";

export const TableFooter = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className = "", children, ...props }, ref) => (
    <tfoot 
      ref={ref} 
      className={`
        bg-gradient-to-r from-gray-50/50 via-white to-gray-50/50 dark:from-zinc-900/50 dark:via-zinc-900 dark:to-zinc-900/50 
        border-t border-gray-100 dark:border-zinc-800 
        ${className}
      `} 
      {...props}
    >
      {children}
    </tfoot>
  )
);
TableFooter.displayName = "TableFooter";

export interface TableEmptyProps {
  colSpan?: number;
  message?: string;
  icon?: React.ReactNode;
}

export const TableEmpty = forwardRef<HTMLTableCellElement, TableEmptyProps>(
  ({ colSpan = 1, message = "No data available", icon, ...props }, ref) => (
    <td
      ref={ref}
      colSpan={colSpan}
      className="px-4 py-16 text-center"
      {...props}
    >
      <div className="flex flex-col items-center gap-3">
        {/* Empty state illustration */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center">
          {icon || (
            <svg className="w-8 h-8 text-gray-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          )}
        </div>
        <p className="text-[11px] font-medium text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
          {message}
        </p>
      </div>
    </td>
  )
);
TableEmpty.displayName = "TableEmpty";

// Need to import React for cloneElement
import React from "react";