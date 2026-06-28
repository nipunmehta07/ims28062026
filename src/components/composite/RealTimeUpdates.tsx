"use client";

import { useState, useCallback } from "react";
import { useRealtimeStockUpdates, type StockUpdate } from "@/hooks/useRealtimeStockUpdates";
import { Badge } from "@/app/components/ui/Badge";
import { Button } from "@/app/components/ui/Button";
import {
  Bell,
  Package,
  Clock,
  X,
} from "lucide-react";

interface RealTimeUpdatesProps {
  className?: string;
}

export function RealTimeNotifications({ className = "" }: RealTimeUpdatesProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleUpdate = useCallback((_update: StockUpdate) => {
    setUnreadCount((prev) => prev + 1);
  }, []);

  const { updates, isConnected, lastUpdate, clearUpdates } = useRealtimeStockUpdates({
    enabled: true,
    onUpdate: handleUpdate,
    pollInterval: 15000, // 15 seconds
  });

  const handleNotificationClick = () => {
    setShowNotifications(true);
    setUnreadCount(0);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const getChangeTypeColor = (type: StockUpdate["changeType"]) => {
    switch (type) {
      case "INWARD":
        return "success";
      case "OUTWARD":
        return "warning";
      case "ADJUSTMENT":
        return "neutral";
      default:
        return "neutral";
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Connection Status Indicator */}
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
          }`}
          title={isConnected ? "Real-time updates active" : "Disconnected"}
        />

        {/* Notification Bell */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNotificationClick}
          className="relative w-10 h-10"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </div>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowNotifications(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-widest">
                  Stock Updates
                </span>
                <Badge variant={isConnected ? "success" : "danger"} size="sm" dot>
                  {isConnected ? "Live" : "Offline"}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                {lastUpdate && (
                  <span className="text-[9px] text-gray-400 flex items-center gap-1">
                    <Clock size={10} />
                    {formatTime(lastUpdate)}
                  </span>
                )}
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded"
                >
                  <X size={14} className="text-gray-400" />
                </button>
              </div>
            </div>

            {/* Updates List */}
            <div className="flex-1 overflow-y-auto max-h-64">
              {updates.length === 0 ? (
                <div className="p-8 text-center">
                  <Package size={24} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                    No recent updates
                  </p>
                  <p className="text-[9px] text-gray-400 mt-1">
                    Stock changes will appear here in real-time
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-zinc-800">
                  {updates.slice(0, 10).map((update) => (
                    <div
                      key={update.id}
                      className="p-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Package size={12} className="text-gray-400 shrink-0" />
                            <span className="text-[11px] font-bold truncate">
                              {update.itemName}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Badge variant={getChangeTypeColor(update.changeType)} size="sm">
                              {update.changeType}
                            </Badge>
                            <span className="font-mono">
                              {update.changeType === "OUTWARD" ? "-" : "+"}
                              {update.quantity}
                            </span>
                          </p>
                          <p className="text-[9px] text-gray-400 mt-1">
                            {update.reason}
                          </p>
                        </div>
                        <span className="text-[9px] text-gray-400 shrink-0">
                          {formatTime(update.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {updates.length > 0 && (
              <div className="p-3 border-t border-gray-100 dark:border-zinc-800">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearUpdates}
                  className="w-full"
                >
                  <X size={12} />
                  Clear All
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default RealTimeNotifications;