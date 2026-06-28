"use client";

import { useMemo } from "react";
import { Card, Badge } from "@/app/components/ui";
import { DataTable, type DataTableColumn } from "@/app/components/composite/DataTable";
import { StatCard } from "@/app/components/composite/StatCard";
import { ExportButton, type ExportColumn } from "./ExportButton";
import { Package, TrendingUp, DollarSign, Layers } from "lucide-react";

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantityOnHand: number;
  unit: string;
  unitCost: number;
  minStockLevel?: number;
}

interface InventoryReportProps {
  items: InventoryItem[];
  isLoading?: boolean;
}

export function InventoryReport({ items, isLoading }: InventoryReportProps) {
  const columns: DataTableColumn[] = useMemo(() => [
    {
      key: "sku",
      header: "SKU",
      accessor: (row) => row.sku as string,
      sortable: true,
      width: "120px",
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
      width: "140px",
    },
    {
      key: "quantityOnHand",
      header: "Qty On Hand",
      accessor: (row) => row.quantityOnHand as number,
      sortable: true,
      align: "right",
      width: "100px",
      render: (value) => {
        const qty = Number(value);
        const item = items.find(i => i.quantityOnHand === qty);
        return (
          <span className="font-mono font-bold">
            {qty.toLocaleString()} {item?.unit || "units"}
          </span>
        );
      },
    },
    {
      key: "unitCost",
      header: "Unit Cost",
      accessor: (row) => row.unitCost as number,
      sortable: true,
      align: "right",
      width: "100px",
      render: (value) => (
        <span className="font-mono">${Number(value).toFixed(2)}</span>
      ),
    },
    {
      key: "totalValue",
      header: "Total Value",
      accessor: (row) => (row.quantityOnHand as number) * (row.unitCost as number),
      sortable: true,
      align: "right",
      width: "120px",
      render: (_, row) => (
        <span className="font-mono font-bold">
          ${((row.quantityOnHand as number) * (row.unitCost as number)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => {
        if (row.minStockLevel && (row.quantityOnHand as number) <= (row.minStockLevel as number)) return "low";
        if ((row.quantityOnHand as number) === 0) return "out";
        return "ok";
      },
      width: "100px",
      render: (value) => {
        const status = String(value);
        const variants: Record<string, "warning" | "danger" | "success"> = {
          low: "warning",
          out: "danger",
          ok: "success",
        };
        const labels: Record<string, string> = {
          low: "Low Stock",
          out: "Out of Stock",
          ok: "In Stock",
        };
        return <Badge variant={variants[status] || "success"} size="sm">{labels[status] || status}</Badge>;
      },
    },
  ], [items]);

  const exportColumns: ExportColumn[] = useMemo(() => [
    { key: "sku", header: "SKU", accessor: (row) => row.sku as string },
    { key: "name", header: "Product Name", accessor: (row) => row.name as string },
    { key: "category", header: "Category", accessor: (row) => row.category as string },
    { key: "quantityOnHand", header: "Quantity on Hand", accessor: (row) => row.quantityOnHand as number },
    { key: "unit", header: "Unit", accessor: (row) => row.unit as string },
    { key: "unitCost", header: "Unit Cost", accessor: (row) => row.unitCost as number },
    { key: "totalValue", header: "Total Value", accessor: (row) => (row.quantityOnHand as number) * (row.unitCost as number) },
  ], []);

  const stats = useMemo(() => {
    const totalItems = items.length;
    const totalQuantity = items.reduce((sum, i) => sum + i.quantityOnHand, 0);
    const totalValue = items.reduce((sum, i) => sum + (i.quantityOnHand * i.unitCost), 0);
    const lowStockItems = items.filter(i => i.minStockLevel && i.quantityOnHand <= i.minStockLevel).length;
    const categories = new Set(items.map(i => i.category)).size;

    return { totalItems, totalQuantity, totalValue, lowStockItems, categories };
  }, [items]);

  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, { count: number; value: number }> = {};
    items.forEach(item => {
      if (!breakdown[item.category]) {
        breakdown[item.category] = { count: 0, value: 0 };
      }
      breakdown[item.category].count += item.quantityOnHand;
      breakdown[item.category].value += item.quantityOnHand * item.unitCost;
    });
    return Object.entries(breakdown)
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.value - a.value);
  }, [items]);

  const tableData = useMemo(() =>
    items.map(item => ({
      ...item,
      totalValue: item.quantityOnHand * item.unitCost,
    })),
    [items]
  );

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Products"
          value={stats.totalItems.toLocaleString()}
          icon={<Package size={20} />}
          trend={{ value: 0, direction: "neutral" }}
          loading={isLoading}
        />
        <StatCard
          title="Total Quantity"
          value={stats.totalQuantity.toLocaleString()}
          icon={<Layers size={20} />}
          trend={{ value: 0, direction: "neutral" }}
          loading={isLoading}
        />
        <StatCard
          title="Inventory Value"
          value={`$${stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<DollarSign size={20} />}
          trend={{ value: 0, direction: "neutral" }}
          loading={isLoading}
        />
        <StatCard
          title="Categories"
          value={stats.categories.toString()}
          icon={<TrendingUp size={20} />}
          loading={isLoading}
        />
      </div>

      {/* Category Breakdown */}
      <Card variant="outlined" padding="lg">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
          Category Breakdown
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {categoryBreakdown.slice(0, 5).map((cat) => (
            <div key={cat.category} className="p-3 bg-gray-50 dark:bg-zinc-900 rounded-xl">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate">
                {cat.category}
              </p>
              <p className="text-lg font-black text-gray-900 dark:text-white mt-1">
                {cat.count.toLocaleString()}
              </p>
              <p className="text-[10px] font-bold text-gray-500">
                ${cat.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* Main Table */}
      <Card variant="outlined" padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Inventory List
          </h3>
          <ExportButton
            data={tableData}
            columns={exportColumns}
            filename="inventory-report"
          />
        </div>
        <div className="overflow-x-auto -mx-4 px-4">
          <DataTable
            columns={columns}
            data={tableData}
            searchable
            searchPlaceholder="Search products..."
            compact
            isLoading={isLoading}
            emptyMessage="No inventory data available"
          />
        </div>
      </Card>
    </div>
  );
}

export default InventoryReport;