"use client";

import React, { useState, useMemo } from "react";
// 1. Import TanStack Query hooks
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getInwardHistory, deleteInwardAction } from "../actions";
import StockInwardForm from "./forms/StockInwardForm";
import Drawer from "./ui/Drawer";
import toast from "react-hot-toast";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from "./ui/Table";

export default function InwardLedger() {
  const queryClient = useQueryClient(); // Helper to refresh memory

  // 2. DATA FETCHING: Replaces useEffect & useState
  const { data: history = [], isLoading } = useQuery({
    queryKey: ["inwardHistory"], // Unique key for Ledger memory
    queryFn: () => getInwardHistory(),
  });

  // 3. REFRESH LOGIC: Uses the queryClient
  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["inwardHistory"] });
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
  };
  
  // --- MULTI-SELECT STATE ---
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // UI States
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingLog, setEditingLog] = useState<any>(null);

  // --- FILTERING & STATS ---
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

  // --- SELECTION HANDLERS ---
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

  // --- BULK DELETE HANDLER ---
  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} records? This will revert stock for all of them.`)) return;
    
    const t = toast.loading(`Reverting stock for ${selectedIds.length} records...`);
    try {
      await Promise.all(selectedIds.map(id => deleteInwardAction(id)));
      toast.success("Bulk deletion successful", { id: t });
      setSelectedIds([]);
      refreshData(); // Trigger memory update
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
      refreshData(); // Trigger memory update
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

  // Only show loading on the very first visit
  if (isLoading && history.length === 0) {
    return <div className="p-20 text-center animate-pulse text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Syncing Ledger...</div>;
  }

  return (
    <div className="flex flex-col gap-6 font-sans animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      {/* 1. HEADER & KPI (Using 'history' from cache) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card variant="default" padding="md" radius="lg" className="flex flex-col justify-center">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Inward Volume (This Month)</p>
          <p className="text-3xl font-black text-gray-900 mt-1">
            {totalInwardThisMonth.toLocaleString()} <span className="text-[10px] text-gray-300 uppercase">Units</span>
          </p>
        </Card>
        
        <Card variant="default" padding="md" radius="lg" className="sm:col-span-2 lg:col-span-2 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <input 
              type="text" 
              placeholder="Search Reference, SKU or Product..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-transparent focus:border-gray-200 rounded-xl text-[12px] font-bold uppercase tracking-tight outline-none transition-all placeholder:text-gray-300"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">🔍</div>
          </div>
          <Button 
            variant="primary"
            size="md"
            onClick={() => { setEditingLog(null); setShowForm(true); }}
            className="w-full sm:w-auto"
          >
            + Record Shipment
          </Button>
        </Card>
      </div>

      {/* FLOATING BULK ACTIONS BAR */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-black text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-8 animate-in slide-in-from-bottom-10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em]">{selectedIds.length} Records Selected</p>
          <div className="h-4 w-[1px] bg-gray-700"></div>
          <div className="flex gap-6">
            <Button variant="ghost" size="sm" onClick={handleBulkDelete} className="text-rose-500 hover:text-rose-400">Delete Selection</Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} className="text-gray-500">Cancel</Button>
          </div>
        </div>
      )}

      {/* 2. THE MASTER LEDGER TABLE */}
      <Card variant="default" padding="none" radius="lg" className="border-t-4 border-t-black">
        <Table minWidth="950px">
          <TableHeader>
            <TableRow hover={false} className="bg-gradient-to-r from-emerald-50/50 via-white to-teal-50/50 dark:from-emerald-950/30 dark:via-zinc-900 dark:to-teal-950/30">
              <TableHead className="w-10">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-gray-300 accent-black cursor-pointer"
                  checked={selectedIds.length === filteredHistory.length && filteredHistory.length > 0}
                  onChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Date Arrived</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Product Specification</TableHead>
              <TableHead align="right">Qty Added</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredHistory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-24 text-center text-gray-300 text-[11px] font-bold uppercase tracking-widest">No matching records found</TableCell>
              </TableRow>
            ) : (
              filteredHistory.map((log: any) => {
                const isSelected = selectedIds.includes(log.id);
                return (
                  <TableRow key={log.id} selected={isSelected}>
                    <TableCell>
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-300 accent-black cursor-pointer"
                        checked={isSelected}
                        onChange={() => toggleSelectItem(log.id)}
                      />
                    </TableCell>
                    <TableCell onClick={() => toggleSelectItem(log.id)}>
                      {new Date(log.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell onClick={() => toggleSelectItem(log.id)}>
                      <span className="text-[10px] font-black px-2 py-1 bg-gray-100 text-gray-500 rounded uppercase tracking-widest border border-gray-200">
                        {log.reason.split('Inward: ')[1]?.split(' (')[0] || log.reason}
                      </span>
                    </TableCell>
                    <TableCell onClick={() => toggleSelectItem(log.id)}>
                      <div className="text-[13px] font-black text-gray-900 uppercase tracking-tight">{log.item.name}</div>
                      <div className="text-[9px] font-mono font-bold text-gray-400 mt-0.5">{log.item.sku}</div>
                    </TableCell>
                    <TableCell align="right" onClick={() => toggleSelectItem(log.id)}>
                      <div className="text-[15px] font-black text-emerald-600">+{log.changeQty}</div>
                      <div className="text-[9px] font-bold text-gray-400 uppercase">Total: {log.newTotalQty} {log.item.unit}</div>
                    </TableCell>
                    <TableCell className="max-w-[200px]" onClick={() => toggleSelectItem(log.id)}>
                      <p className="text-[11px] text-gray-400 italic truncate" title={log.reason.includes('(') ? log.reason.split('(')[1].replace(')', '') : ''}>
                        {log.reason.includes('(') ? log.reason.split('(')[1].replace(')', '') : '—'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={() => { setEditingLog(log); setShowForm(true); }}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(log.id)} className="text-rose-400 hover:text-rose-600">
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>

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
            refreshData(); // Clear memory after edit
            setShowForm(false);
            setEditingLog(null);
          }} 
        />
      </Drawer>

    </div>
  );
}