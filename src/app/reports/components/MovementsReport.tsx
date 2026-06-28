"use client";

import { useMemo, useState } from "react";
import { Card } from "@/app/components/ui";
import { DataTable, type DataTableColumn } from "@/app/components/composite/DataTable";
import { ExportButton, type ExportColumn } from "./ExportButton";
import { ArrowDownLeft, ArrowUpRight, Package, Filter } from "lucide-react";

export interface MovementTransaction {
  id: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  changeQty: number;
  newTotalQty: number;
  reason: string;
  createdAt: string;
  type?: "in" | "out";
}

interface MovementsReportProps {
  transactions: MovementTransaction[];
  isLoading?: boolean;
}

type GroupBy = "product" | "date";

interface GroupedData {
  [key: string]: string | number;
}

export function MovementsReport({ transactions, isLoading }: MovementsReportProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>("date");

  const enrichedTransactions = useMemo(() => {
    return transactions.map((tx) => {
      const isInward = tx.changeQty > 0 || tx.reason.startsWith("Inward:");
      return {
        ...tx,
        type: isInward ? "in" as const : "out" as const,
        changeQty: Math.abs(tx.changeQty),
      };
    });
  }, [transactions]);

  const groupedData = useMemo((): GroupedData[] => {
    if (groupBy === "product") {
      const grouped: Record<string, GroupedData> = {};

      enrichedTransactions.forEach((tx) => {
        if (!grouped[tx.itemId]) {
          grouped[tx.itemId] = {
            itemId: tx.itemId,
            itemName: tx.itemName,
            itemSku: tx.itemSku,
            totalIn: 0,
            totalOut: 0,
            netChange: 0,
            transactionCount: 0,
          } as GroupedData;
        }
        const g = grouped[tx.itemId];
        if (tx.type === "in") {
          g.totalIn = (g.totalIn as number) + tx.changeQty;
          g.netChange = (g.netChange as number) + tx.changeQty;
        } else {
          g.totalOut = (g.totalOut as number) + tx.changeQty;
          g.netChange = (g.netChange as number) - tx.changeQty;
        }
        g.transactionCount = (g.transactionCount as number) + 1;
      });

      return Object.values(grouped).sort((a, b) =>
        Math.abs(b.netChange as number) - Math.abs(a.netChange as number)
      );
    }

    // date grouping
    const grouped: Record<string, GroupedData> = {};

    enrichedTransactions.forEach((tx) => {
      const dateKey = new Date(tx.createdAt).toISOString().split("T")[0];
      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateKey,
          totalIn: 0,
          totalOut: 0,
          netChange: 0,
          transactionCount: 0,
        } as GroupedData;
      }
      const g = grouped[dateKey];
      if (tx.type === "in") {
        g.totalIn = (g.totalIn as number) + tx.changeQty;
        g.netChange = (g.netChange as number) + tx.changeQty;
      } else {
        g.totalOut = (g.totalOut as number) + tx.changeQty;
        g.netChange = (g.netChange as number) - tx.changeQty;
      }
      g.transactionCount = (g.transactionCount as number) + 1;
    });

    return Object.values(grouped).sort((a, b) =>
      new Date(b.date as string).getTime() - new Date(a.date as string).getTime()
    );
  }, [enrichedTransactions, groupBy]);

  const summaryStats = useMemo(() => {
    const totalIn = enrichedTransactions
      .filter((tx) => tx.type === "in")
      .reduce((sum, tx) => sum + tx.changeQty, 0);
    const totalOut = enrichedTransactions
      .filter((tx) => tx.type === "out")
      .reduce((sum, tx) => sum + tx.changeQty, 0);
    return { totalIn, totalOut, net: totalIn - totalOut, count: transactions.length };
  }, [enrichedTransactions, transactions.length]);

  const columns: DataTableColumn[] = useMemo(() => {
    if (groupBy === "product") {
      return [
        {
          key: "itemSku",
          header: "SKU",
          accessor: (row) => row.itemSku as string,
          sortable: true,
          width: "100px",
        },
        {
          key: "itemName",
          header: "Product",
          accessor: (row) => row.itemName as string,
          sortable: true,
        },
        {
          key: "totalIn",
          header: "Total In",
          accessor: (row) => row.totalIn as number,
          sortable: true,
          align: "right",
          width: "100px",
          render: (value) => (
            <span className="flex items-center justify-end gap-1 text-emerald-600">
              <ArrowDownLeft size={12} />
              <span className="font-mono font-bold">{Number(value).toLocaleString()}</span>
            </span>
          ),
        },
        {
          key: "totalOut",
          header: "Total Out",
          accessor: (row) => row.totalOut as number,
          sortable: true,
          align: "right",
          width: "100px",
          render: (value) => (
            <span className="flex items-center justify-end gap-1 text-rose-600">
              <ArrowUpRight size={12} />
              <span className="font-mono font-bold">{Number(value).toLocaleString()}</span>
            </span>
          ),
        },
        {
          key: "netChange",
          header: "Net",
          accessor: (row) => row.netChange as number,
          sortable: true,
          align: "right",
          width: "100px",
          render: (value) => {
            const num = Number(value);
            return (
              <span className={`font-mono font-bold ${num >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                {num >= 0 ? "+" : ""}{num.toLocaleString()}
              </span>
            );
          },
        },
        {
          key: "transactionCount",
          header: "Transactions",
          accessor: (row) => row.transactionCount as number,
          sortable: true,
          align: "center",
          width: "100px",
        },
      ];
    }

    return [
      {
        key: "date",
        header: "Date",
        accessor: (row) => new Date(row.date as string).toLocaleDateString(),
        sortable: true,
        width: "120px",
      },
      {
        key: "totalIn",
        header: "Total In",
        accessor: (row) => row.totalIn as number,
        sortable: true,
        align: "right",
        width: "100px",
        render: (value) => (
          <span className="flex items-center justify-end gap-1 text-emerald-600">
            <ArrowDownLeft size={12} />
            <span className="font-mono font-bold">{Number(value).toLocaleString()}</span>
          </span>
        ),
      },
      {
        key: "totalOut",
        header: "Total Out",
        accessor: (row) => row.totalOut as number,
        sortable: true,
        align: "right",
        width: "100px",
        render: (value) => (
          <span className="flex items-center justify-end gap-1 text-rose-600">
            <ArrowUpRight size={12} />
            <span className="font-mono font-bold">{Number(value).toLocaleString()}</span>
          </span>
        ),
      },
      {
        key: "netChange",
        header: "Net",
        accessor: (row) => row.netChange as number,
        sortable: true,
        align: "right",
        width: "100px",
        render: (value) => {
          const num = Number(value);
          return (
            <span className={`font-mono font-bold ${num >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {num >= 0 ? "+" : ""}{num.toLocaleString()}
            </span>
          );
        },
      },
      {
        key: "transactionCount",
        header: "Transactions",
        accessor: (row) => row.transactionCount as number,
        sortable: true,
        align: "center",
        width: "100px",
      },
    ];
  }, [groupBy]);

  const exportColumns: ExportColumn[] = useMemo(() => {
    if (groupBy === "product") {
      return [
        { key: "itemSku", header: "SKU", accessor: (row) => row.itemSku as string },
        { key: "itemName", header: "Product Name", accessor: (row) => row.itemName as string },
        { key: "totalIn", header: "Total In", accessor: (row) => row.totalIn as number },
        { key: "totalOut", header: "Total Out", accessor: (row) => row.totalOut as number },
        { key: "netChange", header: "Net Change", accessor: (row) => row.netChange as number },
        { key: "transactionCount", header: "Transaction Count", accessor: (row) => row.transactionCount as number },
      ];
    }
    return [
      { key: "date", header: "Date", accessor: (row) => row.date as string },
      { key: "totalIn", header: "Total In", accessor: (row) => row.totalIn as number },
      { key: "totalOut", header: "Total Out", accessor: (row) => row.totalOut as number },
      { key: "netChange", header: "Net Change", accessor: (row) => row.netChange as number },
      { key: "transactionCount", header: "Transaction Count", accessor: (row) => row.transactionCount as number },
    ];
  }, [groupBy]);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card variant="outlined" padding="md" className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
            <ArrowDownLeft size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total In</p>
            <p className="text-xl font-black text-emerald-600">{summaryStats.totalIn.toLocaleString()}</p>
          </div>
        </Card>

        <Card variant="outlined" padding="md" className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950 flex items-center justify-center">
            <ArrowUpRight size={20} className="text-rose-600" />
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Out</p>
            <p className="text-xl font-black text-rose-600">{summaryStats.totalOut.toLocaleString()}</p>
          </div>
        </Card>

        <Card variant="outlined" padding="md" className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
            <Package size={20} className="text-gray-500" />
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Net Change</p>
            <p className={`text-xl font-black ${summaryStats.net >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {summaryStats.net >= 0 ? "+" : ""}{summaryStats.net.toLocaleString()}
            </p>
          </div>
        </Card>

        <Card variant="outlined" padding="md" className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
            <Filter size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Transactions</p>
            <p className="text-xl font-black text-gray-900 dark:text-white">{summaryStats.count.toLocaleString()}</p>
          </div>
        </Card>
      </div>

      {/* Main Table */}
      <Card variant="outlined" padding="lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Movement Timeline
          </h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-zinc-800 rounded-lg">
              {(["date", "product"] as GroupBy[]).map((gb) => (
                <button
                  key={gb}
                  onClick={() => setGroupBy(gb)}
                  className={`
                    px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-md transition-colors
                    ${groupBy === gb
                      ? "bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                    }
                  `}
                >
                  {gb}
                </button>
              ))}
            </div>
            <ExportButton
              data={groupedData as Record<string, unknown>[]}
              columns={exportColumns}
              filename="movements-report"
            />
          </div>
        </div>
        <div className="overflow-x-auto -mx-4 px-4">
          <DataTable
            columns={columns}
            data={groupedData as Record<string, unknown>[]}
            compact
            isLoading={isLoading}
            emptyMessage="No movement data available"
          />
        </div>
      </Card>
    </div>
  );
}

export default MovementsReport;