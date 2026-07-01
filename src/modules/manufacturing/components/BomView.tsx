// src/modules/manufacturing/components/BomView.tsx
"use client";

import React, { useState, useRef, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { 
  getBoms, 
  getInventory, 
  createBomAction, 
  produceBomAction, 
  updateBomAction, 
  deleteBomAction, 
  getProductionLogs,
  deleteProductionLogAction,
  bulkAddBomsAction
} from "@/app/actions";
import Papa from "papaparse";
import SearchableSelect from "@/components/ui/SearchableSelect";
import Drawer from "@/components/ui/Drawer";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { 
  ChevronDown, 
  ChevronUp, 
  Download, 
  Upload, 
  Search, 
  Trash2, 
  Plus, 
  Hammer, 
  Package,
  XCircle,
  Calendar
} from "lucide-react";

export default function BomView() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  // --- VIEW STATE ---
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'history'>('list');
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // --- DATA FETCHING ---
  const { data: boms = [], isLoading: isBomLoading } = useQuery({
    queryKey: ["boms"],
    queryFn: () => getBoms(),
  });

  const { data: inventory = [], isLoading: isInvLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => getInventory(),
  });

  const { data: logs = [], isLoading: isLogsLoading, refetch: refetchLogs } = useQuery({
    queryKey: ["productionLogs"],
    queryFn: () => getProductionLogs(),
    enabled: activeSubTab === 'history'
  });

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["boms"] });
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
    queryClient.invalidateQueries({ queryKey: ["productionLogs"] });
    if (activeSubTab === 'history') refetchLogs();
  };

  // --- FILTERED DATA (Live Search) ---
  const filteredBoms = useMemo(() => {
    return boms.filter((bom: any) => 
      bom.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bom.item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bom.item.sku && bom.item.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [boms, searchQuery]);

  // --- IMPORT / EXPORT LOGIC ---
  const handleExportCSV = () => {
    if (!isAdmin) return;
    if (boms.length === 0) return toast.error("No recipes to export");
    const headers = ["Assembly Name", "Target Product SKU", "Component SKU", "Quantity"];
    const rows = boms.flatMap((bom: any) => 
      bom.components.map((c: any) => [
        bom.name,
        bom.item.sku || bom.item.name,
        c.componentItem.sku || c.componentItem.name,
        c.quantity
      ])
    );
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `BOM_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    if (isAdmin) fileInputRef.current?.click();
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const t = toast.loading("Processing Recipes...");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const groupedData = results.data.reduce((acc: Record<string, any>, row: any) => {
            const name = row["Assembly Name"];
            const targetSku = String(row["Target Product SKU"]).trim();
            const compSku = String(row["Component SKU"]).trim();
            const qty = parseFloat(row["Quantity"]);

            if (!name || !targetSku || !compSku) return acc;

            if (!acc[name]) {
              acc[name] = { name, targetSku, components: [] };
            }
            acc[name].components.push({ sku: compSku, quantity: qty });
            return acc;
          }, {});

          const finalPayload = Object.values(groupedData);

          if (finalPayload.length === 0) {
            throw new Error("No valid data found. Please check your CSV headers.");
          }

          const addedCount = await bulkAddBomsAction(finalPayload as any);
          toast.success(`Successfully imported ${addedCount} recipes!`, { id: t });
          refreshData();
        } catch (err: any) {
          toast.error(err.message || "Import failed", { id: t });
        } finally {
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      }
    });
  };

  // --- FORM & MODAL STATE ---
  const [showForm, setShowForm] = useState(false);
  const [editingBom, setEditingBom] = useState<any>(null);
  const [assemblyName, setAssemblyName] = useState("");
  const [finishedGoodId, setFinishedGoodId] = useState("");
  const [components, setComponents] = useState([{ itemId: "", quantity: 1 }]);

  const [producingBom, setProducingBom] = useState<any>(null);
  const [buildQty, setBuildQty] = useState(1);
  const [buildDate, setBuildDate] = useState(new Date().toISOString().split('T')[0]);
  const [buildNotes, setBuildNotes] = useState("");

  const calculateMaxBuild = (bom: any) => {
    if (!bom || !bom.components || inventory.length === 0) return 0;
    const limits = bom.components.map((c: any) => {
      const live = inventory.find((inv: any) => inv.id === c.componentItemId);
      const available = live ? live.quantityOnHand : 0;
      return Math.floor(available / c.quantity);
    });
    return Math.min(...limits);
  };

  // --- ACTION HANDLERS ---
  const handleProduceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!producingBom || buildQty <= 0) return;
    const t = toast.loading(`Assembling ${buildQty} units...`);
    try {
      await produceBomAction({ 
        bomId: producingBom.id, 
        quantityToBuild: buildQty,
        buildDate: buildDate,
        notes: buildNotes
      });
      toast.success("Production Complete!", { id: t });
      setProducingBom(null);
      refreshData();
    } catch (err: any) {
      toast.error(err.message, { id: t });
    }
  };

  const handleDeleteBom = async (e: React.MouseEvent, bomId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this recipe? This cannot be undone.")) return;
    const t = toast.loading("Deleting Recipe...");
    try {
      await deleteBomAction(bomId);
      toast.success("Recipe Deleted", { id: t });
      refreshData();
    } catch (err: any) {
      toast.error(err.message, { id: t });
    }
  };

  const handleDeleteLog = async (logId: string) => {
    if (!confirm("Reverse this build?")) return;
    const t = toast.loading("Reversing...");
    try {
      await deleteProductionLogAction(logId);
      toast.success("Build Reversed", { id: t });
      refreshData();
    } catch (err: any) {
      toast.error(err.message, { id: t });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = toast.loading("Saving...");
    try {
      if (editingBom) {
        await updateBomAction(editingBom.id, { name: assemblyName, itemId: finishedGoodId, components });
      } else {
        await createBomAction({ name: assemblyName, itemId: finishedGoodId, components });
      }
      toast.success("Saved!", { id: t });
      setShowForm(false);
      refreshData();
    } catch (err: any) {
      toast.error(err.message, { id: t });
    }
  };

  const openCreateForm = () => {
    setEditingBom(null);
    setAssemblyName("");
    setFinishedGoodId("");
    setComponents([{ itemId: "", quantity: 1 }]);
    setShowForm(true);
  };

  const openEditForm = (bom: any) => {
    setEditingBom(bom);
    setAssemblyName(bom.name);
    setFinishedGoodId(bom.itemId);
    setComponents(bom.components.map((c: any) => ({ itemId: c.componentItemId, quantity: c.quantity })));
    setShowForm(true);
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  };

  if ((isBomLoading || isInvLoading) && boms.length === 0) {
    return <div className="p-20 text-center animate-pulse text-xs font-bold uppercase tracking-widest text-gray-400">Loading Assembly Lines...</div>;
  }

  return (
    <div className="space-y-6 font-sans text-gray-800 text-left">
      
      {/* TOOLBAR & HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
        
        {/* Toggle between Definitions & History */}
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 p-1.5 rounded-xl border border-gray-200 text-[10px] font-bold">
            <button 
              onClick={() => setActiveSubTab('list')} 
              className={cn("px-3.5 py-1.5 rounded-lg transition-all", activeSubTab === 'list' ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700")}
            >
              Definitions
            </button>
            <button 
              onClick={() => setActiveSubTab('history')} 
              className={cn("px-3.5 py-1.5 rounded-lg transition-all", activeSubTab === 'history' ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700")}
            >
              History
            </button>
          </div>
          
          <h2 className="text-lg font-black text-gray-800 font-display uppercase tracking-wider">
            {activeSubTab === 'list' ? "BOM Assembly Recipes" : "Recipe Build Logs"}
          </h2>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2">
          <input type="file" ref={fileInputRef} onChange={handleFileImport} className="hidden" accept=".csv" />
          
          {isAdmin && (
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
              <button 
                onClick={handleImportClick} 
                className="p-2 hover:bg-gray-50 border-r border-gray-150 text-gray-500 hover:text-gray-700 transition-colors"
                title="Import Recipes (.csv)"
              >
                <Upload className="w-4 h-4" />
              </button>
              <button 
                onClick={handleExportCSV} 
                className="p-2 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
                title="Export Recipes (.csv)"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          )}

          {activeSubTab === 'list' && (
            <button 
              onClick={openCreateForm} 
              className="px-4 py-2 bg-[#6a4a63] hover:bg-[#5c3e55] text-white text-xs font-bold uppercase rounded-lg shadow-sm cursor-pointer"
            >
              + New Recipe
            </button>
          )}
        </div>
      </div>

      {/* SEARCH BAR (Definitions only) */}
      {activeSubTab === 'list' && (
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search existing assemblies..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#6a4a63] bg-white font-medium"
          />
        </div>
      )}

      {/* TABLES SECTION */}
      {activeSubTab === 'list' ? (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px] bg-gray-50">
                  <th className="p-3">Assembly Recipe</th>
                  <th className="p-3">Target Product</th>
                  <th className="p-3">Components Count</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBoms.map((bom: any) => (
                  <React.Fragment key={bom.id}>
                    <tr onClick={() => toggleRow(bom.id)} className="hover:bg-gray-50/50 cursor-pointer transition-colors">
                      <td className="p-3">
                        <div className="text-[13px] font-bold text-gray-800 flex items-center gap-2">
                          {expandedRows.includes(bom.id) ? <ChevronUp size={14} className="text-gray-700" /> : <ChevronDown size={14} className="text-gray-400" />}
                          {bom.name}
                        </div>
                      </td>
                      <td className="p-3 font-medium text-gray-600">{bom.item.name}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e3f2f1] text-[#006666] border border-[#006666]/10">
                          {bom.components?.length || 0} Ingredients
                        </span>
                      </td>
                      <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex gap-2 justify-end items-center">
                          <button 
                            onClick={() => openEditForm(bom)}
                            className="px-2 py-1 border border-gray-200 rounded text-gray-500 hover:bg-gray-50 transition-colors font-bold uppercase text-[9px]"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={(e) => handleDeleteBom(e, bom.id)} 
                            className="px-2 py-1 border border-gray-200 rounded text-rose-500 hover:bg-rose-50 transition-colors font-bold uppercase text-[9px]"
                          >
                            Delete
                          </button>
                          <button 
                            onClick={() => setProducingBom(bom)} 
                            className="px-3 py-1 bg-[#6a4a63] hover:bg-[#5c3e55] text-white rounded text-[9px] font-bold uppercase tracking-wider transition-colors shadow-sm"
                          >
                            Run Assembly
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded recipe parts breakdown */}
                    {expandedRows.includes(bom.id) && (
                      <tr className="bg-gray-50/40">
                        <td colSpan={4} className="p-5 text-left pl-8 border-t border-b border-gray-150">
                          <div className="space-y-3">
                            <p className="text-[10px] font-bold text-[#006666] uppercase tracking-wider">
                              Recipe Bill of Materials:
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
                              {bom.components.map((c: any) => {
                                const live = inventory.find((inv: any) => inv.id === c.componentItemId);
                                const available = live?.quantityOnHand || 0;
                                const required = c.quantity;
                                const hasEnough = available >= required;

                                return (
                                  <div key={c.id} className="border border-gray-200 rounded-lg p-3 bg-white shadow-sm flex items-center justify-between gap-4">
                                    <div>
                                      <span className="text-xs font-bold text-gray-800 block">{c.componentItem.name}</span>
                                      <span className="text-[9px] text-gray-400 font-mono block">
                                        SKU: {c.componentItem.sku} · Requires: {required.toFixed(2)} {c.componentItem.unit}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 font-bold text-[10px]">
                                      <span className="text-gray-500">Stock: {available.toFixed(2)}</span>
                                      <span className={cn(
                                        "px-2 py-0.5 rounded text-[8px] font-black uppercase border",
                                        hasEnough ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                                      )}>
                                        {hasEnough ? "Ready" : "Shortage"}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* History lists */
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px] bg-gray-50">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Assembly Name</th>
                  <th className="p-3">Manufactured Volume</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLogsLoading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-400">Loading logs...</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-400">No assembly records logged yet.</td>
                  </tr>
                ) : (
                  logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-gray-50/50">
                      <td className="p-3 text-gray-500 font-medium">
                        {new Date(log.createdAt).toLocaleDateString('en-IN')}
                      </td>
                      <td className="p-3 font-bold text-gray-800">
                        {log.bomName || log.bom?.name}
                      </td>
                      <td className="p-3 font-bold text-emerald-600">
                        +{log.quantityBuilt} units
                      </td>
                      <td className="p-3 text-right">
                        <button 
                          onClick={() => handleDeleteLog(log.id)}
                          className="px-2 py-1 border border-gray-200 rounded text-rose-500 hover:bg-rose-50 transition-colors font-bold uppercase text-[9px] cursor-pointer"
                        >
                          Reverse
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          RUN PRODUCTION OVERLAY MODAL
          ========================================== */}
      {producingBom && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200 text-xs font-medium text-gray-600 space-y-5 text-left">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-black uppercase text-gray-800 tracking-wider">Run Production Assembly</h3>
                <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">Target Good: {producingBom.item.name}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Max Run Capacity</span>
                <span className={cn(
                  "text-lg font-black",
                  calculateMaxBuild(producingBom) > 0 ? "text-emerald-600" : "text-rose-600"
                )}>
                  {calculateMaxBuild(producingBom)} Units
                </span>
              </div>
            </div>

            <form onSubmit={handleProduceSubmit} id="produceForm" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold">Build Date *</label>
                  <input 
                    type="date"
                    required
                    value={buildDate}
                    onChange={(e) => setBuildDate(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none bg-white font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold">Quantity *</label>
                  <input 
                    type="number"
                    required
                    min={1}
                    value={buildQty}
                    onChange={(e) => setBuildQty(parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold">Production Notes</label>
                <textarea 
                  value={buildNotes}
                  onChange={(e) => setBuildNotes(e.target.value)}
                  placeholder="Inspection, quality logs..."
                  rows={2}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none font-medium resize-none"
                />
              </div>

              {/* Component breakdown review box */}
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl max-h-[160px] overflow-y-auto space-y-2">
                <span className="text-[10px] font-bold text-[#006666] uppercase tracking-wider block">Component Deduction Preview:</span>
                {producingBom.components.map((c: any) => {
                  const req = c.quantity * buildQty;
                  const live = inventory.find((inv: any) => inv.id === c.componentItemId);
                  const available = live?.quantityOnHand || 0;
                  const enough = available >= req;
                  return (
                    <div key={c.id} className="flex justify-between items-center text-[10px]">
                      <div className="min-w-0">
                        <span className="font-bold text-gray-700 block truncate">{c.componentItem.name}</span>
                        <span className={cn("text-[9px]", enough ? "text-emerald-600" : "text-rose-600")}>
                          Available: {available.toFixed(2)} {enough ? '✓' : '✗ Shortage'}
                        </span>
                      </div>
                      <span className={cn("font-mono font-bold font-black", enough ? "text-gray-700" : "text-rose-600")}>
                        -{req.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </form>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setProducingBom(null)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="produceForm"
                className="px-5 py-2 bg-[#6a4a63] hover:bg-[#5c3e55] text-white text-xs font-bold uppercase rounded-lg shadow-sm cursor-pointer"
              >
                Complete Assembly
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE/EDIT DRAWER */}
      <Drawer isOpen={showForm} onClose={() => setShowForm(false)} title={editingBom ? "Edit Recipe" : "Create Recipe"}>
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-5 text-left pb-10 text-xs font-medium text-gray-600">
          
          <div className="space-y-1.5">
            <label className="font-bold">Assembly Recipe Name *</label>
            <input 
              type="text"
              required
              value={assemblyName}
              onChange={(e) => setAssemblyName(e.target.value)}
              placeholder="Recipe name..."
              className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-bold">Target Finished Good Product *</label>
            <SearchableSelect inventory={inventory} value={finishedGoodId} onChange={setFinishedGoodId} />
          </div>

          <div className="pt-4 border-t border-gray-150 space-y-3">
            <label className="font-bold text-[#006666] uppercase tracking-wider block">Recipe Components & Quantities</label>
            <div className="space-y-3">
              {components.map((row, idx) => (
                <div key={idx} className="bg-gray-50/50 p-3.5 border border-gray-200 rounded-xl flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                  <div className="w-full sm:flex-1 text-left min-w-0">
                    <label className="text-[9px] font-bold text-gray-400 block mb-1">Select Ingredient Component</label>
                    <SearchableSelect inventory={inventory} value={row.itemId} onChange={(val) => { const n = [...components]; n[idx].itemId = val; setComponents(n); }} />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="flex-1 sm:w-24 text-left">
                      <label className="text-[9px] font-bold text-gray-400 block mb-1">Quantity</label>
                      <input 
                        type="number" 
                        step="0.001" 
                        required
                        value={row.quantity} 
                        onChange={(e) => { const n = [...components]; n[idx].quantity = parseFloat(e.target.value) || 0; setComponents(n); }} 
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-center text-gray-800" 
                        placeholder="Qty" 
                      />
                    </div>
                    {components.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => setComponents(components.filter((_, i) => i !== idx))} 
                        className="p-2 border border-gray-200 hover:bg-rose-50 text-gray-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer self-end"
                        title="Delete component"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <button 
              type="button" 
              onClick={() => setComponents([...components, { itemId: "", quantity: 1 }])} 
              className="inline-flex items-center gap-1 px-3 py-1.5 border border-[#006666] text-[#006666] hover:bg-teal-50 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Add Ingredient Row
            </button>
          </div>

          <button 
            type="submit" 
            className="w-full py-2.5 bg-[#6a4a63] hover:bg-[#5c3e55] text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer mt-4"
          >
            Save Recipe Definition
          </button>
        </form>
      </Drawer>

    </div>
  );
}
