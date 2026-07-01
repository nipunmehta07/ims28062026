// src/modules/reports/components/ReportsView.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getInventory, getBoms, getABCAndAgingReports } from '@/app/actions';
import { 
  FileSpreadsheet, AlertTriangle, TrendingUp, Package, BarChart3, Download, 
  HelpCircle, Calendar, ShieldCheck, Flame, PieChart, Activity, FileText, IndianRupee
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function ReportsView() {
  const [stats, setStats] = useState({
    activeOrders: 0,
    totalRevenue: 0,
    inventoryValue: 0,
    lowStock: 0,
  });

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
  }, []);

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
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300 font-sans text-gray-800 text-left">
      
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-lg font-black text-gray-800 font-display uppercase tracking-wider">Reports & Audit Logs</h2>
        </div>
      </div>

      {/* KPI Summary Columns (Odoo style) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        
        {/* Inventory Value */}
        <div className="bg-[#f8f9fa] border border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">
            Inventory Asset Value
          </span>
          <span className="text-2xl font-light text-gray-700 mt-2">
            ₹{stats.inventoryValue.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Total Revenue */}
        <div className="bg-[#f8f9fa] border border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">
            Total sales Revenue
          </span>
          <span className="text-2xl font-light text-gray-700 mt-2">
            ₹{stats.totalRevenue.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Active SKUs */}
        <div className="bg-[#f8f9fa] border border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">
            Registered SKUs
          </span>
          <span className="text-2xl font-light text-gray-700 mt-2">
            {totalItems}
          </span>
        </div>

        {/* Low Stock Warnings */}
        <div className="bg-[#f8f9fa] border border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">
            Low Stock Warnings
          </span>
          <span className="text-2xl font-bold text-rose-500 mt-2">
            {stats.lowStock}
          </span>
        </div>
      </div>

      {/* Main reporting sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: CSV downloads and guide */}
        <div className="lg:col-span-1 space-y-6">
          <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase text-gray-800 tracking-wider border-b border-gray-100 pb-2">Export Data files</h3>
            <div className="space-y-3">
              
              {/* Master Inventory */}
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between hover:border-emerald-200 transition-colors">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <div>
                    <span className="text-xs font-bold text-gray-800 block">Master Inventory Sheet</span>
                    <span className="text-[10px] text-gray-400 font-medium block">SKUs, quantities, batch details</span>
                  </div>
                </div>
                <button
                  onClick={handleExportInventory}
                  disabled={isInvLoading}
                  className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded transition-colors cursor-pointer"
                  title="Download CSV"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>

              {/* BOM Recipes */}
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-between hover:border-teal-200 transition-colors">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-[#006666]" />
                  <div>
                    <span className="text-xs font-bold text-gray-800 block">BOM Recipe Book</span>
                    <span className="text-[10px] text-gray-400 font-medium block">Assembly details, parts counts</span>
                  </div>
                </div>
                <button
                  onClick={handleExportBoms}
                  disabled={isBomLoading}
                  className="p-1.5 hover:bg-teal-50 text-[#006666] rounded transition-colors cursor-pointer"
                  title="Download CSV"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>

          {/* Guide box */}
          <div className="border border-gray-200 rounded-xl p-5 bg-teal-50/20 shadow-sm flex gap-3 text-xs">
            <HelpCircle className="w-5 h-5 text-[#006666] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-gray-800 block">ABC Valuation Classifications</span>
              <p className="text-gray-500 leading-relaxed font-medium">
                <strong>Class A:</strong> Represents high value assets (top 70% of total inventory value). Requires strict controls.<br/>
                <strong>Class B:</strong> Medium asset value (next 20%).<br/>
                <strong>Class C:</strong> Low asset value (remaining 10%).
              </p>
            </div>
          </div>
        </div>

        {/* Right column: valuation and aging metrics */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* ABC Analysis */}
          <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#006666]" />
                <h3 className="text-xs font-black uppercase text-gray-800 tracking-wider">ABC Classification Report</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                Asset breakdown
              </span>
            </div>

            {isAnalyticsLoading ? (
              <div className="text-center py-8 text-xs text-gray-400 animate-pulse">Calculating classifications...</div>
            ) : !analytics || analytics.abc.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400">No inventory data to analyze.</div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
                    <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider block">Class A (Top 70%)</span>
                    <span className="text-lg font-bold text-gray-700 block mt-1">{analytics.summary.aCount} SKUs</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
                    <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider block">Class B (Mid 20%)</span>
                    <span className="text-lg font-bold text-gray-700 block mt-1">{analytics.summary.bCount} SKUs</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
                    <span className="text-[9px] font-bold text-[#006666] uppercase tracking-wider block">Class C (Low 10%)</span>
                    <span className="text-lg font-bold text-gray-700 block mt-1">{analytics.summary.cCount} SKUs</span>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[9px]">
                        <th className="p-2.5">SKU / Item</th>
                        <th className="p-2.5 text-right">Value (₹)</th>
                        <th className="p-2.5 text-center">Class</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {analytics.abc.slice(0, 5).map((item: any) => (
                        <tr key={item.id} className="hover:bg-gray-50/50">
                          <td className="p-2.5">
                            <span className="font-bold text-gray-800">{item.name}</span>
                            <span className="block text-[9px] text-gray-400 font-mono font-bold mt-0.5">{item.sku}</span>
                          </td>
                          <td className="p-2.5 text-right font-bold text-gray-700">
                            ₹{item.totalVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[8px] font-black uppercase border",
                              item.group === 'A' ? "bg-rose-50 text-rose-600 border-rose-100" :
                              item.group === 'B' ? "bg-amber-50 text-amber-600 border-amber-100" :
                              "bg-[#e3f2f1] text-[#006666] border border-[#006666]/10"
                            )}>
                              Class {item.group}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {analytics.abc.length > 5 && (
                    <div className="bg-gray-50/40 p-2 text-center text-[9px] font-bold text-gray-400 border-t border-gray-200 uppercase tracking-widest">
                      Showing top 5 high-value SKUs
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Aging Widget */}
          <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#006666]" />
                <h3 className="text-xs font-black uppercase text-gray-800 tracking-wider">Inventory Stock Aging Report</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-[#e3f2f1] text-[#006666] border border-[#006666]/10">
                Turnover velocity
              </span>
            </div>

            {isAnalyticsLoading ? (
              <div className="text-center py-8 text-xs text-gray-400 animate-pulse">Analyzing activity history...</div>
            ) : !analytics || analytics.aging.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-400">No transaction logs history.</div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3 font-medium text-xs text-gray-600">
                  
                  {/* Fresh bucket */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-700">Fresh Inventory (0-30 Days)</span>
                      <span className="font-bold text-gray-500">{analytics.summary.freshCount} items</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(analytics.summary.freshCount / analytics.aging.length) * 100}%` }} />
                    </div>
                  </div>

                  {/* Mid bucket */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-700">Slow moving (31-90 Days)</span>
                      <span className="font-bold text-gray-500">{analytics.summary.mediumCount} items</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(analytics.summary.mediumCount / analytics.aging.length) * 100}%` }} />
                    </div>
                  </div>

                  {/* Slow bucket */}
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="font-bold text-gray-700">Stagnant Stock (91+ Days)</span>
                      <span className="font-bold text-rose-500">{analytics.summary.slowCount} items stagnant</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(analytics.summary.slowCount / analytics.aging.length) * 100}%` }} />
                    </div>
                  </div>
                </div>

                {/* Stagnant warning list */}
                {analytics.summary.slowCount > 0 && (
                  <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl flex items-start gap-2.5 text-[11px] text-gray-500 leading-relaxed">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 animate-bounce" />
                    <div>
                      <span className="font-bold text-gray-800 block">Alert: Stagnant inventory detected</span>
                      <span>We detected {analytics.summary.slowCount} items that haven't registered movements in over 90 days. Check warehouse locations to confirm demand velocity.</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
