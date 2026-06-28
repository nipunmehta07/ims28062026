"use client";

import { useState, useMemo } from "react";
import { DataTable, type DataTableColumn, type DataTablePagination } from "./DataTable";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "./PageHeader";
import {
  Download,
  Eye,
  User,
  Clock,
  Package,
} from "lucide-react";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "EXPORT" | "IMPORT" | "LOGIN" | "LOGOUT";
  entityType: string;
  entityId: string;
  entityName: string;
  changes?: {
    field: string;
    oldValue: string | number | boolean | null;
    newValue: string | number | boolean | null;
  }[];
  ipAddress?: string;
  userAgent?: string;
}

interface AuditTrailViewerProps {
  entries?: AuditLogEntry[];
  isLoading?: boolean;
  onExport?: (entries: AuditLogEntry[]) => void;
}

const MOCK_AUDIT_ENTRIES: AuditLogEntry[] = [
  {
    id: "log-001",
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    userId: "user-001",
    userName: "John Admin",
    userRole: "ADMIN",
    action: "UPDATE",
    entityType: "Product",
    entityId: "prod-001",
    entityName: "Widget A",
    changes: [
      { field: "quantityOnHand", oldValue: 150, newValue: 200 },
      { field: "unitCost", oldValue: 25.0, newValue: 24.5 },
    ],
    ipAddress: "192.168.1.100",
  },
  {
    id: "log-002",
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    userId: "user-002",
    userName: "Jane Staff",
    userRole: "STAFF",
    action: "CREATE",
    entityType: "SalesOrder",
    entityId: "order-042",
    entityName: "SO-2024-042",
    changes: [
      { field: "status", oldValue: null, newValue: "PENDING" },
      { field: "totalAmount", oldValue: null, newValue: 4500 },
    ],
    ipAddress: "192.168.1.101",
  },
  {
    id: "log-003",
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    userId: "user-001",
    userName: "John Admin",
    userRole: "ADMIN",
    action: "DELETE",
    entityType: "Product",
    entityId: "prod-099",
    entityName: "Deprecated Item X",
    ipAddress: "192.168.1.100",
  },
  {
    id: "log-004",
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    userId: "user-003",
    userName: "Mike Operator",
    userRole: "STAFF",
    action: "EXPORT",
    entityType: "Report",
    entityId: "rpt-inventory",
    entityName: "Inventory Report",
    ipAddress: "192.168.1.102",
  },
  {
    id: "log-005",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    userId: "user-001",
    userName: "John Admin",
    userRole: "ADMIN",
    action: "IMPORT",
    entityType: "Products",
    entityId: "bulk-import-001",
    entityName: "Bulk Product Import",
    changes: [
      { field: "itemsImported", oldValue: null, newValue: 50 },
      { field: "itemsFailed", oldValue: null, newValue: 2 },
    ],
    ipAddress: "192.168.1.100",
  },
  {
    id: "log-006",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    userId: "user-002",
    userName: "Jane Staff",
    userRole: "STAFF",
    action: "LOGIN",
    entityType: "Session",
    entityId: "sess-abc123",
    entityName: "Web Login",
    ipAddress: "192.168.1.101",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  },
  {
    id: "log-007",
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    userId: "user-002",
    userName: "Jane Staff",
    userRole: "STAFF",
    action: "LOGOUT",
    entityType: "Session",
    entityId: "sess-abc123",
    entityName: "Web Logout",
    ipAddress: "192.168.1.101",
  },
  {
    id: "log-008",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    userId: "user-001",
    userName: "John Admin",
    userRole: "ADMIN",
    action: "UPDATE",
    entityType: "BOM",
    entityId: "bom-001",
    entityName: "Assembly BOM v2",
    changes: [
      { field: "components", oldValue: 5, newValue: 6 },
    ],
    ipAddress: "192.168.1.100",
  },
];

const ACTION_COLORS: Record<AuditLogEntry["action"], "success" | "warning" | "danger" | "neutral" | "info"> = {
  CREATE: "success",
  UPDATE: "warning",
  DELETE: "danger",
  EXPORT: "info",
  IMPORT: "info",
  LOGIN: "neutral",
  LOGOUT: "neutral",
};

export function AuditTrailViewer({
  entries = MOCK_AUDIT_ENTRIES,
  isLoading = false,
  onExport,
}: AuditTrailViewerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [selectedEntity, setSelectedEntity] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Filter entries
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          entry.userName.toLowerCase().includes(query) ||
          entry.entityName.toLowerCase().includes(query) ||
          entry.action.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Action filter
      if (selectedAction && entry.action !== selectedAction) {
        return false;
      }

      // Entity type filter
      if (selectedEntity && entry.entityType !== selectedEntity) {
        return false;
      }

      return true;
    });
  }, [entries, searchQuery, selectedAction, selectedEntity]);

  // Paginated entries
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredEntries.slice(start, end);
  }, [filteredEntries, currentPage, pageSize]);

  // Reset page when filters change
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleActionChange = (action: string) => {
    setSelectedAction(action);
    setCurrentPage(1);
  };

  const handleEntityChange = (entity: string) => {
    setSelectedEntity(entity);
    setCurrentPage(1);
  };

  const handleExport = (format: "csv" | "json") => {
    const dataToExport = filteredEntries.map((entry) => ({
      Timestamp: new Date(entry.timestamp).toLocaleString(),
      User: entry.userName,
      Role: entry.userRole,
      Action: entry.action,
      Entity: entry.entityType,
      "Entity Name": entry.entityName,
      "IP Address": entry.ipAddress || "N/A",
    }));

    if (format === "csv") {
      const headers = Object.keys(dataToExport[0] || {});
      const csvContent = [
        headers.join(","),
        ...dataToExport.map((row) => Object.values(row).join(",")),
      ].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
    } else {
      const jsonContent = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonContent], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
    }

    onExport?.(filteredEntries);
  };

  // Get unique entity types for filter
  const entityTypes = useMemo(() => {
    const types = new Set(entries.map((e) => e.entityType));
    return Array.from(types).sort();
  }, [entries]);

  // Column definitions
  const columns: DataTableColumn<AuditLogEntry>[] = [
    {
      key: "timestamp",
      header: "Time",
      width: "140px",
      accessor: (row) => {
        const date = new Date(row.timestamp);
        return (
          <div className="flex items-center gap-2">
            <Clock size={12} className="text-gray-400" />
            <span className="text-[10px] font-mono">
              {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        );
      },
      sortable: true,
    },
    {
      key: "userName",
      header: "User",
      width: "150px",
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
            <User size={10} className="text-gray-500" />
          </div>
          <div>
            <p className="text-[11px] font-bold">{row.userName}</p>
            <p className="text-[8px] text-gray-400 uppercase">{row.userRole}</p>
          </div>
        </div>
      ),
      searchable: true,
    },
    {
      key: "action",
      header: "Action",
      width: "100px",
      accessor: (row) => (
        <Badge variant={ACTION_COLORS[row.action]} size="sm">
          {row.action}
        </Badge>
      ),
    },
    {
      key: "entity",
      header: "Entity",
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Package size={12} className="text-gray-400" />
          <div>
            <p className="text-[11px] font-bold">{row.entityName}</p>
            <p className="text-[8px] text-gray-400 uppercase">{row.entityType}</p>
          </div>
        </div>
      ),
      searchable: true,
    },
    {
      key: "changes",
      header: "Changes",
      accessor: (row) => {
        if (!row.changes || row.changes.length === 0) {
          return <span className="text-[10px] text-gray-400">-</span>;
        }
        return (
          <div className="flex flex-wrap gap-1">
            {row.changes.slice(0, 2).map((change, i) => (
              <span
                key={i}
                className="px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 rounded text-[8px] font-mono"
              >
                {change.field}: {String(change.oldValue ?? "∅")} → {String(change.newValue)}
              </span>
            ))}
            {row.changes.length > 2 && (
              <span className="text-[8px] text-gray-400">+{row.changes.length - 2} more</span>
            )}
          </div>
        );
      },
    },
    {
      key: "details",
      header: "",
      width: "60px",
      accessor: () => (
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
          <Eye size={12} />
        </Button>
      ),
      align: "right",
    },
  ];

  const pagination: DataTablePagination = {
    currentPage,
    totalPages: Math.ceil(filteredEntries.length / pageSize),
    pageSize,
    totalItems: filteredEntries.length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Trail"
        description="View all system changes and user activity"
        showBreadcrumb
        breadcrumb={[
          { label: "Dashboard", href: "/" },
          { label: "Reports", href: "/reports" },
          { label: "Audit Trail" },
        ]}
        size="sm"
      />

      {/* Filters */}
      <Card variant="outlined" padding="lg">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by user, entity, or action..."
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-[12px] font-bold outline-none focus:border-black dark:focus:border-white transition-colors"
            />
          </div>

          {/* Action Filter */}
          <select
            value={selectedAction}
            onChange={(e) => handleActionChange(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-[11px] font-black outline-none focus:border-black transition-colors"
          >
            <option value="">All Actions</option>
            <option value="CREATE">CREATE</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
            <option value="EXPORT">EXPORT</option>
            <option value="IMPORT">IMPORT</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
          </select>

          {/* Entity Filter */}
          <select
            value={selectedEntity}
            onChange={(e) => handleEntityChange(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-[11px] font-black outline-none focus:border-black transition-colors"
          >
            <option value="">All Entities</option>
            {entityTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          {/* Export Buttons */}
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

        {/* Active Filters */}
        {(selectedAction || selectedEntity || searchQuery) && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
              Active filters:
            </span>
            {searchQuery && (
              <Badge variant="default" size="sm">
                Search: {searchQuery}
                <button
                  onClick={() => setSearchQuery("")}
                  className="ml-1 hover:text-rose-500"
                >
                  ×
                </button>
              </Badge>
            )}
            {selectedAction && (
              <Badge variant="default" size="sm">
                Action: {selectedAction}
                <button
                  onClick={() => setSelectedAction("")}
                  className="ml-1 hover:text-rose-500"
                >
                  ×
                </button>
              </Badge>
            )}
            {selectedEntity && (
              <Badge variant="default" size="sm">
                Entity: {selectedEntity}
                <button
                  onClick={() => setSelectedEntity("")}
                  className="ml-1 hover:text-rose-500"
                >
                  ×
                </button>
              </Badge>
            )}
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedAction("");
                setSelectedEntity("");
              }}
              className="text-[9px] font-black text-gray-400 hover:text-rose-500 uppercase tracking-widest"
            >
              Clear all
            </button>
          </div>
        )}
      </Card>

      {/* Data Table */}
      <Card variant="outlined" padding="lg">
        <DataTable
          columns={columns as unknown as DataTableColumn<Record<string, unknown>>[]}
          data={paginatedEntries as unknown as Record<string, unknown>[]}
          pagination={pagination}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          isLoading={isLoading}
          emptyMessage="No audit log entries found"
          compact
        />
      </Card>
    </div>
  );
}

export default AuditTrailViewer;