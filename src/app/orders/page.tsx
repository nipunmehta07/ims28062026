'use client';

import OrderBook from '@/components/OrderBook';

export default function OrdersPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">Orders Pipeline</h1>
          <p className="text-sm text-text-secondary">Process sales orders, manage drafts, and track customer returns</p>
        </div>
      </div>
      <OrderBook />
    </div>
  );
}