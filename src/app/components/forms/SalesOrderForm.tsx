"use client";

import React, { useState, useEffect } from "react";
import { getInventory, createSalesOrderAction, updateSalesOrderAction } from "../../actions"; 
import toast from "react-hot-toast";
import { X } from "lucide-react"; //

export default function SalesOrderForm({ onCancel, onSuccess, initialOrder }: any) {
  // --- 1. State Definitions ---
  const [customerName, setCustomerName] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [items, setItems] = useState([{ productId: '', qty: 0, unitPrice: 0, searchQuery: "" }]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  // --- 2. Helper to Reset Form ---
  const resetForm = () => {
    setCustomerName("");
    setOrderDate(new Date().toISOString().split('T')[0]);
    setItems([{ productId: '', qty: 0, unitPrice: 0, searchQuery: "" }]);
    setDiscountPercent(0);
    setActiveDropdown(null);
  };

  // --- 3. Fetch Data & Sync Logic ---
  useEffect(() => {
    async function load() {
      try {
        const data = await getInventory();
        setInventory(data);
      } catch (error) {
        toast.error("Failed to load inventory for search.");
      }
    }
    load();

    if (initialOrder) {
      setCustomerName(initialOrder.customerName || "");
      setOrderDate(initialOrder.orderDate ? new Date(initialOrder.orderDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setItems(initialOrder.items?.map((i: any) => ({
        productId: i.itemId, 
        qty: i.quantity, 
        unitPrice: i.salePrice || 0,
        searchQuery: "" 
      })) || [{ productId: '', qty: 0, unitPrice: 0, searchQuery: "" }]);
      setDiscountPercent(initialOrder.discountPercent || 0);
    } else {
      resetForm(); 
    }
  }, [initialOrder]);

  // --- 4. Update Logic ---
  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  // NEW: Remove Item Handler
  const removeItem = (index: number) => {
    if (items.length <= 1) {
      toast.error("At least one item is required.");
      return;
    }
    const filtered = items.filter((_, i) => i !== index);
    setItems(filtered);
  };

  const handleProductSelect = (index: number, product: any) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      productId: product.id,
      searchQuery: product.name, 
      unitPrice: product.unitCost || product.price || 0,
    };
    setItems(newItems);
    setActiveDropdown(null);
  };

  // --- 5. Calculations ---
  const orderSubtotal = items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.unitPrice)), 0);
  const finalAmount = orderSubtotal - (orderSubtotal * Number(discountPercent) / 100);

  // --- 6. Submit Handler ---
  const handleSubmit = async () => {
    if (!customerName) return toast.error("Client Name is required");
    const loadingToast = toast.loading("Saving Order...");

    try {
      const payload = {
        customerName,
        orderDate,
        discountPercent: Number(discountPercent),
        totalAmount: Number(finalAmount), 
        items: items.map(i => ({
          itemId: i.productId,
          quantity: Number(i.qty),
          salePrice: Number(i.unitPrice)
        }))
      };

      if (initialOrder?.id) {
        await updateSalesOrderAction(initialOrder.id, payload);
        toast.success("Order Updated", { id: loadingToast });
      } else {
        await createSalesOrderAction(payload);
        toast.success("Order Saved", { id: loadingToast });
        resetForm(); 
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to save order", { id: loadingToast });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white p-6 space-y-6 overflow-y-auto font-sans">
      
      <div className="grid grid-cols-2 gap-5 text-left">
        <div>
          <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Client Name</label>
          <input 
            type="text" 
            placeholder="Enter client name..." 
            value={customerName} 
            onChange={(e) => setCustomerName(e.target.value)} 
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all" 
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Order Date</label>
          <input 
            type="date" 
            value={orderDate} 
            onChange={(e) => setOrderDate(e.target.value)} 
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all" 
          />
        </div>
      </div>

      <div className="space-y-3 text-left">
        <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Line Items</label>
        
        {items.map((item, index) => {
          const displayValue = item.searchQuery !== undefined && item.searchQuery !== "" 
            ? item.searchQuery 
            : (inventory.find(p => p.id === item.productId)?.name || "");
            
          const filteredInventory = inventory.filter(p => {
            if (!item.searchQuery || item.productId) return true; 
            const query = item.searchQuery.toLowerCase();
            return p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query);
          });

          return (
            <div key={index} className="p-4 bg-white border border-gray-200 rounded-xl space-y-4 shadow-sm relative animate-in fade-in zoom-in-95">
              
              {/* REMOVE BUTTON */}
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all z-10"
              >
                <X size={16} />
              </button>

              <div className="relative">
                <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Search SKU / Name</label>
                <input 
                  type="text"
                  placeholder="Type to search products..."
                  value={displayValue}
                  onChange={(e) => {
                    const val = e.target.value;
                    const newItems = [...items];
                    newItems[index] = { ...newItems[index], searchQuery: val, productId: '' };
                    setItems(newItems);
                    setActiveDropdown(index);
                  }}
                  onFocus={() => setActiveDropdown(index)}
                  onBlur={() => setTimeout(() => setActiveDropdown(null), 150)} 
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all"
                />

                {activeDropdown === index && (
                  <ul className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl max-h-64 overflow-y-auto top-full left-0 ring-1 ring-black/5 animate-in fade-in slide-in-from-top-2">
                    {filteredInventory.map(p => {
                      const stockLevel = p.quantityOnHand || 0;
                      return (
                        <li 
                          key={p.id}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleProductSelect(index, p);
                          }}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors group"
                        >
                          <div className="flex justify-between items-start">
                            <div className="text-left">
                              <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{p.name}</div>
                              <div className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-widest">{p.sku}</div>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-xs font-bold text-gray-900">₹{p.unitCost?.toLocaleString('en-IN') || 0}</span>
                              <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest mt-1 ${stockLevel > 10 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                {stockLevel} Stock
                              </span>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-left">
                  <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Qty</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={item.qty || ""} 
                    onChange={(e) => updateItem(index, 'qty', e.target.value)} 
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all" 
                  />
                </div>
                <div className="text-left">
                  <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Price (₹)</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={item.unitPrice || ""} 
                    onChange={(e) => updateItem(index, 'unitPrice', e.target.value)} 
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm font-medium text-gray-900 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all" 
                  />
                </div>
              </div>
            </div>
          );
        })}
        
        <button 
          onClick={() => setItems([...items, { productId: '', qty: 0, unitPrice: 0, searchQuery: "" }])} 
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors mt-2 inline-flex items-center gap-1"
        >
          <span>+</span> Add Another Item
        </button>
      </div>

      <div className="mt-auto pt-6 border-t border-gray-200 space-y-5">
        <div className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
          <span className="text-xs font-semibold text-gray-600">Discount Applied</span>
          <div className="flex items-center gap-1">
            <input 
              type="number" 
              value={discountPercent || ""} 
              onChange={(e) => setDiscountPercent(Number(e.target.value))} 
              className="w-14 text-right bg-white border border-gray-200 rounded text-sm font-medium focus:outline-none focus:ring-1 focus:ring-black focus:border-black px-2 py-1" 
            />
            <span className="font-semibold text-gray-500 text-sm">%</span>
          </div>
        </div>

        <div className="flex justify-between items-end px-1">
          <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Invoice Amt </span>
          <span className="text-2xl font-bold tracking-tight text-gray-900">
            ₹{finalAmount.toLocaleString('en-IN')}
          </span>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={handleSubmit} 
            className="flex-1 py-3 px-4 bg-black text-white rounded-lg text-sm font-semibold hover:bg-zinc-800 active:scale-[0.98] transition-all shadow-sm"
          >
            {initialOrder ? "Update Order" : "Save Order"}
          </button>
          <button 
            type="button" 
            onClick={onCancel}
            className="px-6 py-3 border border-gray-200 rounded-lg text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}