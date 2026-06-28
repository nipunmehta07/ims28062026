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
import Drawer from "./ui/Drawer";
import ReturnModal from "./ui/ReturnModal"; 
import toast from "react-hot-toast";
import { ChevronDown, ChevronUp, Package, AlertCircle, Hammer, Calendar, RotateCcw } from "lucide-react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "./ui/Table";

/**
 * Helper component to fetch and display return logs and calculate net value
 */
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

  // Calculate the total credit value by matching returned items to sale prices
  const totalCredit = logs.reduce((acc, log) => {
    const originalItem = order.items.find((oi: any) => oi.itemId === log.itemId);
    const price = originalItem?.salePrice || 0;
    return acc + (log.changeQty * price);
  }, 0);

  const netValue = (order.totalAmount || 0) - totalCredit;

  if (loading) return <p className="text-[10px] font-black uppercase animate-pulse text-gray-400">Loading history...</p>;
  
  if (logs.length === 0) {
    return <p className="text-[10px] font-bold text-gray-300 uppercase italic text-left">No items returned yet.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {logs.map((log) => {
          const originalItem = order.items.find((oi: any) => oi.itemId === log.itemId);
          const creditAmount = log.changeQty * (originalItem?.salePrice || 0);

          return (
            <div key={log.id} className="flex justify-between items-center p-3 bg-white border border-rose-100 rounded-lg shadow-sm">
              <div className="text-left">
                <p className="text-[11px] font-black uppercase text-gray-800">{log.item.name}</p>
                <p className="text-[9px] font-bold text-rose-400 uppercase tracking-tight">
                  {log.reason.split('(')[0]}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-black text-rose-600">+{log.changeQty} {log.item.unit}</p>
                {/* Hide individual line credit for staff */}
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

      {/* FINANCIAL SUMMARY BLOCK - ONLY VISIBLE TO ADMIN */}
      {isAdmin && (
        <div className="mt-6 pt-4 border-t border-rose-200 space-y-2">
          <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <span>Original Total</span>
            <span>₹{order.totalAmount?.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-[10px] font-black text-rose-500 uppercase tracking-widest">
            <span>Total Returns (Credit)</span>
            <span>- ₹{totalCredit.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between p-3 bg-black text-white rounded-xl mt-2 shadow-lg">
            <span className="text-[10px] font-black uppercase italic tracking-widest">Net Invoice Value</span>
            <span className="text-sm font-black italic">₹{netValue.toLocaleString('en-IN')}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrderBook() {
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
    return <div className="p-20 text-center animate-pulse text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing Pipeline...</div>;
  }

  return (
    <div className="flex flex-col gap-6 font-sans pb-24">
      <Card variant="default" padding="md" radius="lg" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-left">
          <h2 className="text-lg font-black text-gray-900 italic tracking-tight uppercase">Order Pipeline</h2>
          <p className="text-[9px] text-gray-400 uppercase font-bold tracking-widest">Zoie India • Fulfillment Center</p>
        </div>
        <Button onClick={() => { setEditingOrder(null); setShowForm(true); }}>
          + Draft New Order
        </Button>
      </Card>

      <Card variant="default" padding="none" radius="lg">
        <Table minWidth="700px">
          <TableHeader>
            <TableRow hover={false} className="bg-gradient-to-r from-emerald-50/50 via-white to-teal-50/50 dark:from-emerald-950/30 dark:via-zinc-900 dark:to-teal-950/30">
              <TableHead>Date</TableHead>
              <TableHead>Client</TableHead>
              <TableHead align="right">Total</TableHead>
              <TableHead align="center">Status</TableHead>
              <TableHead align="right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order: any) => (
              <React.Fragment key={order.id}>
                <TableRow 
                  onClick={() => toggleOrder(order.id)}
                  selected={expandedOrderId === order.id}
                  hover
                >
                  <TableCell>
                    {new Date(order.orderDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </TableCell>
                  <TableCell>
                    <div className="text-[13px] font-black uppercase flex flex-col gap-1 text-left">
                      <div className="flex items-center gap-2">
                        {order.customerName}
                        {expandedOrderId === order.id ? <ChevronUp size={12}/> : <ChevronDown size={12} className="text-gray-300"/>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell align="right" className="text-sm font-black italic">
                    {isAdmin ? (
                      `₹${order.totalAmount?.toLocaleString('en-IN')}`
                    ) : (
                      <span className="text-gray-300 font-bold tracking-widest text-[9px]">•••</span>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <div className="flex flex-col items-center gap-1">
                      <Badge variant={order.status === 'FULFILLED' ? 'success' : 'warning'} size="md">
                        {order.status}
                      </Badge>
                      {order.status === "FULFILLED" && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setReturningOrder(order); }} 
                          className="text-[8px] font-black text-blue-500 uppercase hover:underline mt-1 flex items-center gap-1"
                        >
                          <RotateCcw size={10} /> Process Return
                        </button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex items-center justify-end gap-2">
                      {order.status === 'PENDING' ? (
                        <>
                          <Button variant="ghost" size="sm" onClick={(e) => handleEdit(e, order)}>
                            Edit
                          </Button>
                          {isAdmin && (
                            <Button variant="ghost" size="sm" onClick={(e) => handleDelete(e, order.id)} className="text-rose-400 hover:text-rose-600">
                              Delete
                            </Button>
                          )}
                          <Button variant="primary" size="sm" onClick={(e) => openFulfillModal(e, order)} className="ml-2">
                            Fulfill
                          </Button>
                        </>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Completed</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>

                {expandedOrderId === order.id && (
                  <TableRow className="bg-gray-50/30 border-l-4 border-black animate-in fade-in">
                    <TableCell colSpan={5} className="p-4 md:p-6 lg:p-8">
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-12">
                          <div className="text-left">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-6">Original Order Items</h4>
                            <div className="space-y-4">
                              {order.items.map((oi: any) => (
                                 <div key={oi.id} className="flex justify-between border-b border-gray-100 pb-2">
                                   <span className="text-[12px] font-black uppercase text-gray-600">{oi.item.name}</span>
                                   <span className="text-[12px] font-bold text-gray-400">{oi.quantity} {oi.item.unit}</span>
                                 </div>
                              ))}
                            </div>
                          </div>

                          <div className="bg-rose-50/30 p-6 rounded-2xl border border-rose-100/50 text-left">
                            <div className="flex items-center gap-2 mb-6">
                              <RotateCcw size={14} className="text-rose-400" />
                              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400">Return Activity</h4>
                            </div>
                            
                            <OrderReturnHistory order={order} orderId={order.id} isAdmin={isAdmin} />
                            
                            <p className="text-[8px] font-bold text-rose-300 uppercase mt-6 pt-4 border-t border-rose-100/50">
                              Zoie India • Internal Audit Log
                            </p>
                          </div>
                       </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </Card>

      {fulfillingOrder && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border border-gray-100 p-8 space-y-6 text-left">
            <div className="flex justify-between items-start border-b border-gray-100 pb-4">
              <div className="text-left">
                <h3 className="text-sm font-black uppercase italic tracking-tight">Dispatch Confirmation</h3>
                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1">Verify stock and set departure date</p>
              </div>
              <div className="text-right">
                <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mb-1">Dispatched On</label>
                <div className="relative">
                  <input 
                    type="date" 
                    value={dispatchDate}
                    onChange={(e) => setDispatchDate(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[11px] font-black outline-none focus:border-black"
                  />
                  <Calendar size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
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
                  <div key={oi.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-4 mb-3 last:mb-0">
                    <div className="flex-1 text-left">
                      <p className="text-[11px] font-black uppercase text-gray-900 truncate w-48">{oi.item.name}</p>
                      <div className="flex flex-col gap-1 mt-1.5">
                        {hasFinishedStock ? (
                          <span className="text-[8px] font-black uppercase bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded w-fit flex items-center gap-1">
                            <Package size={10} /> ✓ Ready to Ship ({stockOnHand})
                          </span>
                        ) : (
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded w-fit flex items-center gap-1 ${
                            canBuildGap ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {canBuildGap ? <><Hammer size={10} /> ⚙ Auto-Build Ready</> : <><AlertCircle size={10} /> ⚠ Shortage</>}
                          </span>
                        )}
                      </div>
                    </div>
                    <input 
                      type="number" 
                      className="w-16 p-2 rounded-lg text-center font-black text-xs border border-gray-200 focus:border-black outline-none"
                      value={requested}
                      onChange={(e) => setOverrideQuantities(prev => prev.map(q => q.orderItemId === oi.id ? { ...q, newQuantity: parseInt(e.target.value) || 0 } : q))}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setFulfillingOrder(null)} className="flex-1">Cancel</Button>
              <Button variant="primary" onClick={handleConfirmFulfill} className="flex-1">Confirm Dispatch</Button>
            </div>
          </div>
        </div>
      )}

      <Drawer isOpen={showForm} onClose={() => { setShowForm(false); setEditingOrder(null); }} title={editingOrder ? "Edit Draft" : "Draft Order"}>
        <SalesOrderForm 
          key={editingOrder ? editingOrder.id : 'new'} 
          initialOrder={editingOrder}
          onCancel={() => { setShowForm(false); setEditingOrder(null); }} 
          onSuccess={() => { setShowForm(false); setEditingOrder(null); refreshData(); }} 
        />
      </Drawer>

      {returningOrder && (
        <ReturnModal 
          order={returningOrder} 
          onClose={() => setReturningOrder(null)} 
          onSuccess={() => { 
            setReturningOrder(null); 
            refreshData(); 
          }}
        />
      )}
    </div>
  );
}