"use client";

import { forwardRef, useState, useMemo, ReactNode } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Pagination,
  Button,
  Input,
  type DropdownOption,
} from "@/app/components/ui";
import {
  Search,
  Download,
  Filter,
  Columns,
  ChevronDown,
  Eye,
} from "lucide-react";

export interface DataTableColumn<T = Record<string, unknown>> {
  key: string;
  header: string;
  accessor?: keyof T | ((row: T) => ReactNode);
  sortable?: boolean;
  searchable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (value: unknown, row: T, index: number) => ReactNode;
  hidden?: boolean;
}

export interface DataTablePagination {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
}

export interface DataTableBulkAction {
  label: string;
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "danger";
  onClick: (selectedRows: unknown[]) => void;
}

export interface DataTableExportOption {
  label: string;
  format: "csv" | "xlsx" | "json";
  icon?: ReactNode;
}

export interface DataTableProps<T extends Record<string, unknown> = Record<string, unknown>>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onRowClick"> {
  columns: DataTableColumn<T>[];
  data: T[];
  pagination?: DataTablePagination;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  searchValue?: string;
  exportable?: boolean;
  exportOptions?: DataTableExportOption[];
  onExport?: (format: "csv" | "xlsx" | "json") => void;
  filterable?: boolean;
  onFilter?: () => void;
  columnVisibility?: boolean;
  columnVisibilityOptions?: { key: string; label: string }[];
  onColumnVisibilityChange?: (visibleColumns: string[]) => void;
  bulkActions?: DataTableBulkAction[];
  selectedRows?: unknown[];
  onSelectionChange?: (selectedRows: unknown[]) => void;
  onRowClick?: (row: T, index: number) => void;
  rowActions?: Array<{
    label: string;
    icon?: ReactNode;
    variant?: "ghost" | "danger";
    onClick: (row: T, index: number) => void;
  }>;
  emptyMessage?: string;
  isLoading?: boolean;
  compact?: boolean;
}

const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
  const headers = Object.keys(data[0] || {});
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((h) => JSON.stringify(row[h] ?? "")).join(",")
    ),
  ].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const exportToJSON = (data: Record<string, unknown>[], filename: string) => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Emerald gradient empty state illustration
const EmptyStateIllustration = () => (
  <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="mb-4">
    {/* Background glow */}
    <circle cx="60" cy="60" r="50" className="fill-emerald-50/50 dark:fill-emerald-950/30" />
    <circle cx="60" cy="60" r="40" className="stroke-emerald-200 dark:stroke-emerald-800" strokeWidth="1.5" strokeDasharray="3 3" />
    
    {/* Document icon with emerald accent */}
    <rect x="40" y="35" width="40" height="50" rx="5" className="fill-white dark:fill-zinc-800 stroke-emerald-300 dark:stroke-emerald-700" strokeWidth="2" />
    <line x1="48" y1="48" x2="72" y2="48" className="stroke-emerald-200 dark:stroke-emerald-800" strokeWidth="2" strokeLinecap="round" />
    <line x1="48" y1="56" x2="68" y2="56" className="stroke-emerald-100 dark:stroke-emerald-900" strokeWidth="2" strokeLinecap="round" />
    <line x1="48" y1="64" x2="60" y2="64" className="stroke-emerald-100 dark:stroke-emerald-900" strokeWidth="2" strokeLinecap="round" />
    
    {/* Emerald search circle */}
    <circle cx="78" cy="78" r="14" className="fill-white dark:fill-zinc-800 stroke-emerald-400 dark:stroke-emerald-600" strokeWidth="2" />
    <line x1="87" y1="87" x2="96" y2="96" className="stroke-emerald-400 dark:stroke-emerald-600" strokeWidth="2.5" strokeLinecap="round" />
    
    {/* Sparkle accents */}
    <circle cx="30" cy="40" r="2" className="fill-emerald-400 dark:fill-emerald-600">
      <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
    </circle>
    <circle cx="90" cy="35" r="1.5" className="fill-emerald-300 dark:fill-emerald-700">
      <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite" />
    </circle>
  </svg>
);

export const DataTable = forwardRef<HTMLDivElement, DataTableProps>(
  ({
    columns,
    data,
    pagination,
    onPageChange,
    onPageSizeChange,
    searchable = false,
    searchPlaceholder = "Search...",
    onSearch,
    searchValue: controlledSearchValue,
    exportable = false,
    exportOptions = [
      { label: "Export CSV", format: "csv", icon: <Download size={14} /> },
      { label: "Export JSON", format: "json", icon: <Download size={14} /> },
    ],
    onExport,
    filterable = false,
    onFilter,
    columnVisibility = false,
    columnVisibilityOptions,
    onColumnVisibilityChange,
    bulkActions = [],
    selectedRows = [],
    onSelectionChange,
    onRowClick,
    rowActions = [],
    emptyMessage = "No data available",
    isLoading = false,
    compact = false,
    className = "",
    ...props
  }, ref) => {
    const [internalSearch, setInternalSearch] = useState("");
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showColumnMenu, setShowColumnMenu] = useState(false);
    const searchValue = controlledSearchValue ?? internalSearch;

    const visibleColumns = useMemo(() => {
      if (columnVisibility && columnVisibilityOptions) {
        const visible = columnVisibilityOptions
          .filter((opt) => !columns.find((c) => c.key === opt.key && c.hidden))
          .map((opt) => opt.key);
        return columns.filter((col) => visible.includes(col.key));
      }
      return columns.filter((col) => !col.hidden);
    }, [columns, columnVisibility, columnVisibilityOptions]);

    const filteredData = useMemo(() => {
      if (!searchable || !searchValue) return data;
      const query = searchValue.toLowerCase();
      return data.filter((row) =>
        visibleColumns.some((col) => {
          if (col.searchable === false) return false;
          const value = typeof col.accessor === "function"
            ? col.accessor(row)
            : row[col.key as keyof typeof row];
          return String(value).toLowerCase().includes(query);
        })
      );
    }, [data, searchValue, visibleColumns, searchable]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInternalSearch(value);
      onSearch?.(value);
    };

    const handleExport = (format: "csv" | "xlsx" | "json") => {
      const exportData = filteredData as unknown as Record<string, unknown>[];
      if (format === "csv") {
        exportToCSV(exportData, "export");
      } else if (format === "json") {
        exportToJSON(exportData, "export");
      }
      onExport?.(format);
      setShowExportMenu(false);
    };

    const handleSelectAll = (checked: boolean) => {
      if (checked) {
        onSelectionChange?.(filteredData.map((_, i) => i));
      } else {
        onSelectionChange?.([]);
      }
    };

    const handleSelectRow = (index: number, checked: boolean) => {
      if (checked) {
        onSelectionChange?.([...selectedRows, index]);
      } else {
        onSelectionChange?.(selectedRows.filter((i) => i !== index));
      }
    };

    const getCellValue = (column: DataTableColumn, row: Record<string, unknown>, rowIndex: number): ReactNode => {
      if (column.render) {
        const value = typeof column.accessor === "function"
          ? column.accessor(row as never)
          : row[column.key];
        return column.render(value, row as never, rowIndex);
      }
      if (typeof column.accessor === "function") {
        return column.accessor(row as never);
      }
      const cellValue = row[column.key];
      return cellValue !== undefined ? String(cellValue) : "-";
    };

    const columnVisibilityDropdownOptions: DropdownOption[] = columnVisibilityOptions
      ? columnVisibilityOptions.map((opt) => ({
          value: opt.key,
          label: opt.label,
          disabled: visibleColumns.length === 1 && visibleColumns.some((c) => c.key === opt.key),
        }))
      : [];

    const selectedCount = selectedRows.length;

    return (
      <div ref={ref} className={`flex flex-col gap-4 ${className}`} {...props}>
        {/* Glassmorphism Toolbar */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/80 via-white/95 to-teal-50/80 dark:from-emerald-950/40 dark:via-zinc-900/95 dark:to-teal-950/40 backdrop-blur-xl rounded-2xl border border-emerald-200/50 dark:border-emerald-800/30 shadow-lg shadow-emerald-500/5" />
          <div className="relative flex items-center justify-between gap-4 flex-wrap p-4">
            {/* Left side - Search */}
            <div className="flex items-center gap-3 flex-1 min-w-[200px]">
              {searchable && (
                <div className="relative flex-1 max-w-md group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 dark:text-emerald-400"
                    />
                    <Input
                      type="text"
                      value={searchValue}
                      onChange={handleSearchChange}
                      placeholder={searchPlaceholder}
                      className="pl-9 pr-4 py-2.5 bg-white/80 dark:bg-zinc-900/80 border-emerald-200/50 dark:border-emerald-800/50 focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}
              {filterable && (
                <Button variant="secondary" size="sm" onClick={onFilter} className="backdrop-blur-md">
                  <Filter size={14} />
                  Filter
                </Button>
              )}
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-2">
              {/* Bulk Actions - Gradient bar */}
              {selectedCount > 0 && bulkActions.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white shadow-lg shadow-emerald-500/25 animate-[fadeIn_0.2s_ease-out]">
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {selectedCount} selected
                  </span>
                  <div className="w-px h-4 bg-white/30" />
                  {bulkActions.map((action, i) => (
                    <Button
                      key={i}
                      variant={action.variant === "danger" ? "danger" : "ghost"}
                      size="sm"
                      onClick={() => action.onClick(selectedRows)}
                      className={action.variant === "danger" ? "" : "text-white hover:bg-white/20"}
                    >
                      {action.icon}
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}

              {/* Column Visibility */}
              {columnVisibility && columnVisibilityDropdownOptions.length > 0 && (
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowColumnMenu(!showColumnMenu)}
                    className="backdrop-blur-md"
                  >
                    <Columns size={14} />
                    Columns
                    <ChevronDown size={12} />
                  </Button>
                  {showColumnMenu && (
                    <div className="absolute right-0 top-full mt-2 z-20 w-48 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-emerald-200/50 dark:border-emerald-800/30 rounded-xl shadow-xl shadow-emerald-500/10 p-2 animate-[fadeIn_0.15s_ease-out]">
                      {columnVisibilityDropdownOptions.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            const currentVisible = visibleColumns.map((c) => c.key);
                            const newVisible = currentVisible.includes(opt.value)
                              ? currentVisible.filter((k) => k !== opt.value)
                              : [...currentVisible, opt.value];
                            onColumnVisibilityChange?.(newVisible);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={visibleColumns.some((c) => c.key === opt.value)}
                            onChange={() => {}}
                            className="rounded border-emerald-300 dark:border-emerald-700 text-emerald-500 focus:ring-emerald-500"
                          />
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Export */}
              {exportable && (
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="backdrop-blur-md"
                  >
                    <Download size={14} />
                    Export
                    <ChevronDown size={12} />
                  </Button>
                  {showExportMenu && (
                    <div className="absolute right-0 top-full mt-2 z-20 w-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-emerald-200/50 dark:border-emerald-800/30 rounded-xl shadow-xl shadow-emerald-500/10 overflow-hidden animate-[fadeIn_0.15s_ease-out]">
                      {exportOptions.map((opt) => (
                        <button
                          key={opt.format}
                          onClick={() => handleExport(opt.format)}
                          className="w-full flex items-center gap-2 px-4 py-3 text-[11px] font-bold hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                        >
                          {opt.icon || <Download size={14} />}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table with Emerald gradient header */}
        <div className="overflow-x-auto border border-emerald-200/30 dark:border-emerald-800/30 rounded-xl shadow-lg shadow-emerald-500/5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
          <Table minWidth={compact ? "min-w-[600px]" : "min-w-[900px]"}>
            <TableHeader>
              <TableRow hover={false} className="bg-gradient-to-r from-emerald-50/50 via-white to-teal-50/50 dark:from-emerald-950/30 dark:via-zinc-900 dark:to-teal-950/30">
                {onSelectionChange && (
                  <TableHead align="center" width="40px" className="bg-gradient-to-b from-emerald-50/50 to-transparent dark:from-emerald-950/50 dark:to-transparent">
                    <input
                      type="checkbox"
                      checked={selectedCount === filteredData.length && filteredData.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-emerald-300 dark:border-emerald-700 text-emerald-500 focus:ring-emerald-500"
                    />
                  </TableHead>
                )}
                {visibleColumns.map((column) => (
                  <TableHead
                    key={column.key}
                    align={column.align}
                    width={column.width}
                  >
                    {column.header}
                  </TableHead>
                ))}
                {rowActions.length > 0 && (
                  <TableHead align="right" width="80px">
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {onSelectionChange && <TableCell><div className="h-4 w-4 bg-emerald-100 dark:bg-emerald-900/30 rounded animate-pulse" /></TableCell>}
                    {visibleColumns.map((col) => (
                      <TableCell key={col.key}>
                        <div className="h-4 bg-emerald-100 dark:bg-emerald-900/30 rounded animate-pulse" />
                      </TableCell>
                    ))}
                    {rowActions.length > 0 && <TableCell />}
                  </TableRow>
                ))
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length + (onSelectionChange ? 1 : 0) + (rowActions.length > 0 ? 1 : 0)}
                    align="center"
                    className="py-16"
                  >
                    <div className="flex flex-col items-center">
                      <EmptyStateIllustration />
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                        {emptyMessage}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((row, rowIndex) => {
                  const isSelected = selectedRows.includes(rowIndex);
                  return (
                    <TableRow
                      key={rowIndex}
                      selected={isSelected}
                      onClick={() => onRowClick?.(row, rowIndex)}
                      className={onRowClick ? "cursor-pointer" : ""}
                    >
                      {onSelectionChange && (
                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleSelectRow(rowIndex, e.target.checked)}
                            className="rounded border-emerald-300 dark:border-emerald-700 text-emerald-500 focus:ring-emerald-500"
                          />
                        </TableCell>
                      )}
                      {visibleColumns.map((column) => (
                        <TableCell key={column.key} align={column.align}>
                          {getCellValue(column, row, rowIndex)}
                        </TableCell>
                      ))}
                      {rowActions.length > 0 && (
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            {rowActions.map((action, i) => (
                              <button
                                key={i}
                                onClick={() => action.onClick(row, rowIndex)}
                                className={`p-2 rounded-lg transition-all duration-150 ${
                                  action.variant === "danger"
                                    ? "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                                    : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                                }`}
                                title={action.label}
                              >
                                {action.icon || <Eye size={14} />}
                              </button>
                            ))}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Emerald Pagination */}
        {pagination && (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 via-white/95 to-teal-50/50 dark:from-emerald-950/30 dark:via-zinc-900/95 dark:to-teal-950/30 backdrop-blur-xl rounded-2xl border border-emerald-200/50 dark:border-emerald-800/30" />
            <div className="relative">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={onPageChange!}
                showPageSizeSelector={!!onPageSizeChange}
                pageSize={pagination.pageSize}
                onPageSizeChange={onPageSizeChange}
                pageSizeOptions={[10, 25, 50, 100]}
                compact={compact}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
);

DataTable.displayName = "DataTable";

export default DataTable;