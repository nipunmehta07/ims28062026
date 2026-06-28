"use client";

import { forwardRef, ReactNode, useState, useEffect } from "react";
import {
  DetailDrawer,
  type DetailDrawerTab,
  type DetailDrawerProps,
} from "@/app/components/composite/DetailDrawer";
import { Badge, Button } from "@/app/components/ui";
import {
  Package,
  Clock,
  FileText,
  RotateCcw,
  User,
  MapPin,
  Phone,
  Calendar,
} from "lucide-react";
import { getOrderReturnLogs } from "@/app/actions";
import ReturnModal from "@/app/components/ui/ReturnModal";

export interface OutwardOrder {
  id: string;
  customerName: string;
  orderDate: string | Date;
  status: string;
  totalAmount: number;
  discountPercent?: number;
  items: Array<{
    id: string;
    itemId: string;
    quantity: number;
    salePrice: number;
    item: {
      id: string;
      name: string;
      sku: string;
      unit: string;
    };
  }>;
  notes?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface OutwardDetailDrawerProps extends Omit<DetailDrawerProps, "isOpen" | "onClose" | "title" | "children"> {
  isOpen: boolean;
  onClose: () => void;
  order: OutwardOrder | null;
  onReturn?: () => void;
}

interface TimelineEvent {
  id: string;
  type: "created" | "updated" | "fulfilled" | "return";
  label: string;
  description: string;
  timestamp: string;
}

export const OutwardDetailDrawer = forwardRef<HTMLDivElement, OutwardDetailDrawerProps>(
  ({ isOpen, onClose, order, onReturn, ...props }, ref) => {
    const [returnLogs, setReturnLogs] = useState<
      Array<{
        id: string;
        changeQty: number;
        reason: string;
        createdAt: string;
        item: { name: string; unit: string };
      }>
    >([]);
    const [isLoadingReturns, setIsLoadingReturns] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);

    useEffect(() => {
      if (isOpen && order?.id) {
        setIsLoadingReturns(true);
        getOrderReturnLogs(order.id)
          .then((logs) => {
            setReturnLogs(
              (logs as Array<{
                id: string;
                changeQty: number;
                reason: string;
                createdAt: string | Date;
                item: { name: string; unit: string };
              }>).map((log) => ({
                ...log,
                createdAt:
                  typeof log.createdAt === "string"
                    ? log.createdAt
                    : log.createdAt.toISOString(),
              }))
            );
          })
          .catch(console.error)
          .finally(() => setIsLoadingReturns(false));
      }
    }, [isOpen, order?.id]);

    if (!order) return null;

    const formatDate = (date: string | Date | undefined) => {
      if (!date) return "-";
      const d = typeof date === "string" ? new Date(date) : date;
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    const formatDateTime = (date: string | Date | undefined) => {
      if (!date) return "-";
      const d = typeof date === "string" ? new Date(date) : date;
      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    const statusVariant = (status: string): "success" | "warning" | "danger" | "neutral" | "info" => {
      switch (status.toUpperCase()) {
        case "FULFILLED":
          return "success";
        case "PENDING":
          return "warning";
        case "CANCELLED":
          return "danger";
        default:
          return "neutral";
      }
    };

    const timelineEvents: TimelineEvent[] = [
      {
        id: "1",
        type: "created",
        label: "Record Created",
        description: "Stock outward record initiated",
        timestamp: order.createdAt
          ? formatDateTime(order.createdAt)
          : formatDateTime(order.orderDate),
      },
    ];

    if (order.updatedAt && order.updatedAt !== order.createdAt) {
      timelineEvents.push({
        id: "2",
        type: "updated",
        label: "Last Updated",
        description: "Record was modified",
        timestamp: formatDateTime(order.updatedAt),
      });
    }

    // Add return events
    returnLogs.forEach((log) => {
      timelineEvents.push({
        id: log.id,
        type: "return",
        label: "Return Processed",
        description: `${log.changeQty} ${log.item.unit} returned - ${log.reason}`,
        timestamp: formatDateTime(log.createdAt),
      });
    });

    // Sort timeline by timestamp descending
    timelineEvents.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Calculate totals for display
    const subtotal = order.items.reduce(
      (sum, item) => sum + item.quantity * item.salePrice,
      0
    );
    const discount = (subtotal * (order.discountPercent || 0)) / 100;
    const total = subtotal - discount;

    // Tab: Items
    const itemsTab: DetailDrawerTab = {
      id: "items",
      label: "Items",
      icon: <Package size={12} />,
      content: (
        <div className="space-y-4">
          {/* Order Summary Card */}
          <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 rounded-xl border border-emerald-500/20">
            <div className="grid grid-cols-3 gap-4 text-left">
              <div>
                <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  Subtotal
                </p>
                <p className="text-[14px] font-black text-gray-900 dark:text-white mt-1">
                  ₹{subtotal.toLocaleString("en-IN")}
                </p>
              </div>
              {discount > 0 && (
                <div>
                  <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">
                    Discount ({order.discountPercent}%)
                  </p>
                  <p className="text-[14px] font-black text-rose-600 mt-1">
                    -₹{discount.toLocaleString("en-IN")}
                  </p>
                </div>
              )}
              <div>
                <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  Total
                </p>
                <p className="text-[16px] font-black bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent mt-1">
                  ₹{total.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-emerald-500/10 rounded-xl overflow-hidden bg-white/50 dark:bg-zinc-900/50">
            <table className="w-full text-left">
              <thead className="bg-gradient-to-r from-emerald-500/10 to-teal-500/5">
                <tr>
                  <th className="px-4 py-3 text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                    Product
                  </th>
                  <th className="px-4 py-3 text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest text-right">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest text-right">
                    Price
                  </th>
                  <th className="px-4 py-3 text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest text-right">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-500/10">
                {order.items.map((orderItem) => (
                  <tr key={orderItem.id}>
                    <td className="px-4 py-3">
                      <p className="text-[12px] font-black text-gray-900 dark:text-white">
                        {orderItem.item?.name || "Unknown Item"}
                      </p>
                      <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                        {orderItem.item?.sku || "-"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-[12px] font-black text-gray-900 dark:text-white text-right">
                      {orderItem.quantity} {orderItem.item?.unit || "pcs"}
                    </td>
                    <td className="px-4 py-3 text-[12px] font-black text-gray-900 dark:text-white text-right">
                      ₹{orderItem.salePrice.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-[12px] font-black bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent text-right">
                      ₹{(orderItem.quantity * orderItem.salePrice).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Return History */}
          {returnLogs.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest">
                Return History
              </h4>
              <div className="space-y-2">
                {returnLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex justify-between items-center p-3 bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30 border border-rose-100 dark:border-rose-900/50 rounded-xl"
                  >
                    <div className="text-left">
                      <p className="text-[11px] font-black text-rose-700 dark:text-rose-300">
                        {log.item.name}
                      </p>
                      <p className="text-[9px] font-bold text-rose-500 dark:text-rose-400">
                        {log.reason}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[12px] font-black text-rose-600 dark:text-rose-300">
                        +{log.changeQty} {log.item.unit}
                      </p>
                      <p className="text-[8px] font-bold text-rose-400">
                        {formatDateTime(log.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ),
    };

    // Tab: Timeline
    const timelineTab: DetailDrawerTab = {
      id: "timeline",
      label: "Timeline",
      icon: <Clock size={12} />,
      content: (
        <div className="space-y-0">
          {timelineEvents.map((event, index) => (
            <div key={event.id} className="flex gap-4">
              {/* Timeline indicator with emerald connector */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    event.type === "return"
                      ? "bg-rose-100 dark:bg-rose-900/50 border-rose-300 dark:border-rose-700"
                      : event.type === "created"
                        ? "bg-emerald-100 dark:bg-emerald-900/50 border-emerald-300 dark:border-emerald-700"
                        : "bg-gray-100 dark:bg-zinc-800 border-gray-300 dark:border-zinc-600"
                  }`}
                >
                  {event.type === "return" ? (
                    <RotateCcw
                      size={16}
                      className="text-rose-600 dark:text-rose-300"
                    />
                  ) : event.type === "created" ? (
                    <Package
                      size={16}
                      className="text-emerald-600 dark:text-emerald-300"
                    />
                  ) : (
                    <Clock
                      size={16}
                      className="text-gray-400 dark:text-gray-500"
                    />
                  )}
                </div>
                {index < timelineEvents.length - 1 && (
                  <div className="w-px flex-1 bg-gradient-to-b from-emerald-500/50 to-emerald-500/20 my-2" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-6 text-left">
                <p className="text-[12px] font-black text-gray-900 dark:text-white">
                  {event.label}
                </p>
                <p className="text-[10px] font-bold text-gray-500 mt-0.5">
                  {event.description}
                </p>
                <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {event.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>
      ),
    };

    // Tab: Notes
    const notesTab: DetailDrawerTab = {
      id: "notes",
      label: "Notes",
      icon: <FileText size={12} />,
      content: (
        <div className="space-y-4 text-left">
          {order.notes ? (
            <div className="p-4 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-xl border border-emerald-500/10">
              <p className="text-[12px] font-bold text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {order.notes}
              </p>
            </div>
          ) : (
            <div className="p-8 text-center">
              <FileText
                size={32}
                className="mx-auto text-emerald-300 dark:text-emerald-600 mb-2"
              />
              <p className="text-[11px] font-bold text-gray-400">
                No notes added
              </p>
            </div>
          )}
        </div>
      ),
    };

    const tabs: DetailDrawerTab[] = [itemsTab, timelineTab, notesTab];

    return (
      <>
        <DetailDrawer
          ref={ref}
          isOpen={isOpen}
          onClose={onClose}
          title="Stock Outward Details"
          subtitle={`Order for ${order.customerName}`}
          tabs={tabs}
          size="lg"
          footerActions={[
            {
              label: "Process Return",
              icon: <RotateCcw size={14} />,
              variant: "secondary",
              onClick: () => setShowReturnModal(true),
            },
          ]}
          {...props}
        >
          {/* Additional header info - Glassmorphism cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 rounded-xl border border-emerald-500/10">
              <Calendar size={14} className="text-emerald-500" />
              <div>
                <p className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  Date
                </p>
                <p className="text-[11px] font-black text-gray-900 dark:text-white">
                  {formatDate(order.orderDate)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 rounded-xl border border-emerald-500/10">
              <User size={14} className="text-emerald-500" />
              <div>
                <p className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  Client
                </p>
                <p className="text-[11px] font-black text-gray-900 dark:text-white truncate">
                  {order.customerName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 rounded-xl border border-emerald-500/10">
              <Package size={14} className="text-emerald-500" />
              <div>
                <p className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  Items
                </p>
                <p className="text-[11px] font-black text-gray-900 dark:text-white">
                  {order.items.length} products
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 rounded-xl border border-emerald-500/10">
              <div>
                <p className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  Status
                </p>
                <Badge variant={statusVariant(order.status)} size="sm" dot>
                  {order.status}
                </Badge>
              </div>
            </div>
          </div>
        </DetailDrawer>

        {/* Return Modal */}
        {showReturnModal && (
          <ReturnModal
            order={{
              id: order.id,
              customerName: order.customerName,
              items: order.items.map((i) => ({
                id: i.id,
                itemId: i.itemId,
                quantity: i.quantity,
                item: {
                  name: i.item?.name || "Unknown",
                },
              })),
            }}
            onClose={() => setShowReturnModal(false)}
            onSuccess={() => {
              setShowReturnModal(false);
              onReturn?.();
            }}
          />
        )}
      </>
    );
  }
);

OutwardDetailDrawer.displayName = "OutwardDetailDrawer";

export default OutwardDetailDrawer;