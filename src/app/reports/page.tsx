'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getInventory, getBoms, getABCAndAgingReports } from '@/app/actions';
import { Card } from '@/components/ui/Card';
import { 
  FileSpreadsheet, AlertTriangle, TrendingUp, Package, BarChart3, Download, 
  HelpCircle, Calendar, ShieldCheck, Flame, PieChart, Activity, FileText
} from 'lucide-react';
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

  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['abcAndAgingReports'],
    queryFn: () => getABCAndAgingReports()
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

      {/* Grid Summary */}
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
          <span className="text-[10px] text-text-tertiary relative z-10">Life-time sales volume</span>
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

      {/* Main Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns - CSV Exports & Info */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="glass-card rounded-2xl p-5 border border-border">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">Export Databases</h3>
            <div className="space-y-3">
              <div className="p-3 bg-bg-tertiary/50 border border-border rounded-xl flex items-center justify-between hover:border-success/30 transition-all group">
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet className="w-5 h-5 text-success" />
                  <div>
                    <p className="text-sm font-bold text-text-primary">Master Inventory</p>
                    <p className="text-[10px] text-text-tertiary">All quantities, costs, specs</p>
                  </div>
                </div>
                <button
                  onClick={handleExportInventory}
                  disabled={isInvLoading}
                  className="p-2 hover:bg-success/15 rounded-lg text-success transition-all active:scale-90"
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
                    <p className="text-[10px] text-text-tertiary">Recipes, nested item counts</p>
                  </div>
                </div>
                <button
                  onClick={handleExportBoms}
                  disabled={isBomLoading}
                  className="p-2 hover:bg-accent/15 rounded-lg text-accent transition-all active:scale-90"
                  title="Download CSV"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>

          {/* Quick Help card */}
          <Card className="glass-card rounded-2xl p-5 border border-border bg-accent/5">
            <div className="flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">ABC Classification Guide</h4>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  <strong>Class A:</strong> Represents high value assets (top 70% of total inventory value). Requires strict controls.<br/>
                  <strong>Class B:</strong> Medium asset value (next 20%).<br/>
                  <strong>Class C:</strong> Low asset value (remaining 10%).
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Columns - Advanced Analytics Reports */}
        <div className="lg:col-span-2 space-y-6">
          {/* ABC Analysis Widget */}
          <Card className="glass-card rounded-2xl p-5 border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PieChart className="w-4.5 h-4.5 text-accent" />
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">ABC Classification Report</h3>
              </div>
              <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/20">Value Distribution</span>
            </div>

            {isAnalyticsLoading ? (
              <div className="text-center py-8 text-xs text-text-tertiary">Calculating classifications...</div>
            ) : !analytics || analytics.abc.length === 0 ? (
              <div className="text-center py-8 text-xs text-text-tertiary">No inventory data to analyze.</div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-bg-tertiary p-3 rounded-xl border border-border text-center">
                    <p className="text-[10px] font-bold text-error uppercase tracking-wider">Class A (Top 70%)</p>
                    <p className="text-lg font-black text-text-primary mt-1">{analytics.summary.aCount} SKUs</p>
                  </div>
                  <div className="bg-bg-tertiary p-3 rounded-xl border border-border text-center">
                    <p className="text-[10px] font-bold text-warning uppercase tracking-wider">Class B (Mid 20%)</p>
                    <p className="text-lg font-black text-text-primary mt-1">{analytics.summary.bCount} SKUs</p>
                  </div>
                  <div className="bg-bg-tertiary p-3 rounded-xl border border-border text-center">
                    <p className="text-[10px] font-bold text-info uppercase tracking-wider">Class C (Low 10%)</p>
                    <p className="text-lg font-black text-text-primary mt-1">{analytics.summary.cCount} SKUs</p>
                  </div>
                </div>

                <div className="border border-border rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-bg-tertiary/40 border-b border-border font-bold text-text-secondary">
                        <th className="p-2.5">SKU / Item</th>
                        <th className="p-2.5 text-right">Value (₹)</th>
                        <th className="p-2.5 text-center">Class</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.abc.slice(0, 5).map((item: any) => (
                        <tr key={item.id} className="border-b border-border last:border-0 hover:bg-bg-hover/30 transition-colors">
                          <td className="p-2.5 font-medium text-text-primary">
                            {item.name} <span className="text-[10px] text-text-tertiary font-mono block">{item.sku}</span>
                          </td>
                          <td className="p-2.5 text-right font-semibold text-text-primary">
                            ₹{item.totalVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                              item.group === 'A' ? 'bg-error/15 text-error border-error/20' :
                              item.group === 'B' ? 'bg-warning/15 text-warning border-warning/20' :
                              'bg-info/15 text-info border-info/20'
                            }`}>
                              Class {item.group}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {analytics.abc.length > 5 && (
                    <div className="bg-bg-tertiary/30 p-2 text-center text-[10px] text-text-tertiary border-t border-border">
                      Showing top 5 high-value SKUs
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Stock Aging Widget */}
          <Card className="glass-card rounded-2xl p-5 border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-accent" />
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">Inventory Stock Aging Report</h3>
              </div>
              <span className="text-[10px] font-bold text-info bg-info/10 px-2 py-0.5 rounded-full border border-info/20">Turnover Velocity</span>
            </div>

            {isAnalyticsLoading ? (
              <div className="text-center py-8 text-xs text-text-tertiary">Analyzing activity history...</div>
            ) : !analytics || analytics.aging.length === 0 ? (
              <div className="text-center py-8 text-xs text-text-tertiary">No transaction log history.</div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {/* Fresh bucket */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-text-secondary">
                      <span className="font-semibold text-text-primary">Fresh Inventory (0-30 Days)</span>
                      <span>{analytics.summary.freshCount} items active</span>
                    </div>
                    <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden border border-border">
                      <div className="h-full bg-success rounded-full" style={{ width: `${(analytics.summary.freshCount / analytics.aging.length) * 100}%` }} />
                    </div>
                  </div>

                  {/* Mid bucket */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-text-secondary">
                      <span className="font-semibold text-text-primary">Slow moving (31-90 Days)</span>
                      <span>{analytics.summary.mediumCount} items inactive</span>
                    </div>
                    <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden border border-border">
                      <div className="h-full bg-warning rounded-full" style={{ width: `${(analytics.summary.mediumCount / analytics.aging.length) * 100}%` }} />
                    </div>
                  </div>

                  {/* Slow bucket */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-text-secondary">
                      <span className="font-semibold text-text-primary">Stagnant Stock (91+ Days)</span>
                      <span>{analytics.summary.slowCount} items stagnant</span>
                    </div>
                    <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden border border-border">
                      <div className="h-full bg-error rounded-full" style={{ width: `${(analytics.summary.slowCount / analytics.aging.length) * 100}%` }} />
                    </div>
                  </div>
                </div>

                {/* Stagnant warning list */}
                {analytics.summary.slowCount > 0 && (
                  <div className="p-3 bg-error/5 border border-error/10 rounded-xl flex items-start gap-2.5 text-xs text-text-secondary">
                    <AlertTriangle className="w-4 h-4 text-error shrink-0 mt-0.5 animate-bounce" />
                    <div>
                      <p className="font-bold text-text-primary">Alert: Stagnant inventory detected</p>
                      <p className="text-[11px] mt-0.5">We detected {analytics.summary.slowCount} items that haven't registered movements in over 90 days. Check warehouse locations to confirm demand velocity.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}