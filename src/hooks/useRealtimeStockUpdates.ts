"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface StockUpdate {
  id: string;
  itemId: string;
  itemName: string;
  sku: string;
  changeType: "INWARD" | "OUTWARD" | "ADJUSTMENT";
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  timestamp: Date;
}

interface UseRealtimeStockUpdatesOptions {
  enabled?: boolean;
  onUpdate?: (update: StockUpdate) => void;
  pollInterval?: number;
}

export function useRealtimeStockUpdates(options: UseRealtimeStockUpdatesOptions = {}) {
  const { enabled = true, onUpdate, pollInterval = 10000 } = options;
  const [updates, setUpdates] = useState<StockUpdate[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const generateMockUpdate = useCallback((): StockUpdate => {
    const itemNames = ["Widget A", "Widget B", "Gadget X", "Component Y", "Part Z", "Assembly Kit"];
    const skus = ["WGT-001", "WGT-002", "GDG-001", "CMP-001", "PRT-001", "ASK-001"];
    const changeTypes: StockUpdate["changeType"][] = ["INWARD", "OUTWARD", "ADJUSTMENT"];
    const reasons = [
      "PO-2024-001 Received",
      "SO-2024-001 Fulfilled",
      "Manual Adjustment",
      "Inventory Count Correction",
      "Return Item",
      "Damaged Stock",
    ];

    const itemIndex = Math.floor(Math.random() * itemNames.length);
    const previousQty = Math.floor(Math.random() * 200);
    const changeQty = Math.floor(Math.random() * 50) - 25; // Can be positive or negative
    const changeType = changeTypes[Math.floor(Math.random() * changeTypes.length)];

    let newQty: number;
    if (changeType === "OUTWARD") {
      newQty = Math.max(0, previousQty - Math.abs(changeQty));
    } else {
      newQty = previousQty + Math.abs(changeQty);
    }

    return {
      id: `update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      itemId: `item-${itemIndex + 1}`,
      itemName: itemNames[itemIndex],
      sku: skus[itemIndex],
      changeType,
      quantity: Math.abs(changeQty),
      previousQuantity: previousQty,
      newQuantity: newQty,
      reason: reasons[Math.floor(Math.random() * reasons.length)],
      timestamp: new Date(),
    };
  }, []);

  const connect = useCallback(() => {
    if (!enabled) return;

    // Simulate SSE connection with polling
    intervalRef.current = setInterval(() => {
      // Randomly generate an update (30% chance per interval)
      if (Math.random() > 0.7) {
        const update = generateMockUpdate();
        setUpdates((prev) => [update, ...prev.slice(0, 49)]); // Keep last 50 updates
        setLastUpdate(new Date());
        onUpdate?.(update);
      }
    }, pollInterval);
  }, [enabled, pollInterval, generateMockUpdate, onUpdate]);

  const disconnect = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const clearUpdates = useCallback(() => {
    setUpdates([]);
    setLastUpdate(null);
  }, []);

  // Start/stop connection based on enabled flag
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (enabled) {
      setIsConnected(true);
      connect();
    } else {
      setIsConnected(false);
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return {
    updates,
    isConnected,
    lastUpdate,
    clearUpdates,
    reconnect: connect,
  };
}

export default useRealtimeStockUpdates;