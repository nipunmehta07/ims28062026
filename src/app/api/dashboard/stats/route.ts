// src/app/api/dashboard/stats/route.ts
import { NextResponse } from 'next/server';

// Mock data - replace with your actual database queries
const dashboardStats = {
  revenue: {
    total: 48291,
    change: 12.5,
    trend: 'up' as const,
  },
  orders: {
    total: 342,
    change: 8.2,
    trend: 'up' as const,
  },
  inventory: {
    total: 129842,
    change: -2.4,
    trend: 'down' as const,
  },
  lowStock: {
    total: 7,
    change: 3,
    trend: 'up' as const,
  },
  revenueData: [
    { day: 'Mon', revenue: 4500 },
    { day: 'Tue', revenue: 6200 },
    { day: 'Wed', revenue: 7800 },
    { day: 'Thu', revenue: 5400 },
    { day: 'Fri', revenue: 8900 },
    { day: 'Sat', revenue: 10200 },
    { day: 'Sun', revenue: 7200 },
  ],
  recentActivity: [
    { id: 1, type: 'order', message: 'Order #1234 created', time: '2 hours ago' },
    { id: 2, type: 'inventory', message: 'Product A restocked', time: '4 hours ago' },
    { id: 3, type: 'order', message: 'Order #1233 shipped', time: '6 hours ago' },
    { id: 4, type: 'customer', message: 'New customer registered', time: '8 hours ago' },
    { id: 5, type: 'alert', message: 'Low stock alert: Product B', time: '12 hours ago' },
  ],
  systemStatus: {
    infrastructure: 'active',
    database: 'online',
    lastSync: '2 minutes ago',
  },
  marketDemand: {
    high: 78,
    medium: 16,
    low: 6,
    topCategories: ['Faucets', 'Showers', 'Accessories'],
  },
  criticalItems: [
    { type: 'stock', message: '0 Items are critically low', action: 'Immediate restock required', priority: 'urgent' },
    { type: 'orders', message: '3 Pending Orders', action: 'Awaiting processing', priority: 'pending' },
    { type: 'delivery', message: '2 Overdue Deliveries', action: 'Action required', priority: 'action' },
  ],
};

export async function GET() {
  // Simulate database delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return NextResponse.json(dashboardStats);
}