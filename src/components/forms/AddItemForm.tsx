"use client";

import { useState, useEffect } from "react";
import { addItemAction, updateItemAction } from "@/app/actions";
import toast from "react-hot-toast";

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
      resetForm(); // Ensure fields are empty when adding a new item
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
        resetForm(); // Clear the form after successful creation
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to save item.", { id: t });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 font-sans">
      <div>
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Product Name</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[13px] font-bold outline-none focus:border-black transition-colors placeholder:font-medium placeholder:text-gray-400" placeholder="e.g. Chrome Basin Mixer" />
      </div>

      <div>
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">SKU / Part Number</label>
        <input required value={sku} onChange={(e) => setSku(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[13px] font-mono font-bold outline-none focus:border-black transition-colors placeholder:font-medium placeholder:text-gray-400" placeholder="ZOIE-BM-001" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[13px] font-bold outline-none focus:border-black transition-colors cursor-pointer">
            <option value="Raw Material">Raw Material</option>
            <option value="Component">Component</option>
            <option value="Finished Good">Finished Good</option>
            <option value="Packaging">Packaging</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Unit</label>
          <select value={unit} onChange={(e) => setUnit(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[13px] font-bold outline-none focus:border-black transition-colors cursor-pointer">
            <option value="pcs">pcs</option>
            <option value="kg">kg</option>
            <option value="L">L</option>
            <option value="m">m</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Unit Cost (₹)</label>
          <input type="number" step="0.01" min="0" required value={unitCost} onChange={(e) => setUnitCost(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[13px] font-bold outline-none focus:border-black transition-colors placeholder:text-gray-400" placeholder="0.00" />
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Opening Stock</label>
          <input 
            type="number" min="0" required value={initialQty} onChange={(e) => setInitialQty(e.target.value)} 
            disabled={!!initialData} 
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[13px] font-bold outline-none focus:border-black disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors" 
            placeholder="10"
            title={initialData ? "Stock must be adjusted via production or sales." : ""}
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">As Of Date</label>
          <input 
            type="date" required value={openingStockDate} onChange={(e) => setOpeningStockDate(e.target.value)} 
            disabled={!!initialData} 
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-[13px] font-bold outline-none focus:border-black disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors" 
          />
        </div>
      </div>

      <div className="mt-4 pt-6 flex gap-3">
        <button type="submit" className="flex-1 bg-black text-white py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-lg active:scale-[0.98] transition-all hover:bg-gray-800">
          {initialData ? "Save Changes" : "Save"}
        </button>
        <button type="button" onClick={onCancel} className="px-6 py-4 bg-white border border-gray-200 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all text-gray-500">Cancel</button>
      </div>
    </form>
  );
}