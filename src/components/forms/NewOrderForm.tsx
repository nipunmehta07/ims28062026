"use client";
import { useState, useEffect } from "react";

// --- Mock Database (Shared state for the calculator) ---
const mockItems = [
  { sku: "FZ-8802", name: "Premium Basin Mixer Faucet", qty: 0, unit: "pcs" },
  { sku: "BB-01", name: "Solid Brass Body", qty: 120, unit: "pcs" },
  { sku: "CDC-35", name: "Ceramic Disc Cartridge", qty: 18, unit: "pcs" }, // Bottleneck
  { sku: "NA-22", name: "Neoperl Aerator", qty: 400, unit: "pcs" },
  { sku: "ZAL-02", name: "Zinc Alloy Lever", qty: 90, unit: "pcs" },
  { sku: "GS-M4", name: "Grub Screw M4", qty: 500, unit: "pcs" },
  { sku: "CC-01", name: "Concealed Cap", qty: 85, unit: "pcs" },
];

const mockBoms = {
  "FZ-8802": [
    { sku: "BB-01", name: "Solid Brass Body", reqQty: 1 },
    { sku: "CDC-35", name: "Ceramic Disc Cartridge", reqQty: 1 },
    { sku: "NA-22", name: "Neoperl Aerator", reqQty: 1 },
    { sku: "ZAL-02", name: "Zinc Alloy Lever", reqQty: 1 },
    { sku: "GS-M4", name: "Grub Screw M4", reqQty: 1 },
    { sku: "CC-01", name: "Concealed Cap", reqQty: 1 },
  ]
};

export default function NewOrderForm({ onCancel }: { onCancel: () => void }) {
  const [selectedSku, setSelectedSku] = useState("");
  const [orderQty, setOrderQty] = useState(1);
  const [preview, setPreview] = useState<any>(null);

  useEffect(() => {
    if (!selectedSku || orderQty <= 0) {
      setPreview(null);
      return;
    }

    const masterItem = mockItems.find(i => i.sku === selectedSku);
    if (!masterItem) return;

    if (masterItem.qty >= orderQty) {
      setPreview({ type: 'success', message: 'In stock. Order can be fulfilled immediately.' });
      return;
    }

    const bom = mockBoms[selectedSku as keyof typeof mockBoms];
    if (!bom) {
      setPreview({ type: 'error', message: 'Out of stock and no BOM found for assembly.' });
      return;
    }

    let maxAssemblable = orderQty;
    const shortages: any[] = [];

    bom.forEach(comp => {
      const inventoryItem = mockItems.find(i => i.sku === comp.sku);
      const stock = inventoryItem ? inventoryItem.qty : 0;
      const totalNeeded = comp.reqQty * orderQty;
      const maxFromThisPart = Math.floor(stock / comp.reqQty);
      
      if (maxFromThisPart < maxAssemblable) {
        maxAssemblable = maxFromThisPart;
      }

      if (stock < totalNeeded) {
        shortages.push({
          name: comp.name,
          need: totalNeeded,
          have: stock,
          short: totalNeeded - stock
        });
      }
    });

    setPreview({
      type: shortages.length === 0 ? 'success' : 'warning',
      maxAssemblable,
      shortages
    });

  }, [selectedSku, orderQty]);

  return (
    <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
      
      <div>
        <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-widest mb-1.5">
          Product
        </label>
        <select 
          value={selectedSku}
          onChange={(e) => setSelectedSku(e.target.value)}
          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-[13px] text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all shadow-sm appearance-none"
        >
          <option value="">— Select a product —</option>
          <option value="FZ-8802">Premium Basin Mixer Faucet (FZ-8802)</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-widest mb-1.5">
            Quantity
          </label>
          <input 
            type="number" 
            min="1"
            value={orderQty}
            onChange={(e) => setOrderQty(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-[13px] text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all shadow-sm"
          />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-gray-500 uppercase tracking-widest mb-1.5">
            Customer
          </label>
          <input 
            type="text" 
            placeholder="e.g. Zoie Bathware"
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-md text-[13px] text-gray-900 outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all shadow-sm"
          />
        </div>
      </div>

      {preview && (
        <div className={`mt-2 p-4 rounded-lg border ${
          preview.type === 'success' ? 'bg-green-50/50 border-green-200' : 
          preview.type === 'error' ? 'bg-red-50/50 border-red-200' : 
          'bg-yellow-50/50 border-yellow-200'
        }`}>
          {preview.type === 'success' && (
            <div className="text-[13px] font-medium text-green-800">{preview.message || `BOM Analysis: Can build all ${orderQty} units.`}</div>
          )}
          
          {preview.type === 'warning' && (
            <div>
              <div className="text-[13px] font-medium text-yellow-800 mb-2">
                BOM Analysis: Can only assemble {preview.maxAssemblable} of {orderQty}.
              </div>
              <div className="space-y-1 mt-3 pt-3 border-t border-yellow-200/50">
                <div className="text-[10px] uppercase tracking-wider text-yellow-700/70 font-semibold mb-1">Shortages</div>
                {preview.shortages.map((s: any, i: number) => (
                  <div key={i} className="flex justify-between text-[12px]">
                    <span className="text-yellow-900">{s.name}</span>
                    <span className="font-medium text-red-600">Need {s.need} / Have {s.have}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
        <button 
          type="submit"
          className="flex-1 bg-gray-900 text-white px-4 py-2.5 rounded-md text-[13px] font-medium hover:bg-gray-800 transition-colors shadow-sm"
        >
          {preview?.type === 'warning' ? 'Save Order & Trigger POs' : 'Place Order'}
        </button>
        <button 
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-md text-[13px] font-medium hover:bg-gray-50 transition-colors shadow-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}