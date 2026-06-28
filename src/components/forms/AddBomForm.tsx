"use client";

import { useState, useEffect } from "react";
import { getInventory, createBomAction } from "@/app/actions";
import toast from "react-hot-toast";

export default function AddBomForm({ onCancel, onSuccess }: { onCancel: () => void, onSuccess: () => void }) {
  const [allItems, setAllItems] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [finishedGoodId, setFinishedGoodId] = useState("");
  const [components, setComponents] = useState([{ itemId: "", quantity: 1 }]);

  useEffect(() => {
    getInventory().then(setAllItems);
  }, []);

  const addRow = () => setComponents([...components, { itemId: "", quantity: 1 }]);

  const removeRow = (index: number) => {
    if (components.length > 1) {
      setComponents(components.filter((_, i) => i !== index));
    }
  };

  const updateRow = (index: number, field: string, value: any) => {
    const newRows = [...components];
    (newRows[index] as any)[field] = value;
    setComponents(newRows);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finishedGoodId || components.some(c => !c.itemId)) {
      toast.error("Please select a target product and all components.");
      return;
    }

    const loadingToast = toast.loading("Saving to Zoie Database...");

    try {
      await createBomAction({
        name: name,
        itemId: finishedGoodId,
        components: components
      });

      toast.success("Recipe Created!", { id: loadingToast });
      onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Database Error. Check Console.", { id: loadingToast });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="space-y-4">
        {/* 1. BOM NAME */}
        <div>
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">BOM Name</label>
          <input 
            required value={name} onChange={(e) => setName(e.target.value)}
            className="w-full mt-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-black transition-all"
            placeholder="e.g. Standard Assembly"
          />
        </div>

        {/* 2. TARGET PRODUCT (Unfiltered to allow Components) */}
        <div>
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Target Product</label>
          <select 
            required value={finishedGoodId} onChange={(e) => setFinishedGoodId(e.target.value)}
            className="w-full mt-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-black"
          >
            <option value="">Select Item...</option>
            {/* Removed .filter(item => item.category === "Finished Good") */}
            {allItems.map(item => (
              <option key={item.id} value={item.id}>
                [{item.category}] {item.name} {item.sku ? `(${item.sku})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* 3. COMPONENTS / RAW MATERIALS (Unfiltered) */}
        <div className="pt-4 border-t border-gray-100">
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Components / Raw Materials</label>
          <div className="mt-2 space-y-2">
            {components.map((comp, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <select 
                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-black"
                  value={comp.itemId} onChange={(e) => updateRow(idx, 'itemId', e.target.value)}
                >
                  <option value="">Select Item...</option>
                  {/* Removed .filter(item => item.category !== "Finished Good") */}
                  {allItems.map(item => (
                    <option key={item.id} value={item.id}>
                      [{item.category}] {item.name}
                    </option>
                  ))}
                </select>
                <input 
                  type="number" 
                  min="0.001"
                  step="any"
                  placeholder="Qty"
                  className="w-20 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-black font-mono"
                  value={comp.quantity} onChange={(e) => updateRow(idx, 'quantity', parseFloat(e.target.value))}
                />
                {components.length > 1 && (
                  <button type="button" onClick={() => removeRow(idx)} className="text-gray-300 hover:text-red-500 transition-colors px-1">✕</button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addRow} className="mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-tighter hover:text-black transition-colors">
            + Add Component Row
          </button>
        </div>
      </div>

      {/* 4. ACTIONS */}
      <div className="flex gap-3 mt-6">
        <button type="submit" className="flex-1 bg-black text-white py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-gray-800 shadow-sm active:scale-[0.98] transition-all">
          Save
        </button>
        <button type="button" onClick={onCancel} className="px-6 py-3 border border-gray-200 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all">
          Cancel
        </button>
      </div>
    </form>
  );
}