"use client";

import React, { useState, useRef } from "react";
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
} from "../actions";
import Papa from "papaparse";
import SearchableSelect from "./ui/SearchableSelect";
import Drawer from "./ui/Drawer";
import toast from "react-hot-toast";
import { 
  ChevronDown, 
  ChevronUp, 
  Download, 
  Upload, 
  Search, 
  Trash2, 
  Plus, 
  Hammer, 
  Package 
} from "lucide-react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Input";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./ui/Table";

export default function BomView() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 2. Access the user's session role
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

  const { data: logs = [], isLoading: isLogsLoading } = useQuery({
    queryKey: ["productionLogs"],
    queryFn: () => getProductionLogs(),
    enabled: activeSubTab === 'history'
  });

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["boms"] });
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
    queryClient.invalidateQueries({ queryKey: ["productionLogs"] });
  };

  // --- FILTERED DATA (Live Search) ---
  const filteredBoms = boms.filter((bom: any) => 
    bom.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    bom.item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (bom.item.sku && bom.item.sku.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
        // THE FIX: Explicitly type the accumulator as a Record
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

        // Now TypeScript knows groupedData is a valid object for Object.values()
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
  const handleProduceSubmit = async () => {
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

  const allAvailableItems = inventory;

  if ((isBomLoading || isInvLoading) && boms.length === 0) {
    return <div className="p-20 text-center animate-pulse text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Loading Assembly Lines...</div>;
  }

  return (
    <div className="flex flex-col gap-6 font-sans pb-24 md:pb-0 relative">
      
      {/* HEADER & TABS - Responsive flex layout */}
      <Card variant="default" padding="md" radius="lg" className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 w-full md:w-auto">
          <div className="text-left">
            <h2 className="text-base md:text-lg font-black text-gray-900 tracking-tight italic uppercase">Production & BOM</h2>
            <p className="text-[9px] text-gray-400 mt-0.5 uppercase font-bold tracking-widest underline decoration-black/20 underline-offset-4">• Assembly Line</p>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto justify-center sm:justify-start">
            <button onClick={() => setActiveSubTab('list')} className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-black uppercase rounded ${activeSubTab === 'list' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>Definitions</button>
            <button onClick={() => setActiveSubTab('history')} className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] font-black uppercase rounded ${activeSubTab === 'history' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>History</button>
          </div>
        </div>
        {/* ACTION TOOLBAR: Restricting Import/Export to ADMIN */}
        <div className="flex items-center gap-1 sm:gap-2 w-full md:w-auto justify-end">
          <input type="file" ref={fileInputRef} onChange={handleFileImport} className="hidden" accept=".csv" />
          
          {isAdmin && (
            <>
              <Button variant="ghost" size="sm" onClick={handleImportClick} title="Import Recipes">
                <Upload size={16} />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleExportCSV} title="Export Recipes" className="mr-2">
                <Download size={16} />
              </Button>
            </>
          )}

          {activeSubTab === 'list' && (
            <Button onClick={openCreateForm} size="sm" className="px-3">
              <span className="hidden sm:inline">+ New Assembly</span>
              <span className="sm:hidden">+ New</span>
            </Button>
          )}
        </div>
      </Card>

      {/* SEARCH FIELD */}
      {activeSubTab === 'list' && (
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors" size={16} />
          <input 
            type="text" placeholder="Search existing assemblies..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-xl shadow-sm text-[11px] font-black uppercase tracking-widest outline-none focus:border-black transition-all"
          />
        </div>
      )}

      {/* TABLES SECTION - Horizontal scroll enabled */}
      {activeSubTab === 'list' ? (
        <Card variant="default" padding="none" radius="lg" className="overflow-x-auto">
          <Table minWidth="700px">
            <TableHeader>
              <TableRow hover={false} className="bg-gradient-to-r from-emerald-50/50 via-white to-teal-50/50 dark:from-emerald-950/30 dark:via-zinc-900 dark:to-teal-950/30">
                <TableHead>Assembly</TableHead>
                <TableHead>Target Product</TableHead>
                <TableHead>Components</TableHead>
                <TableHead align="right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBoms.map((bom: any) => (
                <React.Fragment key={bom.id}>
                  <TableRow onClick={() => toggleRow(bom.id)} hover>
                    <TableCell>
                      <div className="text-[13px] font-black uppercase flex items-center gap-2">
                        {expandedRows.includes(bom.id) ? <ChevronUp size={14} className="text-black" /> : <ChevronDown size={14} className="text-gray-300" />}
                        {bom.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[11px] font-bold text-gray-900">{bom.item.name}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Package size={12} className="text-gray-300" />
                        <Badge variant="default" size="sm">{bom.components?.length || 0} Parts</Badge>
                      </div>
                    </TableCell>
                    <TableCell align="right">
                      <div className="flex gap-3 justify-end items-center">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEditForm(bom); }}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={(e) => handleDeleteBom(e, bom.id)} className="text-rose-300 hover:text-rose-600 flex items-center gap-1">
                           <Trash2 size={12}/> Delete
                        </Button>
                        <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); setProducingBom(bom); }}>
                          Run Assembly
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedRows.includes(bom.id) && (
                    <TableRow className="bg-gray-50/50">
                      <TableCell colSpan={4} className="px-6 md:px-12 py-6 text-left">
                        <div className="space-y-3 border-l-2 border-black/10 pl-4 md:pl-6">
                          <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">Recipe Components</p>
                          {bom.components.map((c: any) => (
                            <div key={c.id} className="flex justify-between items-center max-w-md gap-4">
                              <span className="text-[10px] font-bold text-gray-600 uppercase truncate">{c.componentItem.name}</span>
                              <span className="text-[10px] font-black text-gray-400 shrink-0">{c.quantity} {c.componentItem.unit}</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <Card variant="default" padding="none" radius="lg">
          <Table minWidth="600px">
            <TableHeader>
              <TableRow hover={false} className="bg-gradient-to-r from-emerald-50/50 via-white to-teal-50/50 dark:from-emerald-950/30 dark:via-zinc-900 dark:to-teal-950/30">
                <TableHead>Date</TableHead>
                <TableHead>Assembly</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead align="right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <span className="text-[11px] font-bold">{new Date(log.createdAt).toLocaleDateString('en-IN')}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[12px] font-black uppercase tracking-tight">{log.bomName}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-[12px] font-black text-emerald-600">+{log.quantityBuilt}</span>
                  </TableCell>
                  <TableCell align="right">
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteLog(log.id)} className="text-rose-400 hover:text-rose-600">
                      Reverse
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* PRODUCTION MODAL - Centered and responsive */}
      {producingBom && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm">
          <Card variant="default" padding="none" radius="2xl" className="w-full max-w-md shadow-2xl max-h-[95vh] flex flex-col animate-in zoom-in-95">
            <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-start text-left shrink-0">
              <div>
                <h3 className="text-sm font-black uppercase italic">Run Production</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 truncate max-w-[200px]">Target: {producingBom.item.name}</p>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-black text-gray-400 uppercase block">Max Capacity</span>
                <span className={`text-lg md:text-xl font-black italic ${calculateMaxBuild(producingBom) > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {calculateMaxBuild(producingBom)} Units
                </span>
              </div>
            </div>
            <div className="p-4 md:p-6 space-y-4 md:space-y-5 text-left overflow-y-auto">
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <Input 
                  label="Build Date"
                  type="date"
                  value={buildDate}
                  onChange={(e) => setBuildDate(e.target.value)}
                />
                <Input 
                  label="Units"
                  type="number"
                  min="1"
                  value={buildQty}
                  onChange={(e) => setBuildQty(parseInt(e.target.value) || 1)}
                />
              </div>
              <Textarea 
                label="Notes"
                value={buildNotes}
                onChange={(e) => setBuildNotes(e.target.value)}
                placeholder="Batch details..."
              />
              <div className="p-3 md:p-4 bg-gray-50 rounded-xl border border-gray-100 max-h-[150px] md:max-h-[180px] overflow-y-auto">
                {producingBom.components.map((c: any) => {
                  const req = c.quantity * buildQty;
                  const live = inventory.find((inv: any) => inv.id === c.componentItemId);
                  const available = live?.quantityOnHand || 0;
                  const enough = available >= req;
                  return (
                    <div key={c.id} className="flex justify-between items-center mb-3 last:mb-0 gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold text-gray-700 uppercase truncate">{c.componentItem.name}</span>
                        <span className={`text-[8px] font-bold ${enough ? 'text-emerald-500' : 'text-rose-500'}`}>Available: {available.toFixed(3)} {enough && '✓'}</span>
                      </div>
                      <span className={`font-mono font-black text-[10px] shrink-0 ${enough ? 'text-emerald-500' : 'text-rose-500 underline'}`}>-{req.toFixed(3)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2 shrink-0">
              <Button variant="secondary" onClick={() => setProducingBom(null)} className="flex-1">Cancel</Button>
              <Button variant="primary" onClick={handleProduceSubmit} className="flex-1">Complete Assembly</Button>
            </div>
          </Card>
        </div>
      )}

      {/* CREATE/EDIT DRAWER */}
      <Drawer isOpen={showForm} onClose={() => setShowForm(false)} title={editingBom ? "Edit Recipe" : "Create Recipe"}>
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-6 text-left pb-10">
          <Input 
            label="Assembly Name"
            value={assemblyName}
            onChange={(e) => setAssemblyName(e.target.value)}
            placeholder="Recipe name..."
            required
          />
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Target Product</label>
            <SearchableSelect inventory={allAvailableItems} value={finishedGoodId} onChange={setFinishedGoodId} />
          </div>
          <div className="pt-4 border-t border-gray-100">
            <label className="text-[10px] font-black text-gray-400 uppercase block mb-3">Components</label>
            <div className="space-y-4">
              {components.map((row, idx) => (
                <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col sm:flex-row gap-4 items-start sm:items-end">
                  <div className="w-full sm:flex-1 text-left min-w-0">
                    <SearchableSelect inventory={allAvailableItems} value={row.itemId} onChange={(val) => { const n = [...components]; n[idx].itemId = val; setComponents(n); }} />
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="flex-1 sm:w-24">
                      <input type="number" step="0.001" value={row.quantity} onChange={(e) => { const n = [...components]; n[idx].quantity = parseFloat(e.target.value) || 0; setComponents(n); }} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-black text-center" placeholder="Qty" />
                    </div>
                    {components.length > 1 && <Button variant="ghost" size="sm" type="button" onClick={() => setComponents(components.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-rose-500"><Trash2 size={16} /></Button>}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" size="sm" type="button" onClick={() => setComponents([...components, { itemId: "", quantity: 1 }])} className="mt-4 text-blue-500 hover:text-blue-700">
              <Plus size={12} /> Add Component
            </Button>
          </div>
          <Button variant="primary" size="lg" type="submit" className="w-full">Save Recipe</Button>
        </form>
      </Drawer>
    </div>
  );
}