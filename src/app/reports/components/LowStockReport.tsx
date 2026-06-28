"use client";

import { useMemo, useState } from "react";
import { Card, Badge, Button } from "@/app/components/ui";
import { DataTable, type DataTableColumn } from "@/app/components/composite/DataTable";
import { ExportButton, type ExportColumn } from "./ExportButton";
import { AlertTriangle, ShoppingCart, Package, TrendingDown } from "lucide-react";

export interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantityOnHand: number;
  minStockLevel: number;
  reorderPoint: number;
  unit: string;
  unitCost: number;
  suggestedReorderQty?: number;
  leadTimeDays?: number;
}

interface LowStockReportProps {
  items: LowStockItem[];
  isLoading?: boolean;
  onBulkReorder?: (itemIds: string[]) => void;
}

interface TableRow {
  [key: string]: string | number;
}

export function LowStockReport({ items, isLoading, onBulkReorder }: LowStockReportProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const lowStockItems = useMemo((): TableRow[] => {
    return items
      .filter((item) => item.minStockLevel && item.quantityOnHand <= item.minStockLevel)
      .sort((a, b) => {
        const urgencyA = a.quantityOnHand / (a.minStockLevel || 1);
        const urgencyB = b.quantityOnHand / (b.minStockLevel || 1);
        return urgencyA - urgencyB;
      })
      .map(item => ({
        ...item,
        shortage: Math.max(0, item.minStockLevel - item.quantityOnHand),
        suggestedReorder: item.suggestedReorderQty || item.minStockLevel * 2,
        status: item.quantityOnHand === 0 ? "out" :
          item.quantityOnHand <= item.minStockLevel * 0.5 ? "critical" : "low",
      }));
  }, [items]);

  const outOfStockItems = useMemo(
    () => lowStockItems.filter((item) => item.quantityOnHand === 0),
    [lowStockItems]
  );

  const criticalItems = useMemo(
    () => lowStockItems.filter((item) => {
      const qty = item.quantityOnHand as number;
      const minLevel = item.minStockLevel as number;
      if (qty === 0) return false;
      return qty <= minLevel * 0.5;
    }),
    [lowStockItems]
  );

  const columns: DataTableColumn[] = useMemo(() => [
    {
      key: "sku",
      header: "SKU",
      accessor: (row) => row.sku as string,
      sortable: true,
      width: "100px",
    },
    {
      key: "name",
      header: "Product",
      accessor: (row) => row.name as string,
      sortable: true,
    },
    {
      key: "category",
      header: "Category",
      accessor: (row) => row.category as string,
      sortable: true,
      width: "120px",
    },
    {
      key: "quantityOnHand",
      header: "Current Qty",
      accessor: (row) => row.quantityOnHand as number,
      sortable: true,
      align: "right",
      width: "100px",
      render: (value, row) => {
        const qty = Number(value);
        const threshold = row.minStockLevel as number || 0;
        const colorClass = qty === 0 ? "text-rose-600" : qty <= threshold * 0.5 ? "text-amber-600" : "text-gray-900 dark:text-white";
        return (
          <span className={`font-mono font-bold ${colorClass}`}>
            {qty.toLocaleString()} {row.unit as string}
          </span>
        );
      },
    },
    {
      key: "minStockLevel",
      header: "Min Level",
      accessor: (row) => row.minStockLevel as number,
      sortable: true,
      align: "right",
      width: "90px",
      render: (value) => (
        <span className="font-mono text-gray-500">{Number(value).toLocaleString()}</span>
      ),
    },
    {
      key: "shortage",
      header: "Shortage",
      accessor: (row) => row.shortage as number,
      sortable: true,
      align: "right",
      width: "90px",
      render: (value) => (
        <span className="font-mono font-bold text-rose-600">
          {(value as number) > 0 ? `-${(value as number).toLocaleString()}` : "0"}
        </span>
      ),
    },
    {
      key: "suggestedReorder",
      header: "Suggested Reorder",
      accessor: (row) => row.suggestedReorder as number,
      sortable: true,
      align: "right",
      width: "120px",
      render: (value, row) => (
        <Badge variant="default" size="sm">
          {Number(value).toLocaleString()} {row.unit as string}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => row.status as string,
      width: "100px",
      render: (value) => {
        const status = String(value);
        const variants: Record<string, "danger" | "warning" | "neutral"> = {
          out: "danger",
          critical: "warning",
          low: "neutral",
        };
        const labels: Record<string, string> = {
          out: "Out of Stock",
          critical: "Critical",
          low: "Low Stock",
        };
        return <Badge variant={variants[status] || "neutral"} size="sm">{labels[status]}</Badge>;
      },
    },
  ], []);

  const exportColumns: ExportColumn[] = useMemo(() => [
    { key: "sku", header: "SKU", accessor: (row) => row.sku as string },
    { key: "name", header: "Product Name", accessor: (row) => row.name as string },
    { key: "category", header: "Category", accessor: (row) => row.category as string },
    { key: "quantityOnHand", header: "Current Quantity", accessor: (row) => row.quantityOnHand as number },
    { key: "minStockLevel", header: "Minimum Stock Level", accessor: (row) => row.minStockLevel as number },
    { key: "shortage", header: "Shortage", accessor: (row) => row.shortage as number },
    { key: "suggestedReorder", header: "Suggested Reorder Qty", accessor: (row) => row.suggestedReorder as number },
    { key: "unitCost", header: "Unit Cost", accessor: (row) => row.unitCost as number },
    { key: "totalReorderCost", header: "Total Reorder Cost", accessor: (row) => (row.suggestedReorder as number) * (row.unitCost as number) },
  ], []);

  const estimatedReorderCost = useMemo(() => {
    return lowStockItems.reduce((sum, item) => {
      const reorderQty = (item.suggestedReorder as number) || ((item.minStockLevel as number) * 2);
      return sum + reorderQty * (item.unitCost as number);
    }, 0);
  }, [lowStockItems]);

  const handleBulkReorder = () => {
    onBulkReorder?.(selectedItems);
  };

  const selectedIndices = useMemo(() => {
    return lowStockItems
      .map((item, idx) => selectedItems.includes(item.id as string) ? idx : -1)
      .filter((idx) => idx !== -1);
  }, [lowStockItems, selectedItems]);

  const data = lowStockItems as Record<string, unknown>[];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="outlined" padding="md" className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950 flex items-center justify-center">
            <AlertTriangle size={20} className="text-rose-600" />
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Out of Stock</p>
            <p className="text-xl font-black text-rose-600">{outOfStockItems.length}</p>
          </div>
        </Card>

        <Card variant="outlined" padding="md" className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 flex items-center justify-center">
            <TrendingDown size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Critical</p>
            <p className="text-xl font-black text-amber-600">{criticalItems.length}</p>
          </div>
        </Card>

        <Card variant="outlined" padding="md" className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
            <Package size={20} className="text-gray-500" />
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Low Stock</p>
            <p className="text-xl font-black text-gray-900 dark:text-white">{lowStockItems.length}</p>
          </div>
        </Card>

        <Card variant="outlined" padding="md" className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
            <ShoppingCart size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Est. Reorder Cost</p>
            <p className="text-xl font-black text-gray-900 dark:text-white">
              ${estimatedReorderCost.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
        </Card>
      </div>

      {/* Main Table */}
      <Card variant="outlined" padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Items Requiring Reorder
          </h3>
          <div className="flex items-center gap-2">
            {selectedItems.length > 0 && (
              <Button variant="primary" size="sm" onClick={handleBulkReorder}>
                <ShoppingCart size={14} />
                Reorder ({selectedItems.length})
              </Button>
            )}
            <ExportButton
              data={data}
              columns={exportColumns}
              filename="low-stock-report"
            />
          </div>
        </div>
        <div className="overflow-x-auto -mx-4 px-4">
          <DataTable
            columns={columns}
            data={data}
            searchable
            searchPlaceholder="Search products..."
            compact
            isLoading={isLoading}
            emptyMessage="No low stock items"
            onSelectionChange={(indices) => {
              const selected = indices.map((idx) => data[idx as number]?.id as string).filter(Boolean);
              setSelectedItems(selected as string[]);
            }}
            selectedRows={selectedIndices}
            bulkActions={[
              {
                label: "Create Reorder",
                icon: <ShoppingCart size={14} />,
                variant: "primary",
                onClick: () => onBulkReorder?.(selectedItems),
              },
            ]}
          />
        </div>
      </Card>
    </div>
  );
}

export default LowStockReport;