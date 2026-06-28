"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  DataTable,
  type DataTableColumn,
  type DataTablePagination,
} from "@/app/components/composite/DataTable";
import { PageHeader } from "@/app/components/composite/PageHeader";
import { FilterPanel, type FilterDefinition } from "@/app/components/composite/FilterPanel";
import { OutwardStepper } from "./components/OutwardStepper";
import { OutwardDetailDrawer, type OutwardOrder } from "./components/OutwardDetailDrawer";
import { Badge, Button, DatePicker, type DateRange, Card } from "@/app/components/ui";
import {
  getSalesOrders,
  getInventory,
  deleteOrderAction,
} from "@/app/actions";
import toast from "react-hot-toast";
import {
  Plus,
  Download,
  Eye,
  Trash2,
  Filter,
  Package,
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "FULFILLED", label: "Fulfilled" },
  { value: "CANCELLED", label: "Cancelled" },
];

const ITEMS_PER_PAGE = 10;

export default function StockOutwardPage() {
  const queryClient = useQueryClient();

  // Data fetching
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["salesOrders"],
    queryFn: () => getSalesOrders() as Promise<OutwardOrder[]>,
  });

  // UI State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [showStepper, setShowStepper] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OutwardOrder | null>(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);

  // Refresh data
  const refreshData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["salesOrders"] });
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
  }, [queryClient]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    if (!ordersData) return [];

    return ordersData.filter((order) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          order.customerName?.toLowerCase().includes(query) ||
          order.id?.toLowerCase().includes(query) ||
          order.items?.some((i) => i.item?.name?.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Status filter
      if (selectedStatus && order.status !== selectedStatus) {
        return false;
      }

      // Date range filter
      if (dateRange?.from || dateRange?.to) {
        const orderDate = new Date(order.orderDate);
        if (dateRange.from && orderDate < dateRange.from) return false;
        if (dateRange.to && orderDate > dateRange.to) return false;
      }

      return true;
    });
  }, [ordersData, searchQuery, selectedStatus, dateRange]);

  // Paginated orders
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredOrders.slice(start, end);
  }, [filteredOrders, currentPage, pageSize]);

  // Filter change handlers that also reset page
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setSelectedStatus(value);
    setCurrentPage(1);
  }, []);

  const handleDateRangeChange = useCallback((val: DateRange | undefined) => {
    setDateRange(val);
    setCurrentPage(1);
  }, []);

  // Column definitions
  const columns: DataTableColumn<OutwardOrder>[] = [
    {
      key: "orderDate",
      header: "Date",
      width: "100px",
      accessor: (row) => format(new Date(row.orderDate), "dd MMM yyyy"),
      sortable: true,
    },
    {
      key: "customerName",
      header: "Client",
      accessor: (row) => row.customerName || "Unknown",
      searchable: true,
      sortable: true,
    },
    {
      key: "items",
      header: "Items",
      width: "80px",
      accessor: (row) => row.items?.length || 0,
      render: (value) => (
        <div className="flex items-center gap-1.5">
          <Package size={12} className="text-emerald-500" />
          <span className="font-black">{String(value)} items</span>
        </div>
      ),
    },
    {
      key: "totalAmount",
      header: "Total",
      width: "120px",
      accessor: (row) => row.totalAmount,
      sortable: true,
      align: "right",
      render: (value) => (
        <span className="font-black bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
          ₹{((value as number) || 0).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "100px",
      accessor: (row) => row.status,
      render: (value) => {
        const status = value as string;
        const variant =
          status === "FULFILLED"
            ? "success"
            : status === "PENDING"
              ? "warning"
              : status === "CANCELLED"
                ? "danger"
                : "neutral";
        return (
          <Badge variant={variant} size="sm" dot>
            {status}
          </Badge>
        );
      },
    },
  ];

  // Row actions - using any to bypass strict typing since we're working with concrete types
  const rowActions: Array<{
    label: string;
    icon: React.ReactNode;
    variant?: "ghost" | "danger";
    onClick: (row: OutwardOrder, index: number) => void;
  }> = [
    {
      label: "View Details",
      icon: <Eye size={14} />,
      onClick: (row) => {
        setSelectedOrder(row);
        setShowDetailDrawer(true);
      },
    },
    {
      label: "Delete",
      icon: <Trash2 size={14} />,
      variant: "danger",
      onClick: async (row) => {
        if (!confirm(`Delete outward record for ${row.customerName}?`)) return;
        try {
          await deleteOrderAction(row.id);
          toast.success("Record deleted successfully");
          refreshData();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Failed to delete record";
          toast.error(message);
        }
      },
    },
  ];

  // Filter definitions
  const filterDefinitions: FilterDefinition[] = [
    {
      key: "status",
      label: "Status",
      type: "select",
      options: STATUS_OPTIONS,
    },
  ];

  // Export handler - renamed parameter to avoid conflict with date-fns format
  const handleExport = (exportFormat: "csv" | "json") => {
    if (!filteredOrders.length) {
      toast.error("No data to export");
      return;
    }

    const exportData = filteredOrders.map((order) => ({
      Date: format(new Date(order.orderDate), "dd MMM yyyy"),
      Client: order.customerName,
      Items: order.items?.length || 0,
      "Total Amount": order.totalAmount,
      Status: order.status,
    }));

    if (exportFormat === "csv") {
      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(","),
        ...exportData.map((row) => Object.values(row).join(",")),
      ].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stock-outward-${format(new Date(), "yyyy-MM-dd")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stock-outward-${format(new Date(), "yyyy-MM-dd")}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    toast.success(`Exported ${filteredOrders.length} records as ${exportFormat.toUpperCase()}`);
  };

  // Pagination config
  const pagination: DataTablePagination = {
    currentPage,
    totalPages: Math.ceil(filteredOrders.length / pageSize),
    pageSize,
    totalItems: filteredOrders.length,
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // Stats
  const stats = useMemo(() => {
    if (!ordersData) return { total: 0, fulfilled: 0, pending: 0, value: 0 };

    const fulfilled = ordersData.filter((o) => o.status === "FULFILLED");
    const pending = ordersData.filter((o) => o.status === "PENDING");
    const totalValue = ordersData.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return {
      total: ordersData.length,
      fulfilled: fulfilled.length,
      pending: pending.length,
      value: totalValue,
    };
  }, [ordersData]);

  // Row click handler
  const handleRowClick = useCallback((row: OutwardOrder) => {
    setSelectedOrder(row);
    setShowDetailDrawer(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-gray-50 dark:from-zinc-950 dark:via-emerald-950/10 dark:to-zinc-950">
      {/* Emerald mesh pattern */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, emerald-500 1px, transparent 0)`,
        backgroundSize: '24px 24px'
      }} />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Page Header */}
        <PageHeader
          title="Stock Outward"
          description="Manage stock issues and outward records"
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Stock Outward" },
          ]}
          actions={[
            {
              label: "New Outward",
              icon: <Plus size={14} />,
              variant: "gradient",
              onClick: () => setShowStepper(true),
            },
          ]}
        />

        {/* Stats - Emerald Modern */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card 
            variant="glass" 
            padding="md" 
            className="hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300"
          >
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
              Total Records
            </p>
            <p className="text-2xl font-black bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mt-1">
              {stats.total}
            </p>
          </Card>
          <Card 
            variant="glass" 
            padding="md" 
            className="hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300"
          >
            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
              Fulfilled
            </p>
            <p className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent mt-1">
              {stats.fulfilled}
            </p>
          </Card>
          <Card 
            variant="glass" 
            padding="md" 
            className="hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300"
          >
            <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">
              Pending
            </p>
            <p className="text-2xl font-black bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent mt-1">
              {stats.pending}
            </p>
          </Card>
          <Card 
            variant="glass" 
            padding="md" 
            className="hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300"
          >
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
              Total Value
            </p>
            <p className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent mt-1">
              ₹{stats.value.toLocaleString("en-IN")}
            </p>
          </Card>
        </div>

        {/* Filters Section */}
        <div className="space-y-4">
          {/* Quick Filters Row */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px] max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by client or product..."
                className="w-full px-4 py-2.5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-emerald-500/10 rounded-xl text-[12px] font-bold outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
              />
            </div>

            {/* Date Range */}
            <div className="w-64">
              <DatePicker
                mode="range"
                value={dateRange}
                onChange={(val) => handleDateRangeChange(val as DateRange)}
                placeholder="Filter by date range..."
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-4 py-2.5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-emerald-500/10 rounded-xl text-[11px] font-black outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Toggle Filters */}
            <Button
              variant={showFilters ? "gradient" : "secondary"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={14} />
              Filters
            </Button>

            {/* Export */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => handleExport("csv")}>
                <Download size={14} />
                CSV
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleExport("json")}>
                <Download size={14} />
                JSON
              </Button>
            </div>
          </div>

          {/* Expanded Filters Panel */}
          {showFilters && (
            <FilterPanel
              filters={filterDefinitions}
              onApply={(values) => {
                if (values.status) setSelectedStatus(values.status as string);
                else setSelectedStatus("");
              }}
              collapsible={false}
              showClearAll={true}
            />
          )}

          {/* Active Filters Badges */}
          {(selectedStatus || dateRange?.from || searchQuery) && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">
                Active filters:
              </span>
              {searchQuery && (
                <Badge variant="gradient" size="sm">
                  Search: {searchQuery}
                  <button
                    onClick={() => setSearchQuery("")}
                    className="ml-1 hover:text-rose-500"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {selectedStatus && (
                <Badge variant="default" size="sm">
                  Status: {selectedStatus}
                  <button
                    onClick={() => setSelectedStatus("")}
                    className="ml-1 hover:text-rose-500"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {dateRange?.from && (
                <Badge variant="default" size="sm">
                  From: {format(dateRange.from, "dd MMM yyyy")}
                  <button
                    onClick={() => setDateRange({ from: undefined, to: undefined })}
                    className="ml-1 hover:text-rose-500"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {dateRange?.to && (
                <Badge variant="default" size="sm">
                  To: {format(dateRange.to, "dd MMM yyyy")}
                  <button
                    onClick={() => setDateRange({ from: undefined, to: undefined })}
                    className="ml-1 hover:text-rose-500"
                  >
                    ×
                  </button>
                </Badge>
              )}
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedStatus("");
                  setDateRange({ from: undefined, to: undefined });
                }}
                className="text-[9px] font-black text-rose-500 hover:text-rose-600 uppercase tracking-widest"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Data Table - Glassmorphism */}
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-emerald-500/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <DataTable
              columns={columns as unknown as DataTableColumn<Record<string, unknown>>[]}
              data={paginatedOrders as unknown as Record<string, unknown>[]}
              pagination={pagination}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              searchable={false}
              rowActions={rowActions as unknown as Array<{
                label: string;
                icon?: React.ReactNode;
                variant?: "ghost" | "danger";
                onClick: (row: Record<string, unknown>, index: number) => void;
              }>}
              emptyMessage="No stock outward records found"
              isLoading={isLoading}
              onRowClick={handleRowClick as unknown as (row: Record<string, unknown>, index: number) => void}
            />
          </div>
        </div>
      </div>

      {/* Outward Stepper Modal */}
      {showStepper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <OutwardStepper
              isOpen={showStepper}
              onClose={() => setShowStepper(false)}
              onSuccess={() => {
                refreshData();
                setShowStepper(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      <OutwardDetailDrawer
        isOpen={showDetailDrawer}
        onClose={() => {
          setShowDetailDrawer(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onReturn={() => refreshData()}
      />
    </div>
  );
}