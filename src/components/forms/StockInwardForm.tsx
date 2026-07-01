"use client";

import { useState, useEffect } from "react";
import { getInventory, stockInwardAction, updateInwardAction } from "@/app/actions";
import SearchableSelect from "../ui/SearchableSelect";
import toast from "react-hot-toast";
import { Input } from "../ui/Input";
import { Textarea } from "../ui/Input";
import { Button } from "../ui/Button";

export default function StockInwardForm({ 
  onCancel, 
  onSuccess, 
  initialData 
}: { 
  onCancel: () => void, 
  onSuccess: () => void, 
  initialData?: any 
}) {
  // --- 1. State Definitions ---
  const [inventory, setInventory] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reference, setReference] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [batchNumber, setBatchNumber] = useState("");

  // --- 2. Helper to Reset Form ---
  const resetForm = () => {
    setSelectedItemId("");
    setQuantity("");
    setReference("");
    setDate(new Date().toISOString().split('T')[0]);
    setNotes("");
    setBatchNumber("");
  };

  // --- 3. Sync State with initialData ---
  useEffect(() => {
    getInventory().then(setInventory);
    
    if (initialData) {
      setSelectedItemId(initialData.itemId);
      setQuantity(initialData.changeQty.toString());
      setReference(initialData.reason.split('Inward: ')[1]?.split(' (')[0] || "");
      setDate(new Date(initialData.createdAt).toISOString().split('T')[0]);
      setNotes(initialData.reason.includes('(') ? initialData.reason.split('(')[1].replace(')', '') : "");
      setBatchNumber(initialData.batchNumber || "");
    } else {
      resetForm(); // Ensure clean state when adding new inward
    }
  }, [initialData]);

  // --- 4. Submit Handler ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = toast.loading(initialData ? "Updating record..." : "Recording stock...");
    
    try {
      const payload = { 
        itemId: selectedItemId, 
        quantity: parseInt(quantity), 
        reference, 
        date, 
        notes,
        batchNumber
      };
      
      if (initialData) {
        await updateInwardAction(initialData.id, payload);
        toast.success("Record Updated", { id: t });
      } else {
        await stockInwardAction(payload);
        toast.success("Stock Recorded", { id: t });
        resetForm(); // Clear the form after a successful NEW entry
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to process request", { id: t });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 font-sans">
      <div>
        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1.5">
          Select Item
        </label>
        <SearchableSelect 
          inventory={inventory} 
          value={selectedItemId} 
          onChange={setSelectedItemId} 
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input 
          label="Quantity"
          type="number" 
          required 
          value={quantity} 
          onChange={(e) => setQuantity(e.target.value)} 
          placeholder="0" 
        />
        <Input 
          label="Inward Date"
          type="date" 
          required 
          value={date} 
          onChange={(e) => setDate(e.target.value)} 
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input 
          label="Reference (e.g. PO Number, Bill No)"
          required 
          value={reference} 
          onChange={(e) => setReference(e.target.value)} 
          placeholder="e.g. PO-9982" 
        />
        <Input 
          label="Batch / Lot Number (Optional)"
          value={batchNumber} 
          onChange={(e) => setBatchNumber(e.target.value)} 
          placeholder="e.g. BATCH-2026-X" 
        />
      </div>

      <Textarea 
        label="Notes"
        value={notes} 
        onChange={(e) => setNotes(e.target.value)} 
        placeholder="Optional remarks..." 
      />

      <div className="flex gap-3 pt-6 border-t border-border">
        <Button 
          type="submit" 
          variant="primary"
          size="lg"
          className="flex-1"
        >
          {initialData ? "Update Record" : "Save"}
        </Button>
        <Button 
          type="button" 
          onClick={onCancel} 
          variant="secondary"
          size="lg"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}