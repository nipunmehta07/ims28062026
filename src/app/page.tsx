// src/app/page.tsx
'use client';

import {
  TrendingUp, Package, ShoppingCart, AlertTriangle,
  ArrowUpRight, Plus, FileText, Clock, Truck, CircleAlert
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const revenueData = [
  { day: 'Mon', revenue: 0 },
  { day: 'Tue', revenue: 0 },
  { day: 'Wed', revenue: 0 },
  { day: 'Thu', revenue: 0 },
  { day: 'Fri', revenue: 0 },
  { day: 'Sat', revenue: 0 },
  { day: 'Sun', revenue: 0 },
];

export default function Dashboard() {
  return (
    <div className="space-y-6 max-w-6xl">
      {/* Welcome Header */}
      <div className="bg-gradient-to-br from-accent/5 to-transparent rounded-2xl p-6 border border-accent/10">
        <h1 className="text-xl font-semibold text-text-primary">Dashboard</h1>
        <p className="text-sm text-text-secondary">Here's what's happening with your business today.</p>
      </div>

      {/* KPI Cards - Rounder borders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-bg-secondary border border-border rounded-2xl p-5 hover:shadow-lg hover:border-accent/20 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Total Revenue</span>
            <TrendingUp className="w-4 h-4 text-text-tertiary" />
          </div>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-2xl font-semibold text-text-primary">₹0</span>
            <span className="text-xs text-success flex items-center gap-0.5 bg-success/10 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />12.5%
            </span>
          </div>
          <p className="text-xs text-text-tertiary mt-1">vs last 7 days</p>
        </div>

        <div className="bg-bg-secondary border border-border rounded-2xl p-5 hover:shadow-lg hover:border-accent/20 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Active Orders</span>
            <ShoppingCart className="w-4 h-4 text-text-tertiary" />
          </div>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-2xl font-semibold text-text-primary">0</span>
            <span className="text-xs text-text-tertiary bg-bg-tertiary px-2 py-0.5 rounded-full">0%</span>
          </div>
          <p className="text-xs text-text-tertiary mt-1">vs last 7 days</p>
        </div>

        <div className="bg-bg-secondary border border-border rounded-2xl p-5 hover:shadow-lg hover:border-accent/20 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Inventory Value</span>
            <Package className="w-4 h-4 text-text-tertiary" />
          </div>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-2xl font-semibold text-text-primary">₹0</span>
            <span className="text-xs text-success flex items-center gap-0.5 bg-success/10 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />8.3%
            </span>
          </div>
          <p className="text-xs text-text-tertiary mt-1">vs last 7 days</p>
        </div>

        <div className="bg-bg-secondary border border-border rounded-2xl p-5 hover:shadow-lg hover:border-accent/20 transition-all duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Low Stock Items</span>
            <AlertTriangle className="w-4 h-4 text-text-tertiary" />
          </div>
          <div className="mt-2 flex items-end justify-between">
            <span className="text-2xl font-semibold text-text-primary">00</span>
            <span className="text-xs text-error flex items-center gap-0.5 bg-error/10 px-2 py-0.5 rounded-full">
              <ArrowUpRight className="w-3 h-3" />100%
            </span>
          </div>
          <p className="text-xs text-text-tertiary mt-1">vs last 7 days</p>
        </div>
      </div>

      {/* Revenue Analytics + System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-bg-secondary border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-text-secondary">Revenue Analytics</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xl font-semibold text-text-primary">₹0</span>
                <span className="text-xs text-text-tertiary">vs previous 7 days</span>
                <span className="text-xs font-medium text-success bg-success/10 px-2 py-0.5 rounded-full">+12.5%</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="px-3 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-xl transition-colors">7 Days</button>
              <button className="px-3 py-1 text-xs text-white bg-accent rounded-xl">30 Days</button>
              <button className="px-3 py-1 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-xl transition-colors">Custom</button>
            </div>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" vertical={false} />
                <XAxis dataKey="day" stroke="#6e6e8a" axisLine={false} tickLine={false} fontSize={11} />
                <YAxis stroke="#6e6e8a" axisLine={false} tickLine={false} fontSize={11} tickFormatter={(v) => `₹${v/1000}K`} />
                <Tooltip contentStyle={{ backgroundColor: '#14141e', border: '1px solid #2a2a3e', borderRadius: '12px', color: '#fff', fontSize: '12px', padding: '8px 12px' }} formatter={(v) => [`₹${v}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-bg-secondary border border-border rounded-2xl p-5">
          <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 bg-bg-tertiary rounded-xl">
              <span className="text-sm text-text-secondary">Database Status</span>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-success rounded-full"></span>
                <span className="text-sm text-text-primary">Cloud Sync: Online</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-bg-tertiary rounded-xl">
              <span className="text-sm text-text-secondary">Infrastructure</span>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-success rounded-full"></span>
                <span className="text-sm text-text-primary">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Market Demand + Critical Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-bg-secondary border border-border rounded-2xl p-5">
          <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">Market Demand</h3>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">High Demand</span>
              <div className="flex items-center gap-3">
                <div className="w-24 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                  <div className="w-[78%] h-full bg-success rounded-full"></div>
                </div>
                <span className="text-sm text-text-primary font-medium">78%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Medium Demand</span>
              <div className="flex items-center gap-3">
                <div className="w-24 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                  <div className="w-[16%] h-full bg-warning rounded-full"></div>
                </div>
                <span className="text-sm text-text-primary font-medium">16%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Low Demand</span>
              <div className="flex items-center gap-3">
                <div className="w-24 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                  <div className="w-[6%] h-full bg-error rounded-full"></div>
                </div>
                <span className="text-sm text-text-primary font-medium">6%</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-text-tertiary mt-3">Top demand in: Faucets, Showers, Accessories</p>
        </div>

        <div className="bg-bg-secondary border border-border rounded-2xl p-5">
          <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">Critical Priority</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 bg-error/5 border border-error/10 rounded-xl">
              <CircleAlert className="w-4 h-4 text-error flex-shrink-0" />
              <div>
                <p className="text-sm text-text-primary">00 Items are critically low</p>
                <p className="text-xs text-text-secondary">Immediate restock required</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-warning/5 border border-warning/10 rounded-xl">
              <Clock className="w-4 h-4 text-warning flex-shrink-0" />
              <div>
                <p className="text-sm text-text-primary">3 Pending Orders</p>
                <p className="text-xs text-text-secondary">Awaiting processing</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-info/5 border border-info/10 rounded-xl">
              <Truck className="w-4 h-4 text-info flex-shrink-0" />
              <div>
                <p className="text-sm text-text-primary">2 Overdue Deliveries</p>
                <p className="text-xs text-text-secondary">Action required</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-bg-secondary border border-border rounded-2xl p-5">
        <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button className="flex items-center justify-center gap-2 p-3 bg-bg-tertiary hover:bg-bg-hover rounded-xl transition-colors border border-border text-sm text-text-secondary hover:border-accent/30">
            <Plus className="w-4 h-4 text-accent" /> Create Order
          </button>
          <button className="flex items-center justify-center gap-2 p-3 bg-bg-tertiary hover:bg-bg-hover rounded-xl transition-colors border border-border text-sm text-text-secondary hover:border-accent/30">
            <Package className="w-4 h-4 text-info" /> Stock Inward
          </button>
          <button className="flex items-center justify-center gap-2 p-3 bg-bg-tertiary hover:bg-bg-hover rounded-xl transition-colors border border-border text-sm text-text-secondary hover:border-accent/30">
            <ShoppingCart className="w-4 h-4 text-success" /> Add Item
          </button>
          <button className="flex items-center justify-center gap-2 p-3 bg-bg-tertiary hover:bg-bg-hover rounded-xl transition-colors border border-border text-sm text-text-secondary hover:border-accent/30">
            <FileText className="w-4 h-4 text-warning" /> View Reports
          </button>
          <button className="flex items-center justify-center gap-2 p-3 bg-bg-tertiary hover:bg-bg-hover rounded-xl transition-colors border border-border text-sm text-text-secondary hover:border-accent/30">
            <AlertTriangle className="w-4 h-4 text-error" /> Low Stock
          </button>
        </div>
      </div>
    </div>
  );
}