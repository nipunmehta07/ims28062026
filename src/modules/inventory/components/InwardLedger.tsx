"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getInwardHistory, deleteInwardAction } from "@/app/actions";
import StockInwardForm from "./forms/StockInwardForm";
import Drawer from "@/components/ui/Drawer";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from "@/components/ui/Table";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

export default function InwardLedger() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const { data: history = [], isLoading } = useQuery({
    queryKey: ["inwardHistory"],
    queryFn: () => getInwardHistory(),
  });

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["inwardHistory"] });
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
  };
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState<any>(null);

  const filteredHistory = useMemo(() => {
    return history.filter((log: any) => {
      const search = searchTerm.toLowerCase();
      return (
        log.item.name.toLowerCase().includes(search) ||
        log.item.sku.toLowerCase().includes(search) ||
        log.reason.toLowerCase().includes(search) ||
        log.changeQty.toString().includes(search) ||
        new Date(log.createdAt).toLocaleDateString('en-IN').includes(search)
      );
    });
  }, [history, searchTerm]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredHistory.length && filteredHistory.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredHistory.map((log: any) => log.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} records? This will revert stock for all of them.`)) return;
    
    const t = toast.loading(`Reverting stock for ${selectedIds.length} records...`);
    try {
      await Promise.all(selectedIds.map(id => deleteInwardAction(id)));
      toast.success("Bulk deletion successful", { id: t });
      setSelectedIds([]);
      refreshData();
    } catch (error: any) {
      toast.error("Failed to complete bulk deletion", { id: t });
      refreshData();
    }
  };

  const handleDelete = async (transactionId: string) => {
    if (!confirm("Are you sure? Deleting this will also revert the item's stock level.")) return;
    
    const t = toast.loading("Reverting stock and deleting record...");
    try {
      await deleteInwardAction(transactionId);
      toast.success("Record deleted and stock reverted.", { id: t });
      refreshData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete record.", { id: t });
    }
  };

  const totalInwardThisMonth = useMemo(() => {
    const now = new Date();
    return history
      .filter((log: any) => {
        const d = new Date(log.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum: number, log: any) => sum + log.changeQty, 0);
  }, [history]);

  if (isLoading && history.length === 0) {
    return <div className="p-20 text-center animate-pulse text-xs font-bold uppercase tracking-widest text-text-tertiary">Syncing Ledger...</div>;
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      {/* 1. HEADER & KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="glass-card glow-card rounded-2xl p-5 relative overflow-hidden flex flex-col justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-success/5 via-transparent to-transparent opacity-50" />
          <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest relative z-10">Inward Volume (This Month)</p>
          <p className="text-3xl font-black text-text-primary mt-2 stat-number relative z-10">
            {totalInwardThisMonth.toLocaleString()} <span className="text-xs text-text-secondary font-bold uppercase tracking-normal">Units</span>
          </p>
        </div>
        
        <div className="sm:col-span-2 lg:col-span-2 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <input 
              type="text" 
              placeholder="Search Reference, SKU or Product..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-3 bg-bg-secondary border border-border rounded-xl text-xs font-bold outline-none transition-all placeholder:text-text-tertiary focus:border-accent text-text-primary"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary">🔍</div>
          </div>
          <Button 
            variant="primary"
            size="md"
            onClick={() => { setEditingLog(null); setShowForm(true); }}
            className="w-full sm:w-auto px-5 py-3 text-xs font-bold uppercase tracking-wider bg-accent hover:bg-accent-hover text-white rounded-xl shadow-lg shadow-accent/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            + Record Shipment
          </Button>
        </div>
      </div>

      {/* FLOATING BULK ACTIONS BAR */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-bg-secondary border border-border text-text-primary px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-10">
          <p className="text-xs font-bold uppercase tracking-wider">{selectedIds.length} Records Selected</p>
          <div className="h-5 w-[1px] bg-border"></div>
          <div className="flex gap-4">
            <button onClick={handleBulkDelete} className="text-xs font-bold text-error hover:underline uppercase tracking-wider">Delete Selection</button>
            <button onClick={() => setSelectedIds([])} className="text-xs font-bold text-text-secondary hover:underline uppercase tracking-wider">Cancel</button>
          </div>
        </div>
      )}

      {/* 2. THE MASTER LEDGER TABLE */}
      <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-tertiary/50">
                <th className="w-10 px-4 py-3">
                  {isAdmin && (
                    <input 
                      type="checkbox" 
                      className="rounded bg-bg-tertiary border-border cursor-pointer accent-accent"
                      checked={selectedIds.length === filteredHistory.length && filteredHistory.length > 0}
                      onChange={toggleSelectAll}
                    />
                  )}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Date Arrived</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Reference</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Batch / Lot</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Product Specification</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">Qty Added</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Notes</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-text-secondary text-xs font-bold uppercase tracking-widest">
                    No matching records found
                  </td>
                </tr>
              ) : (
                filteredHistory.map((log: any) => {
                  const isSelected = selectedIds.includes(log.id);
                  return (
                    <tr 
                      key={log.id} 
                      className={cn(
                        "border-b border-border/50 transition-colors group",
                        isSelected ? "bg-accent/5" : "hover:bg-bg-hover"
                      )}
                    >
                      <td className="px-4 py-3">
                        {isAdmin && (
                          <input 
                            type="checkbox" 
                            className="rounded bg-bg-tertiary border-border cursor-pointer accent-accent"
                            checked={isSelected}
                            onChange={() => toggleSelectItem(log.id)}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-text-primary font-medium" onClick={() => toggleSelectItem(log.id)}>
                        {new Date(log.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3" onClick={() => toggleSelectItem(log.id)}>
                        <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 bg-bg-tertiary border border-border text-text-secondary rounded uppercase tracking-wider">
                          {log.reason.split('Inward: ')[1]?.split(' (')[0] || log.reason}
                        </span>
                      </td>
                      <td className="px-4 py-3" onClick={() => toggleSelectItem(log.id)}>
                        {log.batchNumber ? (
                          <span className="inline-flex items-center text-[9px] font-mono font-bold bg-accent/10 border border-accent/20 text-accent px-2 py-0.5 rounded">
                            {log.batchNumber}
                          </span>
                        ) : (
                          <span className="text-text-tertiary text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3" onClick={() => toggleSelectItem(log.id)}>
                        <div className="text-xs font-bold text-text-primary">{log.item.name}</div>
                        <div className="text-[10px] font-mono text-text-tertiary mt-0.5">{log.item.sku}</div>
                      </td>
                      <td className="px-4 py-3 text-right" onClick={() => toggleSelectItem(log.id)}>
                        <div className="text-sm font-black text-success">+{log.changeQty}</div>
                        <div className="text-[9px] font-bold text-text-tertiary uppercase">Total: {log.newTotalQty} {log.item.unit}</div>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3 max-w-[200px]" onClick={() => toggleSelectItem(log.id)}>
                        <p className="text-xs text-text-secondary italic truncate" title={log.reason.includes('(') ? log.reason.split('(')[1].replace(')', '') : ''}>
                          {log.reason.includes('(') ? log.reason.split('(')[1].replace(')', '') : '—'}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isAdmin && (
                          <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => { setEditingLog(log); setShowForm(true); }}
                              className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 hover:bg-accent/20 rounded transition-colors"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(log.id)}
                              className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-error bg-error/10 hover:bg-error/20 rounded transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. RECORD / EDIT DRAWER */}
      <Drawer 
        isOpen={showForm} 
        onClose={() => { setShowForm(false); setEditingLog(null); }} 
        title={editingLog ? "Edit Inward Record" : "Record Incoming Stock"}
      >
        <StockInwardForm 
          initialData={editingLog}
          onCancel={() => { setShowForm(false); setEditingLog(null); }} 
          onSuccess={() => {
            refreshData();
            setShowForm(false);
            setEditingLog(null);
          }} 
        />
      </Drawer>

    </div>
  );
}
