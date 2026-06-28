"use client";

import { forwardRef, useState, useEffect } from "react";
import { Stepper } from "@/app/components/ui";
import { Button, Input } from "@/app/components/ui";
import { Package, User, CheckCircle, Trash2 } from "lucide-react";
import { getInventory, createSalesOrderAction } from "@/app/actions";
import toast from "react-hot-toast";

export interface OutwardItem {
  id: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  quantity: number;
  salePrice: number;
  availableStock: number;
}

export interface OutwardStepperProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onComplete"> {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (data: OutwardStepData) => void;
  onSuccess?: () => void;
}

export interface OutwardStepData {
  customerName: string;
  customerContact?: string;
  customerAddress?: string;
  orderDate: string;
  items: OutwardItem[];
  notes?: string;
}

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantityOnHand: number;
  unitCost: number;
}

const STEPS = [
  { id: "products", title: "Select Products", icon: <Package size={16} /> },
  { id: "client", title: "Client Info", icon: <User size={16} /> },
  { id: "confirm", title: "Confirm", icon: <CheckCircle size={16} /> },
];

export const OutwardStepper = forwardRef<HTMLDivElement, OutwardStepperProps>(
  ({ isOpen, onClose, onComplete, onSuccess, className = "", ...props }, ref) => {
    const [currentStepId, setCurrentStepId] = useState("products");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Step 1: Products
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [outwardItems, setOutwardItems] = useState<OutwardItem[]>([]);
    const [productSearch, setProductSearch] = useState("");
    const [showProductDropdown, setShowProductDropdown] = useState(false);

    // Step 2: Client Info
    const [customerName, setCustomerName] = useState("");
    const [customerContact, setCustomerContact] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");
    const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);

    // Step 3: Notes
    const [notes, setNotes] = useState("");

    // Load inventory
    useEffect(() => {
      if (isOpen) {
        async function loadInventory() {
          try {
            const data = await getInventory();
            setInventory(data as InventoryItem[]);
          } catch (error) {
            toast.error("Failed to load inventory");
          }
        }
        loadInventory();
      }
    }, [isOpen]);

    // Reset state when closed
    useEffect(() => {
      if (!isOpen) {
        setCurrentStepId("products");
        setOutwardItems([]);
        setProductSearch("");
        setCustomerName("");
        setCustomerContact("");
        setCustomerAddress("");
        setOrderDate(new Date().toISOString().split('T')[0]);
        setNotes("");
        setIsSubmitting(false);
      }
    }, [isOpen]);

    const currentStepIndex = STEPS.findIndex((s) => s.id === currentStepId);

    const canNext = (() => {
      switch (currentStepId) {
        case "products":
          return outwardItems.length > 0;
        case "client":
          return customerName.trim().length > 0;
        case "confirm":
          return true;
        default:
          return false;
      }
    })();

    const handleNext = () => {
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < STEPS.length) {
        setCurrentStepId(STEPS[nextIndex].id);
      }
    };

    const handleBack = () => {
      const prevIndex = currentStepIndex - 1;
      if (prevIndex >= 0) {
        setCurrentStepId(STEPS[prevIndex].id);
      }
    };

    const handleAddProduct = (item: InventoryItem) => {
      const existingIndex = outwardItems.findIndex((i) => i.itemId === item.id);
      if (existingIndex >= 0) {
        toast.error("Product already added");
        return;
      }

      const newItem: OutwardItem = {
        id: `temp-${Date.now()}`,
        itemId: item.id,
        itemName: item.name,
        itemSku: item.sku,
        quantity: 1,
        salePrice: item.unitCost,
        availableStock: item.quantityOnHand,
      };

      setOutwardItems([...outwardItems, newItem]);
      setProductSearch("");
      setShowProductDropdown(false);
    };

    const handleRemoveItem = (itemId: string) => {
      setOutwardItems(outwardItems.filter((i) => i.itemId !== itemId));
    };

    const handleUpdateItemQuantity = (itemId: string, quantity: number) => {
      setOutwardItems(
        outwardItems.map((i) =>
          i.itemId === itemId ? { ...i, quantity: Math.max(0.001, quantity) } : i
        )
      );
    };

    const handleUpdateItemPrice = (itemId: string, price: number) => {
      setOutwardItems(
        outwardItems.map((i) =>
          i.itemId === itemId ? { ...i, salePrice: Math.max(0, price) } : i
        )
      );
    };

    const filteredProducts = inventory.filter(
      (p) =>
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase())
    );

    const subtotal = outwardItems.reduce(
      (sum, item) => sum + item.quantity * item.salePrice,
      0
    );

    const handleSubmit = async () => {
      if (!customerName.trim()) {
        toast.error("Client name is required");
        return;
      }

      if (outwardItems.length === 0) {
        toast.error("At least one product is required");
        return;
      }

      setIsSubmitting(true);
      const loadingToast = toast.loading("Processing stock outward...");

      try {
        const payload = {
          customerName: customerName.trim(),
          orderDate,
          discountPercent: 0,
          totalAmount: subtotal,
          items: outwardItems.map((i) => ({
            itemId: i.itemId,
            quantity: i.quantity,
            salePrice: i.salePrice,
          })),
        };

        await createSalesOrderAction(payload);
        toast.success("Stock outward recorded successfully", { id: loadingToast });

        const stepData: OutwardStepData = {
          customerName: customerName.trim(),
          customerContact,
          customerAddress,
          orderDate,
          items: outwardItems,
          notes,
        };

        onComplete?.(stepData);
        onSuccess?.();
        onClose();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to process stock outward";
        toast.error(errorMessage, { id: loadingToast });
      } finally {
        setIsSubmitting(false);
      }
    };

    // Step 1: Product Selection Content
    const renderProductsStep = () => (
      <div className="space-y-4">
        <div className="text-left">
          <label className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-1.5">
            Search Products
          </label>
          <div className="relative">
            <Input
              type="text"
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value);
                setShowProductDropdown(true);
              }}
              onFocus={() => setShowProductDropdown(true)}
              placeholder="Type to search by name or SKU..."
              className="w-full"
            />
            {showProductDropdown && productSearch && (
              <div className="absolute z-50 w-full mt-2 bg-white dark:bg-zinc-900 border border-emerald-500/20 rounded-xl shadow-xl shadow-emerald-500/10 max-h-64 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="p-4 text-center text-[11px] font-bold text-gray-400">
                    No products found
                  </div>
                ) : (
                  filteredProducts.map((product) => {
                    const stock = product.quantityOnHand || 0;
                    const price = product.unitCost || 0;
                    return (
                      <button
                        key={product.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleAddProduct(product);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-b border-emerald-500/10 last:border-0 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[12px] font-black text-gray-900 dark:text-white">
                              {product.name}
                            </p>
                            <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                              {product.sku}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] font-black bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                              ₹{price.toLocaleString("en-IN")}
                            </p>
                            <p
                              className={`text-[8px] font-black uppercase tracking-widest mt-0.5 ${
                                stock > 10
                                  ? "text-emerald-600"
                                  : stock > 0
                                    ? "text-amber-600"
                                    : "text-rose-600"
                              }`}
                            >
                              {stock} in stock
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Selected Items */}
        {outwardItems.length > 0 && (
          <div className="space-y-3">
            <label className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">
              Selected Items ({outwardItems.length})
            </label>
            {outwardItems.map((item) => (
              <div
                key={item.itemId}
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/10 rounded-xl border border-emerald-500/10"
              >
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[12px] font-black text-gray-900 dark:text-white truncate">
                    {item.itemName}
                  </p>
                  <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                    {item.itemSku}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={item.quantity}
                    onChange={(e) =>
                      handleUpdateItemQuantity(item.itemId, parseFloat(e.target.value) || 0)
                    }
                    className="w-20 px-2 py-1.5 bg-white dark:bg-zinc-900 border border-emerald-500/20 rounded-lg text-[11px] font-black text-center outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.salePrice}
                    onChange={(e) =>
                      handleUpdateItemPrice(item.itemId, parseFloat(e.target.value) || 0)
                    }
                    className="w-24 px-2 py-1.5 bg-white dark:bg-zinc-900 border border-emerald-500/20 rounded-lg text-[11px] font-black text-right outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  />
                  <button
                    onClick={() => handleRemoveItem(item.itemId)}
                    className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3 border-t border-emerald-500/20">
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                Subtotal
              </span>
              <span className="text-[14px] font-black bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                ₹{subtotal.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        )}
      </div>
    );

    // Step 2: Client Info Content
    const renderClientStep = () => (
      <div className="space-y-4 text-left">
        <div>
          <label className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-1.5">
            Client Name *
          </label>
          <Input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Enter client name..."
            className="w-full"
            floating
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest block mb-1.5">
            Contact Number
          </label>
          <Input
            type="tel"
            value={customerContact}
            onChange={(e) => setCustomerContact(e.target.value)}
            placeholder="Enter contact number..."
            className="w-full"
            floating
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest block mb-1.5">
            Address
          </label>
          <textarea
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            placeholder="Enter client address..."
            rows={3}
            className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-emerald-500/20 rounded-xl text-[12px] font-bold resize-none outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
          />
        </div>
        <div>
          <label className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-1.5">
            Outward Date
          </label>
          <Input
            type="date"
            value={orderDate}
            onChange={(e) => setOrderDate(e.target.value)}
            className="w-full"
          />
        </div>
      </div>
    );

    // Step 3: Confirm Content
    const renderConfirmStep = () => (
      <div className="space-y-6">
        {/* Summary */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
            Summary
          </h4>

          {/* Client Info */}
          <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 rounded-xl border border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <User size={18} className="text-white" />
              </div>
              <div>
                <p className="text-[13px] font-black text-gray-900 dark:text-white">
                  {customerName}
                </p>
                {customerContact && (
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {customerContact}
                  </p>
                )}
              </div>
            </div>
            {customerAddress && (
              <p className="mt-3 text-[10px] font-bold text-gray-500 border-t border-emerald-500/20 pt-3">
                {customerAddress}
              </p>
            )}
          </div>

          {/* Items */}
          <div className="border border-emerald-500/20 rounded-xl overflow-hidden bg-white/50 dark:bg-zinc-900/50">
            <table className="w-full text-left">
              <thead className="bg-gradient-to-r from-emerald-500/10 to-teal-500/5">
                <tr>
                  <th className="px-4 py-2 text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                    Product
                  </th>
                  <th className="px-4 py-2 text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest text-right">
                    Qty
                  </th>
                  <th className="px-4 py-2 text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest text-right">
                    Price
                  </th>
                  <th className="px-4 py-2 text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest text-right">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-500/10">
                {outwardItems.map((item) => (
                  <tr key={item.itemId}>
                    <td className="px-4 py-3">
                      <p className="text-[11px] font-black text-gray-900 dark:text-white">
                        {item.itemName}
                      </p>
                      <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                        {item.itemSku}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-[11px] font-black text-gray-900 dark:text-white text-right">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-3 text-[11px] font-black text-gray-900 dark:text-white text-right">
                      ₹{item.salePrice.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-[11px] font-black bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent text-right">
                      ₹{(item.quantity * item.salePrice).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gradient-to-r from-emerald-500/10 to-teal-500/5">
                <tr>
                  <td colSpan={3} className="px-4 py-3 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest text-right">
                    Total
                  </td>
                  <td className="px-4 py-3 text-[14px] font-black bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent text-right">
                    ₹{subtotal.toLocaleString("en-IN")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest block mb-1.5">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes or special instructions..."
              rows={2}
              className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border border-emerald-500/20 rounded-xl text-[11px] font-bold resize-none outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all"
            />
          </div>
        </div>
      </div>
    );

    const renderStepContent = () => {
      switch (currentStepId) {
        case "products":
          return renderProductsStep();
        case "client":
          return renderClientStep();
        case "confirm":
          return renderConfirmStep();
        default:
          return null;
      }
    };

    if (!isOpen) return null;

    return (
      <div ref={ref} className={className} {...props}>
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl shadow-emerald-500/10 overflow-hidden">
          {/* Header with emerald gradient */}
          <div className="px-6 py-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border-b border-emerald-500/20">
            <h2 className="text-[14px] font-black uppercase italic bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Stock Outward
            </h2>
            <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest mt-0.5">
              Create new stock issue record
            </p>
          </div>

          {/* Stepper - Emerald glow on active step */}
          <div className="px-6 pt-6">
            <Stepper
              steps={STEPS.map((step) => ({
                id: step.id,
                title: step.title,
                icon: step.icon,
              }))}
              currentStep={currentStepId}
              orientation="horizontal"
              showNavigation={false}
            />
          </div>

          {/* Content */}
          <div className="px-6 py-6">{renderStepContent()}</div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-emerald-500/20 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={currentStepIndex === 0 ? onClose : handleBack}
            >
              {currentStepIndex === 0 ? "Cancel" : "Back"}
            </Button>
            <div className="flex items-center gap-2">
              {currentStepIndex < STEPS.length - 1 ? (
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={handleNext}
                  disabled={!canNext}
                >
                  Next
                </Button>
              ) : (
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={handleSubmit}
                  disabled={!canNext || isSubmitting}
                  isLoading={isSubmitting}
                >
                  Confirm & Submit
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

OutwardStepper.displayName = "OutwardStepper";

export default OutwardStepper;