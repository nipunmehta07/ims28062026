'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getInventory, getBoms } from '@/app/actions';
import { Card } from '@/components/ui/Card';
import { FileSpreadsheet, FileText, AlertTriangle, TrendingUp, Package, BarChart3, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const barColors = ['bg-accent', 'bg-success', 'bg-info', 'bg-warning', 'bg-error'];

export default function ReportsPage() {
  const [stats, setStats] = useState({
    activeOrders: 0,
    totalRevenue: 0,
    inventoryValue: 0,
    lowStock: 0,
  });
  const [mounted, setMounted] = useState(false);

  const { data: inventory = [], isLoading: isInvLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => getInventory()
  });

  const { data: boms = [], isLoading: isBomLoading } = useQuery({
    queryKey: ['boms'],
    queryFn: () => getBoms()
  });

  useEffect(() => {
    async function load() {
      try {
        const result = await getDashboardStats();
        setStats(result);
      } catch (err) {
        console.error('Failed to load stats for reporting', err);
      }
    }
    load();
    // Trigger bar animations after mount
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Category statistics helper
  const categoryCounts = inventory.reduce((acc: any, item: any) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  const totalItems = inventory.length;

  // CSV Export: Master Inventory
  const handleExportInventory = () => {
    if (inventory.length === 0) return toast.error('No inventory items to export.');
    const headers = ['ID', 'Name', 'SKU', 'Category', 'Quantity on Hand', 'Unit', 'Unit Cost', 'Estimated Value'];
    const rows = inventory.map((item: any) => [
      item.id,
      item.name,
      item.sku,
      item.category,
      item.quantityOnHand,
      item.unit,
      item.unitCost,
      item.quantityOnHand * item.unitCost
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Inventory report download started!');
  };

  // CSV Export: BOM Recipes
  const handleExportBoms = () => {
    if (boms.length === 0) return toast.error('No BOM recipes to export.');
    const headers = ['Recipe Name', 'Finished Product SKU', 'Finished Product Name', 'Component SKU', 'Component Name', 'Required Qty'];
    const rows = boms.flatMap((bom: any) =>
      bom.components.map((c: any) => [
        bom.name,
        bom.item?.sku || '',
        bom.item?.name || '',
        c.componentItem?.sku || '',
        c.componentItem?.name || '',
        c.quantity
      ])
    );

    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `BOM_Recipes_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('BOM Recipes report download started!');
  };

  return (
    <div className="space-y-6 max-w-6xl animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="glass-card bg-mesh-gradient rounded-2xl p-6 relative overflow-hidden transition-all duration-300">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-text-primary tracking-tight">Audit & Analytics Reports</h1>
            <p className="text-sm text-text-secondary">Export structured databases, analyze inventory valuations, and review audit metrics.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-warning/10 border border-warning/20 rounded-full">
            <BarChart3 className="w-3.5 h-3.5 text-warning animate-pulse" />
            <span className="text-xs font-semibold text-warning tracking-wide uppercase">Analytics</span>
          </div>
        </div>
      </div>

      {/* Grid Summary — with glow-card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card glow-card rounded-2xl p-5 relative overflow-hidden stagger-enter">
          <div className="absolute inset-0 bg-gradient-to-br from-info/5 via-transparent to-transparent opacity-50" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Inventory Value</span>
            <Package className="w-4 h-4 text-info" />
          </div>
          <p className="text-2xl font-black text-text-primary tracking-tight mt-3 stat-number relative z-10">
            ₹{stats.inventoryValue.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-text-tertiary relative z-10">Real-time cumulative assets</span>
        </div>

        <div className="glass-card glow-card rounded-2xl p-5 relative overflow-hidden stagger-enter">
          <div className="absolute inset-0 bg-gradient-to-br from-success/5 via-transparent to-transparent opacity-50" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Total Revenue</span>
            <TrendingUp className="w-4 h-4 text-success" />
          </div>
          <p className="text-2xl font-black text-text-primary tracking-tight mt-3 stat-number relative z-10">
            ₹{stats.totalRevenue.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-text-tertiary relative z-10">Life-time fulfilled sales volume</span>
        </div>

        <div className="glass-card glow-card rounded-2xl p-5 relative overflow-hidden stagger-enter">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-50" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Active SKU Types</span>
            <FileText className="w-4 h-4 text-accent" />
          </div>
          <p className="text-2xl font-black text-text-primary tracking-tight mt-3 stat-number relative z-10">
            {totalItems}
          </p>
          <span className="text-[10px] text-text-tertiary relative z-10">Active registered items</span>
        </div>

        <div className="glass-card glow-card rounded-2xl p-5 relative overflow-hidden stagger-enter">
          <div className="absolute inset-0 bg-gradient-to-br from-error/5 via-transparent to-transparent opacity-50" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Low Stock Warnings</span>
            <AlertTriangle className="w-4 h-4 text-error" />
          </div>
          <p className="text-2xl font-black text-error tracking-tight mt-3 stat-number relative z-10">
            {stats.lowStock}
          </p>
          <span className="text-[10px] text-text-tertiary relative z-10">Items below minimum limit</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: CSV Exports */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="glass-card rounded-2xl p-5">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">Export Databases</h3>
            <div className="space-y-3">
              <div className="p-3 bg-bg-tertiary/50 border border-border rounded-xl flex items-center justify-between hover:border-success/30 transition-all group">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-success" />
                  <div>
                    <p className="text-sm font-bold text-text-primary">Master Inventory</p>
                    <p className="text-[10px] text-text-tertiary">All quantities, costs, category specs</p>
                  </div>
                </div>
                <button
                  onClick={handleExportInventory}
                  disabled={isInvLoading}
                  className="p-2 hover:bg-success/15 rounded-lg text-success transition-all active:scale-90 download-bounce"
                  title="Download CSV"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-bg-tertiary/50 border border-border rounded-xl flex items-center justify-between hover:border-accent/30 transition-all group">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-accent" />
                  <div>
                    <p className="text-sm font-bold text-text-primary">BOM Assemblies</p>
                    <p className="text-[10px] text-text-tertiary">Product assembly recipes, nested item counts</p>
                  </div>
                </div>
                <button
                  onClick={handleExportBoms}
                  disabled={isBomLoading}
                  className="p-2 hover:bg-accent/15 rounded-lg text-accent transition-all active:scale-90 download-bounce"
                  title="Download CSV"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Category distribution chart representation */}
        <div className="lg:col-span-2">
          <Card className="glass-card rounded-2xl p-5">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">Stock Breakdown by Category</h3>
            {totalItems === 0 ? (
              <div className="p-12 text-center border border-dashed border-border rounded-xl bg-bg-tertiary/30">
                <div className="w-14 h-14 bg-bg-tertiary rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-7 h-7 text-text-tertiary" />
                </div>
                <p className="text-sm font-semibold text-text-primary mb-1">No data to analyze</p>
                <p className="text-xs text-text-tertiary">Register items in your inventory to see category breakdowns.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.keys(categoryCounts).map((catName, index) => {
                  const count = categoryCounts[catName];
                  const percentage = Math.round((count / totalItems) * 100);
                  const colorClass = barColors[index % barColors.length];
                  return (
                    <div key={catName} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-text-secondary">
                        <span className="font-medium text-text-primary">{catName}</span>
                        <span className="font-semibold">{count} items ({percentage}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-bg-tertiary rounded-full overflow-hidden border border-border">
                        <div
                          className={`h-full ${colorClass} rounded-full transition-all duration-700 ease-out`}
                          style={{ width: mounted ? `${percentage}%` : '0%', transitionDelay: `${index * 100}ms` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}