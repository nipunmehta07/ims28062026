"use client";

import { useState, useEffect } from "react";
import { addItemAction, updateItemAction } from "@/app/actions";
import toast from "react-hot-toast";
import { 
  Tag, Fingerprint, Calendar, Info, Archive, Cpu, Package, Box, 
  CircleDollarSign, PlusCircle, Sparkles, ChevronRight, ChevronLeft, Check
} from "lucide-react";

export default function AddItemForm({ onCancel, onSuccess, initialData }: { onCancel: () => void, onSuccess: () => void, initialData?: any }) {
  // --- 1. State Definitions ---
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("Component");
  const [unit, setUnit] = useState("pcs");
  const [unitCost, setUnitCost] = useState("");
  const [initialQty, setInitialQty] = useState("");
  const [openingStockDate, setOpeningStockDate] = useState(new Date().toISOString().split('T')[0]);
  const [minStock, setMinStock] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  // --- 2. Helper to Reset Form ---
  const resetForm = () => {
    setStep(1);
    setName("");
    setSku("");
    setCategory("Component");
    setUnit("pcs");
    setUnitCost("");
    setInitialQty("");
    setOpeningStockDate(new Date().toISOString().split('T')[0]);
    setMinStock("");
    setLocation("");
    setDescription("");
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
      setMinStock(initialData.minStock ? initialData.minStock.toString() : "0");
      setLocation(initialData.location || "");
      setDescription(initialData.description || "");
    } else {
      resetForm();
    }
  }, [initialData]);

  // --- 4. Validation & Navigation Helpers ---
  const isStep1Valid = name.trim() !== "" && sku.trim() !== "";
  const isStep2Valid = category !== "" && unit !== "";
  const isStep3Valid = unitCost !== "" && (initialData ? true : initialQty !== "");

  const handleNext = () => {
    if (step === 1 && !isStep1Valid) {
      return toast.error("Please enter a valid product name and SKU.");
    }
    if (step === 2 && !isStep2Valid) {
      return toast.error("Please select a category and unit.");
    }
    setStep(prev => Math.min(prev + 1, 3));
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  // --- 5. Submit Handler ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      handleNext();
      return;
    }
    if (!isStep3Valid) {
      return toast.error("Please verify all economic parameters.");
    }

    const t = toast.loading(initialData ? "Updating item..." : "Registering new SKU...");
    
    try {
      if (initialData) {
        await updateItemAction(initialData.id, {
          name, sku, category, unit, 
          unitCost: parseFloat(unitCost) || 0,
          minStock: parseFloat(minStock) || 0,
          location,
          description
        });
        toast.success("Item updated successfully!", { id: t });
      } else {
        await addItemAction({
          name, sku, category, unit, 
          unitCost: parseFloat(unitCost) || 0, 
          initialQty: parseInt(initialQty) || 0,
          openingStockDate,
          minStock: parseFloat(minStock) || 0,
          location,
          description
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

  const inputClass = "w-full pl-10 pr-4 py-3 bg-bg-tertiary dark:bg-zinc-800/40 border border-border rounded-xl text-sm text-text-primary font-medium outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-text-tertiary";
  const labelClass = "text-[10px] font-semibold text-text-secondary uppercase tracking-[0.14em] block mb-1.5 font-display";

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Top Stepper Indicator */}
      <div className="flex items-center justify-between px-2">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center flex-1 last:flex-initial">
            <button
              type="button"
              onClick={() => {
                if (s === 1 || (s === 2 && isStep1Valid) || (s === 3 && isStep1Valid && isStep2Valid)) {
                  setStep(s);
                }
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold font-display transition-all duration-300 ${
                step === s 
                  ? "bg-accent text-white ring-4 ring-accent-subtle" 
                  : step > s 
                    ? "bg-success text-white"
                    : "bg-bg-tertiary text-text-secondary border border-border"
              }`}
            >
              {step > s ? <Check className="w-4 h-4" /> : s}
            </button>
            {s < 3 && (
              <div className={`h-0.5 flex-1 mx-4 transition-all duration-500 ${step > s ? 'bg-success' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Visual Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-accent-subtle flex items-center justify-center text-text-primary">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider font-display">
            {initialData ? "Edit SKU Registry" : "Register Product"}
          </h3>
          <p className="text-xs text-text-tertiary">
            {step === 1 && "Step 1: Product description and code identification"}
            {step === 2 && "Step 2: Assign classification and units"}
            {step === 3 && "Step 3: Define initial stock value parameters"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Identity & Description */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="relative">
              <label className={labelClass}>Product Name</label>
              <div className="relative">
                <Tag className="absolute left-3.5 top-3.5 w-4 h-4 text-text-tertiary" />
                <input 
                  required 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className={inputClass} 
                  placeholder="e.g. Chrome Basin Mixer" 
                />
              </div>
            </div>

            <div className="relative">
              <label className={labelClass}>SKU / Part Number</label>
              <div className="relative">
                <Fingerprint className="absolute left-3.5 top-3.5 w-4 h-4 text-text-tertiary" />
                <input 
                  required 
                  value={sku} 
                  onChange={(e) => setSku(e.target.value)} 
                  className={`${inputClass} font-mono font-bold uppercase`} 
                  placeholder="ZOIE-BM-001" 
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Classification */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
          </div>
        )}

        {/* Step 3: Economics & Initial Stock */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-bg-tertiary/40 border border-border/60">
              <div>
                <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-[0.14em] block mb-1.5 font-display">Unit Cost (₹)</label>
                <div className="relative">
                  <CircleDollarSign className="absolute left-3 top-3 w-4 h-4 text-text-tertiary pointer-events-none" />
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

            {/* NEW parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-[0.14em] block mb-1.5 font-display">Minimum Reorder Stock (Min Stock)</label>
                <input 
                  type="number" 
                  min="0"
                  value={minStock} 
                  onChange={(e) => setMinStock(e.target.value)} 
                  className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary font-bold outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-text-tertiary" 
                  placeholder="5" 
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-[0.14em] block mb-1.5 font-display">Physical Location / Bin</label>
                <input 
                  type="text" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary font-semibold outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all placeholder:text-text-tertiary" 
                  placeholder="e.g. Shelf A-3" 
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-[0.14em] block mb-1.5 font-display">Item Description</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                rows={2}
                className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-sm text-text-primary font-medium outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition-all resize-none placeholder:text-text-tertiary" 
                placeholder="Optional SKU details..." 
              />
            </div>

            {!initialData && (
              <div className="flex gap-2.5 p-3 rounded-xl bg-accent-subtle/40 border border-accent/10 text-xs text-text-secondary">
                <Info className="w-4.5 h-4.5 text-accent shrink-0 mt-0.5" />
                <p>Registering this SKU will initialize the opening stock value immediately in the inventory ledger history.</p>
              </div>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="mt-4 pt-6 border-t border-border flex gap-3">
          {step > 1 && (
            <button 
              type="button" 
              onClick={handleBack} 
              className="px-6 py-3.5 bg-bg-secondary hover:bg-bg-hover border border-border rounded-xl text-xs font-semibold hover:text-text-primary transition-all text-text-secondary flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}

          {step < 3 ? (
            <button 
              type="button" 
              onClick={handleNext} 
              className="flex-1 bg-accent hover:bg-accent-hover text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer ml-auto"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              type="submit" 
              className="flex-1 bg-accent hover:bg-accent-hover text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              {initialData ? "Save Changes" : "Register Product"}
            </button>
          )}

          {step === 1 && (
            <button 
              type="button" 
              onClick={onCancel} 
              className="px-6 py-3.5 bg-bg-secondary hover:bg-bg-hover border border-border rounded-xl text-xs font-semibold hover:text-text-primary transition-all text-text-secondary cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
