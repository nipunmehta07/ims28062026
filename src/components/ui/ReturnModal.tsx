"use client";

import { forwardRef, useState } from "react";
import { RotateCcw, Box, Hammer } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { processReturnAction } from "@/app/actions";
import { useToast } from "./Toast";

export interface ReturnModalProps {
  order: {
    id: string;
    customerName: string;
    items: Array<{
      id: string;
      itemId: string;
      quantity: number;
      item: {
        name: string;
      };
    }>;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export const ReturnModal = forwardRef<HTMLDivElement, ReturnModalProps>(
  ({ order, onClose, onSuccess }, ref) => {
    const [selectedItemId, setSelectedItemId] = useState("");
    const [qty, setQty] = useState(1);
    const [reason, setReason] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [disassemble, setDisassemble] = useState(false);
    const { loading, success, error: toastError } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      if (!selectedItemId) {
        toastError("Please select an item to return.");
        return;
      }
      if (qty <= 0) {
        toastError("Quantity must be greater than zero.");
        return;
      }

      loading(
        disassemble ? "Processing return and disassembling..." : "Processing return..."
      );

      try {
        await processReturnAction({
          orderId: order.id,
          itemId: selectedItemId,
          quantity: qty,
          reason: reason || "Standard Return",
          returnDate: date,
          disassemble,
        });

        success(
          disassemble
            ? "Return complete: Components added back to stock."
            : "Return complete: Item added back to finished goods."
        );

        onSuccess();
        onClose();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to process return";
        toastError(errorMessage);
      }
    };

    return (
      <Modal
        ref={ref}
        isOpen={true}
        onClose={onClose}
        size="md"
        variant="glass"
        aria-labelledby="return-modal-title"
      >
        {/* Gradient accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 rounded-t-2xl" />
        
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <RotateCcw size={20} className="text-white" />
            </div>
            <div>
              <h2 
                id="return-modal-title" 
                className="text-[13px] font-bold uppercase tracking-tight text-gray-900 dark:text-white"
              >
                Process Return
              </h2>
              <p className="text-[9px] text-gray-500 dark:text-gray-400 font-medium uppercase mt-0.5 tracking-wider">
                Order: {order.customerName}
              </p>
            </div>
          </div>

          {/* Item Selection */}
          <div className="mb-5">
            <label className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block mb-2 tracking-wider">
              Select Item from Order
            </label>
            <select
              className="w-full px-4 py-3 bg-gray-50/80 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-[12px] font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-colors appearance-none cursor-pointer"
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              required
            >
              <option value="">Choose item...</option>
              {order.items.map((i) => (
                <option key={i.id} value={i.itemId}>
                  {i.item.name} (Sold: {i.quantity})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity and Date */}
          <div className="grid grid-cols-2 gap-4 mb-5">
            <div>
              <label className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block mb-2 tracking-wider">
                Return Qty
              </label>
              <input
                type="number"
                min="0.001"
                step="0.001"
                value={qty}
                onChange={(e) => setQty(parseFloat(e.target.value))}
                className="w-full px-4 py-3 bg-gray-50/80 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-[12px] font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-colors"
                required
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block mb-2 tracking-wider">
                Return Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50/80 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-[12px] font-medium outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-colors"
                required
              />
            </div>
          </div>

          {/* Disassemble Toggle - Enhanced styling */}
          <div
            className={`
              relative p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-4 mb-5 overflow-hidden
              ${disassemble
                ? 'bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-950/50 dark:to-orange-950/50 border-amber-300 dark:border-amber-800'
                : 'bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/50 dark:to-teal-950/50 border-emerald-200 dark:border-emerald-800'
              }
            `}
            onClick={() => setDisassemble(!disassemble)}
          >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, ${disassemble ? '#f59e0b' : '#10b981'} 1px, transparent 0)`
              }} />
            </div>
            
            <div className={`
              relative z-10 p-2.5 rounded-xl transition-colors
              ${disassemble ? 'bg-amber-100 dark:bg-amber-900/50' : 'bg-emerald-100 dark:bg-emerald-900/50'}
            `}>
              {disassemble ? (
                <Hammer size={18} className="text-amber-700 dark:text-amber-300" />
              ) : (
                <Box size={18} className="text-emerald-700 dark:text-emerald-300" />
              )}
            </div>
            
            <div className="flex-1 relative z-10">
              <p className={`text-[10px] font-bold uppercase leading-tight ${disassemble ? 'text-amber-800 dark:text-amber-200' : 'text-emerald-800 dark:text-emerald-200'}`}>
                {disassemble ? "Disassemble into Parts" : "Restock Finished Good"}
              </p>
              <p className={`text-[8px] font-medium uppercase mt-0.5 ${disassemble ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'} opacity-70`}>
                {disassemble ? "Stock components back to raw materials" : "Stock item back to finished inventory"}
              </p>
            </div>
            
            <div className="relative z-10">
              <div className={`
                w-12 h-6 rounded-full transition-colors relative
                ${disassemble ? 'bg-amber-400' : 'bg-emerald-400'}
              `}>
                <div className={`
                  absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-200
                  ${disassemble ? 'left-7' : 'left-1'}
                `} />
              </div>
            </div>
          </div>

          {/* Reason Notes */}
          <div className="mb-6">
            <label className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block mb-2 tracking-wider">
              Return Reason / Notes
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50/80 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-xl text-[11px] font-medium h-20 resize-none outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-colors placeholder:text-gray-400"
              placeholder="e.g. Defective Spout, Wrong Series..."
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
            <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="gradient" className="flex-1 shadow-lg shadow-emerald-500/25">
              Confirm Return
            </Button>
          </div>
        </form>
      </Modal>
    );
  }
);

ReturnModal.displayName = "ReturnModal";

export default ReturnModal;