"use client";

import { useState, useEffect } from "react";
import { addItemAction, updateItemAction } from "@/app/actions";
import toast from "react-hot-toast";
import { 
  Tag, Fingerprint, Calendar, Info, Archive, Cpu, Package, Box, 
  ChevronRight, CircleDollarSign, PlusCircle, Sparkles
} from "lucide-react";

export default function AddItemForm({ onCancel, onSuccess, initialData }: { onCancel: () => void, onSuccess: () => void, initialData?: any }) {
  // --- 1. State Definitions ---
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("Component");
  const [unit, setUnit] = useState("pcs");
  const [unitCost, setUnitCost] = useState("");
  const [initialQty, setInitialQty] = useState("");
  const [openingStockDate, setOpeningStockDate] = useState(new Date().toISOString().split('T')[0]);

  // --- 2. Helper to Reset Form ---
  const resetForm = () => {
    setName("");
    setSku("");
    setCategory("Component");
    setUnit("pcs");
    setUnitCost("");
    setInitialQty("");
    setOpeningStockDate(new Date().toISOString().split('T')[0]);
  };

  // --- 3. Sync State with initialData ---
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setSku(initialData.sku || "");
      setCategory(initialData.category || "Component");
      setUnit(initialData.unit || "pcs");
      setUnitCost(initialData.unitCost ? initialData.unitCost.toString() : "0");
      setInitialQty(initialData.quantityOnHand ? initialData.quantityOnHand.toString() : "0");
    } else {
      resetForm();
    }
  }, [initialData]);

  // --- 4. Submit Handler ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = toast.loading(initialData ? "Updating item..." : "Registering new SKU...");
    
    try {
      if (initialData) {
        await updateItemAction(initialData.id, {
          name, sku, category, unit, unitCost: parseFloat(unitCost) || 0
        });
        toast.success("Item updated successfully!", { id: t });
      } else {
        await addItemAction({
          name, sku, category, unit, 
          unitCost: parseFloat(unitCost) || 0, 
          initialQty: parseInt(initialQty) || 0,
          openingStockDate
        });
        toast.success("New SKU Registered!", { id: t });
        resetForm();
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to save item.", { id: t });
    }
  };

  const categories = [
    { value: "Raw Material", label: "Raw Material", desc: "Brass, raw metals, basic parts", icon: Archive },
    { value: "Component", label: "Component", desc: "Sub-assemblies, valves, washers", icon: Cpu },
    { value: "Finished Good", label: "Finished Good", desc: "Boxed faucets, shower sets", icon: Package },
    { value: "Packaging", label: "Packaging", desc: "Branded boxes, product inserts", icon: Box },
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-xl mx-auto">
      {/* Visual Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-accent-subtle flex items-center justify-center text-text-primary">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider font-display">
            {initialData ? "Edit SKU Registry" : "Register New Product SKU"}
          </h3>
          <p className="text-xs text-text-tertiary">Ensure all details match Zoie Bathware standard parameters.</p>
        </div>
      </div>

      {/* Main Details */}
      <div className="space-y-4">
        <div className="relative">
          <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-[0.14em] block mb-1.5 font-display">Product Name</label>
          <div className="relative">
            <Tag className="absolute left-3.5 top-3.5 w-4 h-4 text-text-tertiary" />
            <input 
              required 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="w-full pl-10 pr-4 py-3 bg-bg-tertiary dark:bg-zinc-800/40 border border-border rounded-xl text-sm text-text-primary font-medium outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-text-tertiary" 
              placeholder="e.g. Chrome Basin Mixer" 
            />
          </div>
        </div>

        <div className="relative">
          <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-[0.14em] block mb-1.5 font-display">SKU / Part Number</label>
          <div className="relative">
            <Fingerprint className="absolute left-3.5 top-3.5 w-4 h-4 text-text-tertiary" />
            <input 
              required 
              value={sku} 
              onChange={(e) => setSku(e.target.value)} 
              className="w-full pl-10 pr-4 py-3 bg-bg-tertiary dark:bg-zinc-800/40 border border-border rounded-xl text-sm text-text-primary font-mono font-bold uppercase outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-text-tertiary" 
              placeholder="ZOIE-BM-001" 
            />
          </div>
        </div>
      </div>

      {/* Category Card Grid Selector */}
      <div>
        <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-[0.14em] block mb-3 font-display">Select Category Group</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = category === cat.value;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all duration-200 ${
                  isSelected 
                    ? "bg-accent-subtle border-accent shadow-sm" 
                    : "bg-bg-tertiary dark:bg-zinc-800/40 border-border hover:bg-bg-hover hover:border-border-light"
                }`}
              >
                <div className={`p-2 rounded-lg ${isSelected ? "bg-accent text-white" : "bg-bg-secondary text-text-secondary"}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <p className={`text-xs font-bold leading-none ${isSelected ? "text-text-primary" : "text-text-secondary"}`}>{cat.label}</p>
                  <p className="text-[10px] text-text-tertiary leading-tight">{cat.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Unit Selector */}
      <div>
        <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-[0.14em] block mb-1.5 font-display">Measurement Unit</label>
        <div className="flex bg-bg-tertiary dark:bg-zinc-800/40 p-1 rounded-xl border border-border w-fit">
          {["pcs", "kg", "L", "m"].map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUnit(u)}
              className={`px-4 py-2 text-xs rounded-lg transition-all duration-200 font-semibold uppercase ${
                unit === u
                  ? "bg-accent text-white shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* Pricing & Stock Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-bg-tertiary/40 border border-border/60">
        <div>
          <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-[0.14em] block mb-1.5 font-display">Unit Cost (₹)</label>
          <div className="relative">
            <CircleDollarSign className="absolute left-3 top-3 w-4 h-4 text-text-tertiary" />
            <input 
              type="number" 
              step="0.01" 
              min="0" 
              required 
              value={unitCost} 
              onChange={(e) => setUnitCost(e.target.value)} 
              className="w-full pl-9 pr-3 py-2.5 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary font-bold outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-text-tertiary" 
              placeholder="0.00" 
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-[0.14em] block mb-1.5 font-display">Opening Stock</label>
          <input 
            type="number" 
            min="0" 
            required 
            value={initialQty} 
            onChange={(e) => setInitialQty(e.target.value)} 
            disabled={!!initialData} 
            className="w-full px-3 py-2.5 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary font-bold outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 disabled:bg-bg-hover disabled:text-text-tertiary disabled:cursor-not-allowed transition-all placeholder:text-text-tertiary" 
            placeholder="10"
            title={initialData ? "Stock must be adjusted via production or sales." : ""}
          />
        </div>

        <div>
          <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-[0.14em] block mb-1.5 font-display">As Of Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 w-4 h-4 text-text-tertiary pointer-events-none" />
            <input 
              type="date" 
              required 
              value={openingStockDate} 
              onChange={(e) => setOpeningStockDate(e.target.value)} 
              disabled={!!initialData} 
              className="w-full pl-9 pr-3 py-2.5 bg-bg-secondary border border-border rounded-xl text-sm text-text-primary font-medium outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 disabled:bg-bg-hover disabled:text-text-tertiary disabled:cursor-not-allowed transition-all cursor-pointer" 
            />
          </div>
        </div>
      </div>

      {/* Info Notice */}
      {!initialData && (
        <div className="flex gap-2.5 p-3 rounded-xl bg-accent-subtle/40 border border-accent/10 text-xs text-text-secondary">
          <Info className="w-4.5 h-4.5 text-accent shrink-0 mt-0.5" />
          <p>Registering this SKU will initialize the opening stock value immediately in the inventory ledger history.</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-4 pt-6 border-t border-border flex gap-3">
        <button 
          type="submit" 
          className="flex-1 bg-accent hover:bg-accent-hover text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          {initialData ? "Save Changes" : "Register Product"}
        </button>
        <button 
          type="button" 
          onClick={onCancel} 
          className="px-6 py-3.5 bg-bg-secondary hover:bg-bg-hover border border-border rounded-xl text-xs font-semibold hover:text-text-primary transition-all text-text-secondary cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}