// src/components/shared/DataTable.tsx
'use client';

import { useState } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  MoreHorizontal,
  Filter,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: keyof T;
  header: string;
  width?: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  loading?: boolean;
}

export function DataTable<T extends { id: string | number }>({ 
  data, 
  columns, 
  onRowClick,
  onEdit,
  onDelete,
  loading = false
}: DataTableProps<T>) {
  const [sortField, setSortField] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());

  const handleSort = (key: keyof T) => {
    if (sortField === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(key);
      setSortDirection('asc');
    }
  };

  const toggleRow = (id: string | number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const toggleAll = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.map(row => row.id)));
    }
  };

  // Sort data
  const sortedData = [...data];
  if (sortField) {
    sortedData.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  if (loading) {
    return (
      <div className="bg-background-secondary border border-border rounded-xl p-8 flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-background-secondary border border-border rounded-xl overflow-hidden">
      {/* Table Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          {selectedRows.size > 0 && (
            <span className="text-sm text-text-secondary">{selectedRows.size} selected</span>
          )}
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary hover:text-white hover:bg-hover rounded-lg transition-colors">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary hover:text-white hover:bg-hover rounded-lg transition-colors">
            <Eye className="w-4 h-4" />
            Views
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-text-tertiary">1-{data.length} of {data.length}</span>
          <button className="p-1 text-text-secondary hover:text-white rounded-lg transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="p-1 text-text-secondary hover:text-white rounded-lg transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="w-10 px-3 py-2">
                <input
                  type="checkbox"
                  checked={selectedRows.size === data.length && data.length > 0}
                  onChange={toggleAll}
                  className="rounded bg-background-tertiary border-border"
                />
              </th>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className="px-3 py-2 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider"
                  style={{ width: column.width }}
                >
                  <button
                    onClick={() => column.sortable && handleSort(column.key)}
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    {column.header}
                    {column.sortable && sortField === column.key && (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                    )}
                  </button>
                </th>
              ))}
              <th className="w-10 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row) => (
              <tr
                key={row.id}
                className={cn(
                  "border-b border-border/50 hover:bg-hover transition-colors",
                  selectedRows.has(row.id) && "bg-hover",
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick?.(row)}
              >
                <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedRows.has(row.id)}
                    onChange={() => toggleRow(row.id)}
                    className="rounded bg-background-tertiary border-border"
                  />
                </td>
                {columns.map((column) => (
                  <td key={String(column.key)} className="px-3 py-3 text-sm text-text-secondary">
                    {column.render ? column.render(row[column.key], row) : String(row[column.key])}
                  </td>
                ))}
                <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    {onEdit && (
                      <button 
                        onClick={() => onEdit(row)}
                        className="p-1 text-text-tertiary hover:text-white hover:bg-hover rounded-lg transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button 
                        onClick={() => onDelete(row)}
                        className="p-1 text-text-tertiary hover:text-error hover:bg-hover rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button className="p-1 text-text-tertiary hover:text-white hover:bg-hover rounded-lg transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}