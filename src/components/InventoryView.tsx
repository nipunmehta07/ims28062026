"use client";

import React, { useState, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getInventory, getItemHistory, deleteItemAction, bulkAddItemsAction } from "@/app/actions";
import AddItemForm from "./forms/AddItemForm";
import Drawer from "./ui/Drawer";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableFooter } from "./ui/Table";

export default function InventoryView() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  // --- ROLE CHECK ---
  const isAdmin = session?.user?.role === "ADMIN";

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => getInventory(),
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
    queryClient.invalidateQueries({ queryKey: ["inwardHistory"] });
  };

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.sku.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [inventory, searchQuery, categoryFilter]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredInventory.length && filteredInventory.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInventory.map(item => item.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (!isAdmin) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} items?`)) return;
    const t = toast.loading(`Deleting ${selectedIds.length} items...`);
    try {
      await Promise.all(selectedIds.map(id => deleteItemAction(id)));
      toast.success("Bulk Deletion Successful", { id: t });
      setSelectedIds([]);
      refreshData();
    } catch (error: any) {
      toast.error("Some items are in use and cannot be deleted.", { id: t });
      refreshData();
    }
  };

  const handleBulkExport = () => {
    if (!isAdmin) return;
    const itemsToExport = inventory.filter(item => selectedIds.includes(item.id));
    generateCSV(itemsToExport);
    toast.success(`Exporting ${itemsToExport.length} selected items...`);
  };

  const generateCSV = (dataList: any[]) => {
    const headers = ["Product Name", "SKU", "Category", "Unit", "Unit Cost", "Stock"];
    const csvRows = [headers.join(",")];
    dataList.forEach(item => {
      const row = [
        `"${item.name.replace(/"/g, '""')}"`,
        `"${item.sku}"`,
        `"${item.category}"`,
        `"${item.unit}"`,
        item.unitCost,
        item.quantityOnHand
      ];
      csvRows.push(row.join(","));
    });
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", `Zoie_Export_${new Date().toISOString().split('T')[0]}.csv`);
    a.click();
  };

  const handleViewHistory = async (item: any) => {
    setSelectedItem(item);
    setIsAuditDrawerOpen(true);
    const logs = await getItemHistory(item.id);
    setHistoryLogs(logs);
  };

  const handleDelete = async (itemId: string) => {
    if (!isAdmin) return;
    if (!confirm("Are you sure you want to delete this item?")) return;
    const t = toast.loading("Deleting item...");
    try {
      await deleteItemAction(itemId);
      toast.success("Item deleted successfully.", { id: t });
      refreshData();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete item.", { id: t });
    }
  };

  const handleExportCSV = () => {
    if (!isAdmin) return;
    generateCSV(inventory);
    toast.success("Catalog Exported!");
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const lines = text.split("\n").filter(line => line.trim() !== "");
      if (lines.length < 2) return toast.error("CSV file is empty.");
      const itemsToAdd = [];
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val.replace(/(^"|"$)/g, '').trim());
        if (row.length >= 6 && row[1]) {
          const rawDate = row[6];
          const parsedDate = rawDate ? new Date(rawDate) : new Date();
          const finalDate = isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
          itemsToAdd.push({
            name: row[0],
            sku: row[1],
            category: row[2] || 'Component',
            unit: row[3] || 'pcs',
            unitCost: parseFloat(row[4]) || 0,
            initialQty: parseInt(row[5]) || 0,
            openingStockDate: finalDate
          });
        }
      }
      if (itemsToAdd.length === 0) return toast.error("No valid data found.");
      const t = toast.loading(`Importing ${itemsToAdd.length} items...`);
      try {
        const added = await bulkAddItemsAction(itemsToAdd);
        toast.success(`Successfully imported ${added} items!`, { id: t });
        refreshData();
      } catch (error: any) {
        toast.error(error.message || "Import failed.", { id: t });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (isLoading && inventory.length === 0) {
    return <div className="p-20 text-center animate-pulse text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Loading Master Inventory...</div>;
  }

  const lowStockCount = inventory.filter(item => item.quantityOnHand < 20).length;
  const assetValue = inventory.reduce((acc, item) => acc + (item.quantityOnHand * item.unitCost), 0);

  return (
    <div className="flex flex-col gap-8 font-sans pb-24 md:pb-0 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      
      {/* 1. STATS SECTION: Conditional rendering for Asset Value */}
      <div className={`grid gap-4 md:gap-6 ${isAdmin ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 sm:grid-cols-2"}`}>
        {isAdmin && (
          <Card variant="default" padding="lg" radius="lg" className="transition-transform hover:-translate-y-1 duration-300">
            <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Inventory Asset Value</p>
            <p className="text-2xl md:text-3xl font-black text-gray-900 mt-2 tracking-tighter italic">₹{assetValue.toLocaleString('en-IN')}</p>
          </Card>
        )}
        
        <Card variant="default" padding="lg" radius="lg" className="transition-transform hover:-translate-y-1 duration-300">
          <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Low Stock Critical</p>
          <p className={`text-2xl md:text-3xl font-black mt-2 tracking-tighter ${lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-500'}`}>
            {lowStockCount} <span className="text-[10px] uppercase font-bold text-gray-300">SKUs</span>
          </p>
        </Card>

        <Card variant="dark" padding="lg" radius="lg" className="flex flex-col justify-center transition-transform hover:-translate-y-1 duration-300 relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Active Catalog</p>
              <p className="text-2xl md:text-3xl font-black text-white mt-2 tracking-tighter">{inventory.length}</p>
            </div>
            <Button 
              variant="secondary"
              size="sm"
              onClick={() => { setEditingItem(null); setShowAddForm(true); }}
            >
              + New Item
            </Button>
          </div>
          <div className="absolute -right-6 -bottom-6 text-9xl text-white/5 font-black italic pointer-events-none tracking-tighter">Z</div>
        </Card>
      </div>

      {/* --- FLOATING BULK ACTIONS BAR (Admin only for Delete/Export) --- */}
      {selectedIds.length > 0 && isAdmin && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-black text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-8 animate-in slide-in-from-bottom-10">
          <p className="text-[10px] font-black uppercase tracking-[0.3em]">{selectedIds.length} Items Selected</p>
          <div className="h-4 w-[1px] bg-gray-700"></div>
          <div className="flex gap-6">
            <Button variant="ghost" size="sm" onClick={handleBulkExport} className="hover:text-gray-400">Export Selected</Button>
            <Button variant="ghost" size="sm" onClick={handleBulkDelete} className="text-rose-500 hover:text-rose-400">Delete All</Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} className="text-gray-500">Cancel</Button>
          </div>
        </div>
      )}

      {/* 2. TOOLBAR: Hide Import/Export for Staff */}
      <Card variant="default" padding="md" radius="lg" className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto items-center">
          <div className="relative w-full sm:w-80">
            <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input 
              type="text" 
              placeholder="Search SKUs or Products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent focus:border-gray-200 rounded-xl text-[12px] font-bold outline-none transition-all placeholder:text-gray-400 uppercase tracking-wide"
            />
          </div>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-3 bg-gray-50 border border-transparent focus:border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
          >
            {["All", ...Array.from(new Set(inventory.map(item => item.category)))].map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100">
            <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImportCSV} className="hidden" />
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              ↓ Import
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExportCSV}>
              ↑ Export All
            </Button>
          </div>
        )}
      </Card>

      {/* 3. MASTER TABLE */}
      <Card variant="default" padding="none" radius="lg" className="border-t-4 border-t-black">
        <Table minWidth="900px">
          <TableHeader>
            <TableRow hover={false} className="bg-gradient-to-r from-emerald-50/50 via-white to-teal-50/50 dark:from-emerald-950/30 dark:via-zinc-900 dark:to-teal-950/30">
              <TableHead align="center" className="w-12">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-gray-300 accent-black cursor-pointer"
                  checked={selectedIds.length === filteredInventory.length && filteredInventory.length > 0}
                  onChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Product Specification</TableHead>
              <TableHead align="center">Category</TableHead>
              <TableHead align="right">Available Stock</TableHead>
              <TableHead align="right">Unit Price</TableHead>
              <TableHead align="center" className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-24 text-center text-gray-300 text-[11px] font-bold uppercase tracking-widest">No Items Found</TableCell>
              </TableRow>
            ) : (
              filteredInventory.map((item, index) => {
                const isSelected = selectedIds.includes(item.id);
                const isLowStock = item.quantityOnHand < 20;
                return (
                  <TableRow 
                    key={item.id} 
                    selected={isSelected}
                    className="group"
                  >
                    <TableCell align="center" className="w-12">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-300 accent-black cursor-pointer"
                        checked={isSelected}
                        onChange={() => toggleSelectItem(item.id)}
                      />
                    </TableCell>
                    <TableCell onClick={() => toggleSelectItem(item.id)}>
                      <div className="text-[13px] font-black text-gray-900 uppercase tracking-tight">{item.name}</div>
                      <div className="text-[10px] font-mono font-bold text-gray-400 mt-0.5">{item.sku}</div>
                    </TableCell>
                    
                    <TableCell align="center" onClick={() => toggleSelectItem(item.id)}>
                      <Badge variant={item.category === 'Finished Good' ? "neutral" : "default"} size="md">
                        {item.category}
                      </Badge>
                    </TableCell>

                    <TableCell align="right" onClick={() => toggleSelectItem(item.id)}>
                      <div className="text-[15px] font-black text-gray-900">{Number(item.quantityOnHand).toFixed(2)} <span className="text-[9px] font-bold text-gray-400 uppercase ml-1">{item.unit}</span></div>
                      <Badge variant={isLowStock ? "danger" : "success"} size="sm" dot>
                        {isLowStock ? 'Critical' : 'Balanced'}
                      </Badge>
                    </TableCell>

                    <TableCell align="right" className="text-[14px] font-black tracking-tight text-gray-900">₹{item.unitCost.toLocaleString('en-IN')}</TableCell>

                    <TableCell align="center" className="w-24">
                      <div className="flex items-center justify-center gap-2">
                        {isAdmin && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedItem(null); setEditingItem(item); setShowAddForm(true); }}>Edit</Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)} className="text-rose-400 hover:text-rose-600">Delete</Button>
                          </>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleViewHistory(item)} className="bg-white border border-gray-200 shadow-sm">Audit</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* 4. DRAWERS: Protected Add/Edit */}
      
      <Drawer isOpen={showAddForm} onClose={() => { setShowAddForm(false); setEditingItem(null); }} title={editingItem ? "Edit Inventory Item" : "Inventory Registry"}>
        <AddItemForm 
          initialData={editingItem} 
          onCancel={() => { setShowAddForm(false); setEditingItem(null); }} 
          onSuccess={() => { 
            refreshData();
            setShowAddForm(false); 
            setEditingItem(null); 
          }} 
        />
      </Drawer>
      

      <Drawer isOpen={isAuditDrawerOpen} onClose={() => { setIsAuditDrawerOpen(false); setSelectedItem(null); }} title={selectedItem ? `Audit: ${selectedItem.name}` : "Audit Log"}>
        <div className="space-y-4">
          {selectedItem ? (
            <>
              <div className="mb-6 pb-4 border-b border-gray-100 text-left">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Stock</p>
                 <p className="text-3xl font-black mt-1 italic">{Number(selectedItem.quantityOnHand).toFixed(2)} <span className="text-sm text-gray-400 uppercase">{selectedItem.unit}</span></p>
              </div>
              <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 text-left">Transaction History</h4>
              {historyLogs.length === 0 ? (
                <p className="text-center text-gray-400 text-[10px] font-bold py-8">No transaction history found</p>
              ) : (
                historyLogs.map(log => (
                  <div key={log.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center transition-colors">
                    <div className="text-left">
                      <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{log.reason}</p>
                      <p className="text-[10px] font-bold text-gray-400 mt-1">{new Date(log.createdAt).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-[14px] font-black font-mono ${log.changeQty > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{log.changeQty > 0 ? '+' : ''}{Number(log.changeQty).toFixed(2)}</div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">Bal: {Number(log.newTotalQty).toFixed(2)}</p>
                    </div>
                  </div>
                ))
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p className="text-[10px] font-bold">Select an item to view audit history</p>
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
}