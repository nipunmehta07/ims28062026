"use client";

import { useMemo, useState } from "react";
import { Card, Badge } from "@/app/components/ui";
import { DataTable, type DataTableColumn } from "@/app/components/composite/DataTable";
import { ExportButton, type ExportColumn } from "./ExportButton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { DollarSign, TrendingUp, Layers, PieChart as PieChartIcon } from "lucide-react";

export interface ValuationItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantityOnHand: number;
  unitCost: number;
  transactions: Array<{
    date: string;
    quantity: number;
    unitCost: number;
    type: "in" | "out";
  }>;
}

interface ValuationReportProps {
  items: ValuationItem[];
  isLoading?: boolean;
}

type ValuationMethod = "fifo" | "average" | "lifo";

const CHART_COLORS = ["#18181b", "#71717a", "#a1a1aa", "#d4d4d8", "#e4e4e7", "#f4f4f5"];

interface ValuedItem {
  [key: string]: string | number;
}

export function ValuationReport({ items, isLoading }: ValuationReportProps) {
  const [method, setMethod] = useState<ValuationMethod>("average");

  const calculateValuation = useMemo((): ValuedItem[] => {
    return items.map((item) => {
      const sortedTx = [...item.transactions].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      let totalValue = 0;
      let totalQty = 0;

      if (method === "fifo" || method === "lifo") {
        const txList = method === "fifo" ? sortedTx : sortedTx.reverse();
        let remainingQty = item.quantityOnHand;

        for (const tx of txList) {
          if (tx.type === "in") {
            const qtyToUse = Math.min(remainingQty, tx.quantity);
            totalValue += qtyToUse * tx.unitCost;
            totalQty += qtyToUse;
            remainingQty -= qtyToUse;
            if (remainingQty <= 0) break;
          }
        }
      } else {
        totalQty = item.quantityOnHand;
        totalValue = totalQty * item.unitCost;
      }

      return {
        id: item.id,
        name: item.name,
        sku: item.sku,
        category: item.category,
        valuedQty: totalQty,
        unitValue: totalQty > 0 ? totalValue / totalQty : 0,
        totalValue,
      };
    });
  }, [items, method]);

  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    calculateValuation.forEach((item) => {
      const cat = item.category as string;
      if (!breakdown[cat]) {
        breakdown[cat] = 0;
      }
      breakdown[cat] += item.totalValue as number;
    });
    return Object.entries(breakdown)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [calculateValuation]);

  const chartData = useMemo(() => {
    return categoryBreakdown.slice(0, 6).map((cat) => ({
      category: cat.name,
      value: cat.value,
    }));
  }, [categoryBreakdown]);

  const totalValue = useMemo(
    () => calculateValuation.reduce((sum, item) => sum + (item.totalValue as number), 0),
    [calculateValuation]
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
      key: "valuedQty",
      header: "Valued Qty",
      accessor: (row) => row.valuedQty as number,
      sortable: true,
      align: "right",
      width: "100px",
      render: (value) => (
        <span className="font-mono font-bold">{Number(value).toLocaleString()}</span>
      ),
    },
    {
      key: "unitValue",
      header: "Unit Value",
      accessor: (row) => row.unitValue as number,
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
      accessor: (row) => row.totalValue as number,
      sortable: true,
      align: "right",
      width: "120px",
      render: (value) => (
        <span className="font-mono font-bold">
          ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
  ], []);

  const exportColumns: ExportColumn[] = useMemo(() => [
    { key: "sku", header: "SKU", accessor: (row) => row.sku as string },
    { key: "name", header: "Product Name", accessor: (row) => row.name as string },
    { key: "category", header: "Category", accessor: (row) => row.category as string },
    { key: "valuedQty", header: "Valued Quantity", accessor: (row) => row.valuedQty as number },
    { key: "unitValue", header: "Unit Value", accessor: (row) => row.unitValue as number },
    { key: "totalValue", header: "Total Value", accessor: (row) => row.totalValue as number },
  ], []);

  const methodLabels: Record<ValuationMethod, string> = {
    fifo: "FIFO",
    lifo: "LIFO",
    average: "Average Cost",
  };

  const data = calculateValuation as Record<string, unknown>[];

  return (
    <div className="space-y-6">
      {/* Method Selector & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card variant="outlined" padding="lg" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Valuation Method
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {(["average", "fifo", "lifo"] as ValuationMethod[]).map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className={`
                  px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg
                  transition-colors border
                  ${method === m
                    ? "bg-black text-white border-black dark:bg-white dark:text-black"
                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 dark:bg-zinc-900 dark:border-zinc-700"
                  }
                `}
              >
                {methodLabels[m]}
              </button>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-gray-500">
            {method === "fifo" && "First-In, First-Out: Assumes oldest inventory is sold first"}
            {method === "lifo" && "Last-In, First-Out: Assumes newest inventory is sold first"}
            {method === "average" && "Average Cost: Uses weighted average of all purchase costs"}
          </p>
        </Card>

        <Card variant="outlined" padding="lg" className="flex items-center justify-center">
          <div className="text-center">
            <DollarSign size={24} className="mx-auto text-gray-400 mb-2" />
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
              Total Inventory Value
            </p>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <Badge variant="success" size="sm" className="mt-2">
              {methodLabels[method]}
            </Badge>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card variant="outlined" padding="lg">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
            <TrendingUp size={14} className="inline mr-2" />
            Value by Category
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100 dark:stroke-zinc-800" />
                <XAxis type="number" tickFormatter={(v) => `$${v.toLocaleString()}`} className="text-[10px]" />
                <YAxis type="category" dataKey="category" width={80} className="text-[10px]" />
                <Tooltip
                  formatter={(value) => [`$${(value as number).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, "Value"]}
                  contentStyle={{
                    backgroundColor: "var(--color-background)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "11px",
                  }}
                />
                <Bar dataKey="value" fill="#18181b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card variant="outlined" padding="lg">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
            <PieChartIcon size={14} className="inline mr-2" />
            Value Distribution
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`$${(value as number).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, "Value"]}
                  contentStyle={{
                    backgroundColor: "var(--color-background)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "8px",
                    fontSize: "11px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {chartData.map((entry, index) => (
              <div key={entry.category} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <span className="text-[10px] font-bold text-gray-500">{entry.category}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Main Table */}
      <Card variant="outlined" padding="lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <Layers size={14} className="inline mr-2" />
            Inventory Valuation Details
          </h3>
          <ExportButton
            data={data}
            columns={exportColumns}
            filename="valuation-report"
          />
        </div>
        <div className="overflow-x-auto -mx-4 px-4">
          <DataTable
            columns={columns}
            data={data}
            searchable
            searchPlaceholder="Search products..."
            compact
            isLoading={isLoading}
            emptyMessage="No valuation data available"
          />
        </div>
      </Card>
    </div>
  );
}

export default ValuationReport;