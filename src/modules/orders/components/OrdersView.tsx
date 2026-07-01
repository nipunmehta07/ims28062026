// src/modules/orders/components/OrdersView.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { 
  getSalesOrders, 
  fulfillOrderAction, 
  deleteOrderAction, 
  getInventory,
  getOrderReturnLogs 
} from "@/app/actions";
import SalesOrderForm from "./forms/SalesOrderForm";
import Drawer from "@/components/ui/Drawer";
import ReturnModal from "@/components/ui/ReturnModal"; 
import toast from "react-hot-toast";
import { ChevronDown, ChevronUp, Package, AlertCircle, Hammer, Calendar, RotateCcw, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

function OrderReturnHistory({ order, orderId, isAdmin }: { order: any, orderId: string, isAdmin: boolean }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const data = await getOrderReturnLogs(orderId);
        setLogs(data);
      } catch (err) {
        console.error("Failed to fetch return logs", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [orderId]);

  const totalCredit = logs.reduce((acc, log) => {
    const originalItem = order.items.find((oi: any) => oi.itemId === log.itemId);
    const price = originalItem?.salePrice || 0;
    return acc + (log.changeQty * price);
  }, 0);

  const netValue = (order.totalAmount || 0) - totalCredit;

  if (loading) return <p className="text-[10px] font-bold uppercase animate-pulse text-gray-400">Loading history...</p>;
  
  if (logs.length === 0) {
    return <p className="text-[10px] font-bold text-gray-400 uppercase italic text-left">No items returned yet.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {logs.map((log) => {
          const originalItem = order.items.find((oi: any) => oi.itemId === log.itemId);
          const creditAmount = log.changeQty * (originalItem?.salePrice || 0);

          return (
            <div key={log.id} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="text-left">
                <p className="text-[11px] font-bold text-gray-800 uppercase">{log.item.name}</p>
                <p className="text-[9px] font-bold text-rose-500 uppercase tracking-tight">
                  {log.reason.split('(')[0]}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-bold text-rose-500">+{log.changeQty} {log.item.unit}</p>
                {isAdmin && (
                  <p className="text-[8px] font-bold text-gray-400 uppercase italic">
                    Credit: ₹{creditAmount.toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isAdmin && (
        <div className="mt-6 pt-4 border-t border-gray-150 space-y-2">
          <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <span>Original Total</span>
            <span>₹{order.totalAmount?.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-[10px] font-bold text-rose-500 uppercase tracking-widest">
            <span>Total Returns (Credit)</span>
            <span>- ₹{totalCredit.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between p-3 bg-gray-50 border border-gray-200 text-gray-800 rounded-lg mt-2 shadow-sm">
            <span className="text-[10px] font-black uppercase italic tracking-widest">Net Invoice Value</span>
            <span className="text-sm font-black text-[#006666]">₹{netValue.toLocaleString('en-IN')}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersView() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const { data: orders = [], isLoading: isOrdersLoading } = useQuery({
    queryKey: ["salesOrders"],
    queryFn: () => getSalesOrders(),
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => getInventory(),
  });

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ["salesOrders"] });
    queryClient.invalidateQueries({ queryKey: ["inventory"] });
  };
  
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [fulfillingOrder, setFulfillingOrder] = useState<any>(null);
  const [overrideQuantities, setOverrideQuantities] = useState<{orderItemId: string, newQuantity: number}[]>([]);
  const [returningOrder, setReturningOrder] = useState<any>(null);
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split('T')[0]);

  const toggleOrder = (id: string) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  const handleEdit = (e: React.MouseEvent, order: any) => {
    e.stopPropagation(); 
    setEditingOrder(order);
    setShowForm(true);
  };

  const handleDelete = async (e: React.MouseEvent, orderId: string) => {
    e.stopPropagation(); 
    if (!isAdmin) return;
    if (!confirm("Are you sure you want to delete this draft?")) return;
    const loadingToast = toast.loading("Deleting Order...");
    try {
      await deleteOrderAction(orderId);
      toast.success("Order deleted.", { id: loadingToast });
      refreshData();
    } catch (error: any) { 
      toast.error(error.message, { id: loadingToast }); 
    }
  };

  const openFulfillModal = (e: React.MouseEvent, order: any) => {
    e.stopPropagation(); 
    setFulfillingOrder(order);
    setDispatchDate(new Date().toISOString().split('T')[0]);
    setOverrideQuantities(order.items.map((i: any) => ({ orderItemId: i.id, newQuantity: i.quantity })));
  };

  const handleConfirmFulfill = async () => {
    if (!fulfillingOrder) return;
    const loadingToast = toast.loading("Processing fulfillment...");
    try {
      await fulfillOrderAction(fulfillingOrder.id, overrideQuantities, dispatchDate);
      toast.success("Order Fulfilled!", { id: loadingToast });
      setFulfillingOrder(null);
      refreshData();
    } catch (error: any) {
      toast.error(error.message || "Fulfillment failed.", { id: loadingToast });
    }
  };

  if (isOrdersLoading && orders.length === 0) {
    return <div className="p-20 text-center animate-pulse text-xs font-bold uppercase tracking-widest text-gray-400">Syncing Pipeline...</div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300 font-sans text-gray-800 text-left">
      
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-lg font-black text-gray-800 font-display uppercase tracking-wider">Order Sales Pipeline</h2>
        </div>
        <button 
          onClick={() => { setEditingOrder(null); setShowForm(true); }}
          className="px-4 py-2 bg-[#6a4a63] hover:bg-[#5c3e55] text-white text-xs font-bold uppercase rounded-lg shadow-sm cursor-pointer"
        >
          + Draft New Order
        </button>
      </div>

      {/* Orders Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-3">Date</th>
                <th className="p-3">Client</th>
                <th className="p-3 text-right">Total Amount</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order: any) => (
                <React.Fragment key={order.id}>
                  <tr 
                    onClick={() => toggleOrder(order.id)}
                    className={cn(
                      "hover:bg-gray-50/50 cursor-pointer transition-colors",
                      expandedOrderId === order.id ? "bg-gray-50" : ""
                    )}
                  >
                    <td className="p-3 text-gray-500">
                      {new Date(order.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="p-3">
                      <div className="text-[13px] font-bold text-gray-800 flex items-center gap-2">
                        {order.customerName}
                        {expandedOrderId === order.id ? <ChevronUp size={14} className="text-gray-700" /> : <ChevronDown size={14} className="text-gray-400" />}
                      </div>
                    </td>
                    <td className="p-3 text-right font-bold text-gray-700">
                      {isAdmin ? `₹${order.totalAmount?.toLocaleString('en-IN')}` : "•••"}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                          order.status === 'FULFILLED' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"
                        )}>
                          {order.status}
                        </span>
                        {order.status === "FULFILLED" && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setReturningOrder(order); }} 
                            className="text-[8px] font-black text-[#6a4a63] uppercase hover:underline mt-1 flex items-center gap-0.5 cursor-pointer"
                          >
                            <RotateCcw size={10} /> Process Return
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {order.status === 'PENDING' ? (
                          <>
                            <button 
                              onClick={(e) => handleEdit(e, order)}
                              className="px-2 py-1 border border-gray-200 rounded text-gray-500 hover:bg-gray-50 transition-colors font-bold uppercase text-[9px]"
                            >
                              Edit
                            </button>
                            {isAdmin && (
                              <button 
                                onClick={(e) => handleDelete(e, order.id)}
                                className="px-2 py-1 border border-gray-200 rounded text-rose-500 hover:bg-rose-50 transition-colors font-bold uppercase text-[9px]"
                              >
                                Delete
                              </button>
                            )}
                            <button 
                              onClick={(e) => openFulfillModal(e, order)}
                              className="px-3 py-1 bg-[#6a4a63] hover:bg-[#5c3e55] text-white rounded text-[9px] font-bold uppercase tracking-wider transition-colors shadow-sm"
                            >
                              Fulfill
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Completed</span>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded parts breakdown */}
                  {expandedOrderId === order.id && (
                    <tr className="bg-gray-50/40">
                      <td colSpan={5} className="p-5 pl-8 border-t border-b border-gray-150">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <p className="text-[10px] font-bold text-[#006666] uppercase tracking-wider mb-3">Original Order Items:</p>
                            <div className="space-y-2 max-w-md">
                              {order.items.map((oi: any) => (
                                <div key={oi.id} className="flex justify-between border-b border-gray-200 pb-1.5 text-xs">
                                  <span className="font-bold text-gray-700">{oi.item.name}</span>
                                  <span className="text-gray-500 font-mono">{oi.quantity} {oi.item.unit}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                            <p className="text-[10px] font-bold text-[#6a4a63] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <RotateCcw size={12} /> Return History Logs:
                            </p>
                            <OrderReturnHistory order={order} orderId={order.id} isAdmin={isAdmin} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* DISPATCH CONFIRMATION MODAL */}
      {fulfillingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200 text-xs font-medium text-gray-600 space-y-5 text-left">
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-black uppercase text-gray-800 tracking-wider">Dispatch Confirmation</h3>
                <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest mt-0.5">Verify stock and departure logs</p>
              </div>
              <div className="text-right">
                <label className="text-[9px] font-bold text-gray-400 uppercase block mb-1">Departure Date</label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={dispatchDate}
                    onChange={(e) => setDispatchDate(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none focus:ring-1 focus:ring-[#6a4a63]"
                  />
                  <Calendar size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
              {fulfillingOrder.items.map((oi: any) => {
                const requested = overrideQuantities.find(q => q.orderItemId === oi.id)?.newQuantity ?? oi.quantity;
                const liveItem = inventory.find((inv: any) => inv.id === oi.itemId);
                const stockOnHand = liveItem?.quantityOnHand || 0;
                const gap = Math.max(0, requested - stockOnHand);
                const hasFinishedStock = stockOnHand >= requested;
                const activeBom = liveItem?.boms?.[0]; 
                
                let maxPossibleBuild = 0;
                if (activeBom && activeBom.components) {
                  const componentLimits = activeBom.components.map((comp: any) => {
                    const invComp = inventory.find((inv: any) => inv.id === comp.componentItemId);
                    const available = invComp?.quantityOnHand || 0;
                    return Math.floor(available / comp.quantity);
                  });
                  maxPossibleBuild = Math.min(...componentLimits);
                }
                const canBuildGap = maxPossibleBuild >= gap;

                return (
                  <div key={oi.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-gray-800 text-xs">{oi.item.name}</h4>
                        <span className="text-[9px] text-gray-400 font-mono">SKU: {oi.item.sku}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Quantity</span>
                        <input 
                          type="number" 
                          min="1"
                          value={requested}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setOverrideQuantities(prev => prev.map(q => q.orderItemId === oi.id ? { ...q, newQuantity: val } : q));
                          }}
                          className="w-16 p-1 border border-gray-200 rounded text-center text-xs font-bold text-gray-700 bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-[10px] pt-2 border-t border-gray-150">
                      <div>
                        <span className="text-gray-400 block uppercase font-bold tracking-wider mb-0.5">Finished Stock status</span>
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-black uppercase border",
                            hasFinishedStock ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                          )}>
                            {hasFinishedStock ? "Sufficient" : "Insufficient"}
                          </span>
                          <span className="font-bold text-gray-600">On Hand: {stockOnHand} {oi.item.unit}</span>
                        </div>
                      </div>

                      {!hasFinishedStock && (
                        <div>
                          <span className="text-gray-400 block uppercase font-bold tracking-wider mb-0.5">Auto Assembly Line (BOM)</span>
                          {activeBom ? (
                            <div className="flex items-center gap-1.5">
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[8px] font-black uppercase border",
                                canBuildGap ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                              )}>
                                {canBuildGap ? "Assemble Gap" : "Shortage Ingredients"}
                              </span>
                              <span className="text-gray-500">Can produce: {maxPossibleBuild}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic font-bold">No BOM Assembly mapped</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                onClick={() => setFulfillingOrder(null)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmFulfill}
                className="px-5 py-2 bg-[#6a4a63] hover:bg-[#5c3e55] text-white text-xs font-bold uppercase rounded-lg shadow-sm cursor-pointer"
              >
                Complete Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SALES ORDER DRAFT MODAL */}
      <Drawer isOpen={showForm} onClose={() => setShowForm(false)} title={editingOrder ? "Edit Draft Order" : "Draft New Sales Order"}>
        <SalesOrderForm 
          editingOrder={editingOrder} 
          onSuccess={() => { setShowForm(false); refreshData(); }} 
        />
      </Drawer>

      {/* RETURNS MODAL */}
      {returningOrder && (
        <ReturnModal 
          order={returningOrder} 
          onClose={() => setReturningOrder(null)} 
          onSuccess={() => { setReturningOrder(null); refreshData(); }} 
        />
      )}

    </div>
  );
}
