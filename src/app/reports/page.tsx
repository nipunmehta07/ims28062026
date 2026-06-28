"use client";

import { useState, useMemo, Suspense } from "react";
import { Tabs } from "@/app/components/ui";
import { PageHeader } from "@/app/components/composite/PageHeader";
import {
  ReportFilters,
  type ReportFilterDefinition,
  InventoryReport,
  type InventoryItem,
  MovementsReport,
  type MovementTransaction,
  ValuationReport,
  type ValuationItem,
  LowStockReport,
  type LowStockItem,
  TrendsReport,
  type TrendDataPoint,
} from "./components";
import {
  Package,
  ArrowLeftRight,
  DollarSign,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";

const mockInventoryItems: InventoryItem[] = [
  { id: "1", name: "Widget A", sku: "WGT-001", category: "Electronics", quantityOnHand: 150, unit: "pcs", unitCost: 25.00, minStockLevel: 50 },
  { id: "2", name: "Widget B", sku: "WGT-002", category: "Electronics", quantityOnHand: 30, unit: "pcs", unitCost: 35.00, minStockLevel: 40 },
  { id: "3", name: "Gadget X", sku: "GDG-001", category: "Accessories", quantityOnHand: 200, unit: "pcs", unitCost: 12.50, minStockLevel: 75 },
  { id: "4", name: "Component Y", sku: "CMP-001", category: "Raw Materials", quantityOnHand: 0, unit: "kg", unitCost: 8.00, minStockLevel: 100 },
  { id: "5", name: "Part Z", sku: "PRT-001", category: "Raw Materials", quantityOnHand: 45, unit: "pcs", unitCost: 15.00, minStockLevel: 60 },
  { id: "6", name: "Assembly Kit", sku: "ASK-001", category: "Assemblies", quantityOnHand: 80, unit: "kits", unitCost: 45.00, minStockLevel: 30 },
  { id: "7", name: "Sensor Module", sku: "SNS-001", category: "Electronics", quantityOnHand: 120, unit: "pcs", unitCost: 55.00, minStockLevel: 50 },
  { id: "8", name: "Power Supply", sku: "PWR-001", category: "Electronics", quantityOnHand: 15, unit: "pcs", unitCost: 75.00, minStockLevel: 25 },
];

const mockMovements: MovementTransaction[] = [
  { id: "1", itemId: "1", itemName: "Widget A", itemSku: "WGT-001", changeQty: 100, newTotalQty: 150, reason: "Inward: PO-2024-001", createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "2", itemId: "1", itemName: "Widget A", itemSku: "WGT-001", changeQty: 50, newTotalQty: 100, reason: "Outward: SO-2024-001", createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "3", itemId: "2", itemName: "Widget B", itemSku: "WGT-002", changeQty: 80, newTotalQty: 80, reason: "Inward: PO-2024-002", createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "4", itemId: "3", itemName: "Gadget X", itemSku: "GDG-001", changeQty: 200, newTotalQty: 200, reason: "Inward: PO-2024-003", createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "5", itemId: "3", itemName: "Gadget X", itemSku: "GDG-001", changeQty: 50, newTotalQty: 150, reason: "Outward: SO-2024-002", createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: "6", itemId: "4", itemName: "Component Y", itemSku: "CMP-001", changeQty: 100, newTotalQty: 100, reason: "Inward: PO-2024-004", createdAt: new Date().toISOString() },
  { id: "7", itemId: "2", itemName: "Widget B", itemSku: "WGT-002", changeQty: 50, newTotalQty: 30, reason: "Outward: SO-2024-003", createdAt: new Date().toISOString() },
];

const mockValuationItems: ValuationItem[] = mockInventoryItems.map((item) => ({
  ...item,
  transactions: [
    { date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), quantity: item.quantityOnHand, unitCost: item.unitCost, type: "in" as const },
  ],
}));

const mockLowStockItems: LowStockItem[] = mockInventoryItems.map((item) => ({
  ...item,
  minStockLevel: item.minStockLevel || 50,
  reorderPoint: (item.minStockLevel || 50) * 1.5,
  suggestedReorderQty: (item.minStockLevel || 50) * 2,
  leadTimeDays: 7,
}));

const generateTrendData = (): TrendDataPoint[] => {
  const data: TrendDataPoint[] = [];
  const baseValue = 1000;
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString(),
      value: baseValue + Math.sin(i / 5) * 200 + i * 10 + Math.random() * 50,
      inventoryValue: baseValue * 1.5 + Math.sin(i / 5) * 300 + i * 15,
      movements: Math.floor(10 + Math.random() * 20),
    });
  }
  return data;
};

function ReportsContent() {
  const [, setActiveFilters] = useState<Record<string, unknown>>({});

  const filterDefinitions: ReportFilterDefinition[] = useMemo(() => [
    {
      key: "category",
      label: "Category",
      type: "select",
      placeholder: "All Categories",
      options: [
        { value: "Electronics", label: "Electronics" },
        { value: "Accessories", label: "Accessories" },
        { value: "Raw Materials", label: "Raw Materials" },
        { value: "Assemblies", label: "Assemblies" },
      ],
    },
    {
      key: "warehouse",
      label: "Warehouse",
      type: "select",
      placeholder: "All Warehouses",
      options: [
        { value: "main", label: "Main Warehouse" },
        { value: "secondary", label: "Secondary Warehouse" },
      ],
    },
  ], []);

  const handleApplyFilters = (values: Record<string, unknown>) => {
    setActiveFilters(values);
  };

  const trendData = useMemo(() => generateTrendData(), []);

  const trendSeries = [
    { key: "value", name: "Total Items", color: "#10b981" },
    { key: "inventoryValue", name: "Inventory Value ($)", color: "#14b8a6" },
  ];

  const tabs = [
    {
      id: "inventory",
      label: "Inventory",
      icon: <Package size={14} />,
      content: (
        <div className="space-y-6">
          <ReportFilters
            filters={filterDefinitions}
            onApply={handleApplyFilters}
            showDateRange={false}
          />
          <InventoryReport
            items={mockInventoryItems}
            isLoading={false}
          />
        </div>
      ),
    },
    {
      id: "movements",
      label: "Movements",
      icon: <ArrowLeftRight size={14} />,
      content: (
        <div className="space-y-6">
          <ReportFilters
            filters={filterDefinitions}
            onApply={handleApplyFilters}
          />
          <MovementsReport
            transactions={mockMovements}
            isLoading={false}
          />
        </div>
      ),
    },
    {
      id: "valuation",
      label: "Valuation",
      icon: <DollarSign size={14} />,
      content: (
        <div className="space-y-6">
          <ReportFilters
            filters={filterDefinitions}
            onApply={handleApplyFilters}
            showDateRange={false}
          />
          <ValuationReport
            items={mockValuationItems}
            isLoading={false}
          />
        </div>
      ),
    },
    {
      id: "lowstock",
      label: "Low Stock",
      icon: <AlertTriangle size={14} />,
      content: (
        <div className="space-y-6">
          <LowStockReport
            items={mockLowStockItems}
            isLoading={false}
            onBulkReorder={(ids) => console.log("Bulk reorder:", ids)}
          />
        </div>
      ),
    },
    {
      id: "trends",
      label: "Trends",
      icon: <TrendingUp size={14} />,
      content: (
        <div className="space-y-6">
          <TrendsReport
            data={trendData}
            series={trendSeries}
            title="Inventory Trends"
            description="30-day inventory overview with items and value trends"
            type="area"
            isLoading={false}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Comprehensive inventory reports and analytics"
        showBreadcrumb
        breadcrumb={[
          { label: "Dashboard", href: "/" },
          { label: "Reports" },
        ]}
      />

      {/* Tabs - Emerald gradient underline indicator */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-max">
          <Tabs tabs={tabs} variant="gradient" />
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-6">
        <PageHeader
          title="Reports"
          description="Comprehensive inventory reports and analytics"
          showBreadcrumb
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Reports" },
          ]}
        />
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 rounded-xl" />
          <div className="h-96 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 rounded-xl" />
        </div>
      </div>
    }>
      <ReportsContent />
    </Suspense>
  );
}