// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  TrendingUp, Package, ShoppingCart, AlertTriangle,
  ArrowUpRight, Plus, FileText, Clock, Truck, CircleAlert, Sparkles, Activity
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getDashboardStats, getRevenueData } from '@/app/actions';
import Link from 'next/link';

export default function Dashboard() {
  const { data: session } = useSession();
  const [greeting, setGreeting] = useState("Welcome back");
  const [stats, setStats] = useState({
    activeOrders: 0,
    totalRevenue: 0,
    inventoryValue: 0,
    lowStock: 0,
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [chartDays, setChartDays] = useState<number>(7);
  const [isLoading, setIsLoading] = useState(true);
  const [isChartLoading, setIsChartLoading] = useState(false);

  // Time-of-day greeting logic
  useEffect(() => {
    const hr = new Date().getHours();
    if (hr < 12) setGreeting("Good morning");
    else if (hr < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // Initial load — stats + chart
  useEffect(() => {
    async function loadInitial() {
      setIsLoading(true);
      try {
        const [statsData, chartResult] = await Promise.all([
          getDashboardStats(),
          getRevenueData(chartDays)
        ]);
        setStats(statsData);
        applyChartData(chartResult, chartDays);
      } catch (err) {
        console.error("Error loading dashboard metrics:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Chart-only reload when days toggle changes (skip initial)
  const [initialLoad, setInitialLoad] = useState(true);
  useEffect(() => {
    if (initialLoad) { setInitialLoad(false); return; }
    async function loadChart() {
      setIsChartLoading(true);
      try {
        const chartResult = await getRevenueData(chartDays);
        applyChartData(chartResult, chartDays);
      } catch (err) {
        console.error("Error loading chart data:", err);
      } finally {
        setIsChartLoading(false);
      }
    }
    loadChart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartDays]);

  function applyChartData(chartResult: any[] | null, days: number) {
    if (!chartResult || chartResult.length === 0) {
      const fallback = Array.from({ length: days }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (days - 1 - i));
        return {
          date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          amount: 0
        };
      });
      setRevenueData(fallback);
    } else {
      setRevenueData(chartResult);
    }
  }

  const displayName = session?.user?.name || session?.user?.username || "Staff User";

  // â”€â”€ Skeleton Loading State â”€â”€
  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl animate-in fade-in duration-300">
        {/* Header skeleton */}
        <div className="glass-card rounded-2xl p-6">
          <div className="skeleton h-6 w-64 mb-2" />
          <div className="skeleton h-4 w-96" />
        </div>

        {/* KPI cards skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="glass-card rounded-2xl p-5 stagger-enter" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex justify-between mb-4">
                <div className="skeleton h-3 w-24" />
                <div className="skeleton h-7 w-7 rounded-lg" />
              </div>
              <div className="skeleton h-7 w-32 mb-2" />
              <div className="skeleton h-3 w-20" />
            </div>
          ))}
        </div>

        {/* Chart skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 glass-card rounded-2xl p-5">
            <div className="skeleton h-4 w-32 mb-2" />
            <div className="skeleton h-56 w-full rounded-xl" />
          </div>
          <div className="glass-card rounded-2xl p-5">
            <div className="skeleton h-4 w-40 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="skeleton h-12 w-full rounded-xl" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="glass-card bg-mesh-gradient rounded-2xl p-6 relative overflow-hidden transition-all duration-300">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span
                className="text-[22px] font-semibold text-text-primary tracking-[-0.02em] leading-tight"

              >
                {greeting}, {displayName}!
              </span>
              <Sparkles className="w-4 h-4 text-accent animate-pulse" />
            </div>
            <p className="text-[13px] text-text-secondary leading-relaxed">
              Here's a live overview of Zoie India's metrics for today.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-success/15 border border-success/20 rounded-full">
            <span className="w-1.5 h-1.5 bg-success rounded-full pulse-status"></span>
            <span
              className="text-[10px] font-semibold text-success tracking-[0.12em] uppercase"

            >
              Operational
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards â€” Staggered entrance + animated stat numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue Card */}
        <div className="glass-card glow-card rounded-2xl p-5 relative overflow-hidden stagger-enter">
          <div className="absolute inset-0 bg-gradient-to-br from-success/5 via-transparent to-transparent opacity-50" />
          <div className="flex items-center justify-between relative z-10">
            <span
              className="text-[10px] font-medium text-text-secondary uppercase tracking-[0.14em]"

            >
              Total Revenue
            </span>
            <div className="w-7 h-7 bg-success/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between relative z-10">
            <span
              className="text-[26px] font-bold text-text-primary leading-none tracking-[-0.02em] stat-number"

            >
              ₹{stats.totalRevenue.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-success flex items-center gap-0.5 bg-success/10 px-2 py-0.5 rounded-full font-medium">
              <ArrowUpRight className="w-3 h-3" />12.5%
            </span>
          </div>
          <p className="text-[11px] text-text-tertiary mt-1.5">Life-time fulfilled orders</p>
        </div>

        {/* Active Orders Card */}
        <div className="glass-card glow-card rounded-2xl p-5 relative overflow-hidden stagger-enter">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-50" />
          <div className="flex items-center justify-between relative z-10">
            <span
              className="text-[10px] font-medium text-text-secondary uppercase tracking-[0.14em]"

            >
              Active Orders
            </span>
            <div className="w-7 h-7 bg-accent/10 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-accent" />
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between relative z-10">
            <span
              className="text-[26px] font-bold text-text-primary leading-none tracking-[-0.02em] stat-number"

            >
              {stats.activeOrders}
            </span>
            <span className="text-xs text-accent flex items-center gap-0.5 bg-accent/10 px-2 py-0.5 rounded-full font-medium">
              Pending
            </span>
          </div>
          <p className="text-[11px] text-text-tertiary mt-1.5">Awaiting packaging or dispatch</p>
        </div>

        {/* Inventory Value Card */}
        <div className="glass-card glow-card rounded-2xl p-5 relative overflow-hidden stagger-enter">
          <div className="absolute inset-0 bg-gradient-to-br from-info/5 via-transparent to-transparent opacity-50" />
          <div className="flex items-center justify-between relative z-10">
            <span
              className="text-[10px] font-medium text-text-secondary uppercase tracking-[0.14em]"

            >
              Inventory Value
            </span>
            <div className="w-7 h-7 bg-info/10 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-info" />
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between relative z-10">
            <span
              className="text-[26px] font-bold text-text-primary leading-none tracking-[-0.02em] stat-number"

            >
              ₹{stats.inventoryValue.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-info flex items-center gap-0.5 bg-info/10 px-2 py-0.5 rounded-full font-medium">
              Balanced
            </span>
          </div>
          <p className="text-[11px] text-text-tertiary mt-1.5">Value of stock on hand</p>
        </div>

        {/* Low Stock Items Card */}
        <div className="glass-card glow-card rounded-2xl p-5 relative overflow-hidden stagger-enter">
          <div className="absolute inset-0 bg-gradient-to-br from-error/5 via-transparent to-transparent opacity-50" />
          <div className="flex items-center justify-between relative z-10">
            <span
              className="text-[10px] font-medium text-text-secondary uppercase tracking-[0.14em]"

            >
              Low Stock Items
            </span>
            <div className="w-7 h-7 bg-error/10 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-error animate-pulse" />
            </div>
          </div>
          <div className="mt-4 flex items-end justify-between relative z-10">
            <span
              className={`text-[26px] font-bold leading-none tracking-[-0.02em] stat-number ${stats.lowStock > 0 ? 'text-error' : 'text-text-primary'}`}

            >
              {stats.lowStock.toString().padStart(2, '0')}
            </span>
            {stats.lowStock > 0 ? (
              <span className="text-xs text-error flex items-center gap-0.5 bg-error/10 px-2 py-0.5 rounded-full font-semibold">
                Action Required
              </span>
            ) : (
              <span className="text-xs text-success flex items-center gap-0.5 bg-success/10 px-2 py-0.5 rounded-full font-medium">
                All Good
              </span>
            )}
          </div>
          <p className="text-[11px] text-text-tertiary mt-1.5">Items below safety levels</p>
        </div>
      </div>

      {/* Revenue Analytics + System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart Card */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3
                className="text-[10px] font-medium text-text-secondary tracking-[0.14em] uppercase"

              >
                Revenue Flow
              </h3>
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className="text-[22px] font-semibold text-text-primary leading-none tracking-[-0.02em] stat-number"

                >
                  ₹{stats.totalRevenue.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-text-tertiary">cumulative volume</span>
              </div>
            </div>
            <div className="flex bg-bg-tertiary p-1 rounded-xl border border-border">
              <button
                onClick={() => setChartDays(7)}
                className={`px-3 py-1 text-[11px] rounded-lg transition-all font-semibold ${
                  chartDays === 7
                    ? 'bg-accent text-white shadow-md shadow-accent/20'
                    : 'text-text-secondary hover:text-text-primary'
                }`}

              >
                7 Days
              </button>
              <button
                onClick={() => setChartDays(30)}
                className={`px-3 py-1 text-[11px] rounded-lg transition-all font-semibold ${
                  chartDays === 30
                    ? 'bg-accent text-white shadow-md shadow-accent/20'
                    : 'text-text-secondary hover:text-text-primary'
                }`}

              >
                30 Days
              </button>
            </div>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} style={{ cursor: 'pointer' }}>
                <defs>
                  <linearGradient id="revenueGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.3} />
                <XAxis
                  dataKey="date"
                  stroke="var(--color-text-tertiary)"
                  axisLine={false}
                  tickLine={false}
                  fontSize={11}
                  dy={6}
                />
                <YAxis
                  stroke="var(--color-text-tertiary)"
                  axisLine={false}
                  tickLine={false}
                  fontSize={11}
                  tickFormatter={(v) => `₹${v / 1000}K`}
                  dx={-6}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderColor: 'var(--color-border)',
                    borderRadius: '12px',
                    color: 'var(--color-text-primary)',
                    fontSize: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    backdropFilter: 'blur(8px)',
                  }}
                  formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--color-accent)"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGlow)"
                  activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--color-accent)', fill: 'var(--color-bg-secondary)' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Status Card */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3
              className="text-[10px] font-medium text-text-secondary uppercase tracking-[0.14em] mb-4"

            >
              Infrastructure Logs
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-bg-tertiary/50 border border-border rounded-xl hover:border-success/30 transition-colors">
                <span className="text-[13px] text-text-secondary">Core Database</span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-success rounded-full pulse-status"></span>
                  <span className="text-[11px] font-semibold text-text-primary">Cloud Sync: Online</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-bg-tertiary/50 border border-border rounded-xl hover:border-success/30 transition-colors">
                <span className="text-[13px] text-text-secondary">Prisma API Client</span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-success rounded-full pulse-status"></span>
                  <span className="text-[11px] font-semibold text-text-primary">Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-bg-tertiary/50 border border-border rounded-xl hover:border-success/30 transition-colors">
                <span className="text-[13px] text-text-secondary">Authentication</span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-success rounded-full pulse-status"></span>
                  <span className="text-[11px] font-semibold text-text-primary">Session Live</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <span className="text-[11px] text-text-tertiary">System Integrity: 100%</span>
            <Activity className="w-4 h-4 text-success animate-pulse" />
          </div>
        </div>
      </div>

      {/* Market Demand + Critical Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 stagger-enter" style={{ animationDelay: '200ms' }}>
        {/* Market Demand Panel */}
        <div className="glass-card glow-card rounded-2xl p-5">
          <h3
            className="text-[10px] font-medium text-text-secondary uppercase tracking-[0.14em] mb-4"

          >
            Product Category Demand
          </h3>
          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-text-secondary">Faucets & Brass Taps</span>
                <span className="text-[12px] font-semibold text-text-primary">78%</span>
              </div>
              <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
                <div className="w-[78%] h-full bg-success rounded-full transition-all duration-700 ease-out" style={{ animation: 'slide-up-fade 0.5s ease-out 0.1s both' }}></div>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-text-secondary">Showers & Rose Sprays</span>
                <span className="text-[12px] font-semibold text-text-primary">16%</span>
              </div>
              <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
                <div className="w-[16%] h-full bg-warning rounded-full transition-all duration-700 ease-out" style={{ animation: 'slide-up-fade 0.5s ease-out 0.2s both' }}></div>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-text-secondary">Sinks & Bath Accessories</span>
                <span className="text-[12px] font-semibold text-text-primary">6%</span>
              </div>
              <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
                <div className="w-[6%] h-full bg-error rounded-full transition-all duration-700 ease-out" style={{ animation: 'slide-up-fade 0.5s ease-out 0.3s both' }}></div>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-text-tertiary mt-4 pt-2 border-t border-border">
            Top active designs: premium single-lever faucets and rain shower subassemblies.
          </p>
        </div>

        {/* Critical Alerts Panel */}
        <div className="glass-card glow-card rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h3
              className="text-[10px] font-medium text-text-secondary uppercase tracking-[0.14em] mb-3"

            >
              Critical Action Items
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-start gap-3 p-3 bg-error/5 border border-error/10 rounded-xl hover:bg-error/10 hover:border-error/20 transition-all duration-200 cursor-pointer group">
                <CircleAlert className="w-4.5 h-4.5 text-error flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="text-[13px] font-semibold text-text-primary leading-snug">
                    {stats.lowStock} Items Critically Low
                  </p>
                  <p className="text-[11px] text-text-secondary mt-0.5">Standard stock parameters require replenishment.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-warning/5 border border-warning/10 rounded-xl hover:bg-warning/10 hover:border-warning/20 transition-all duration-200 cursor-pointer group">
                <Clock className="w-4.5 h-4.5 text-warning flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="text-[13px] font-semibold text-text-primary leading-snug">
                    {stats.activeOrders} Active Pending Orders
                  </p>
                  <p className="text-[11px] text-text-secondary mt-0.5">Sales pipeline contains items waiting for dispatch.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-info/5 border border-info/10 rounded-xl hover:bg-info/10 hover:border-info/20 transition-all duration-200 cursor-pointer group">
                <Truck className="w-4.5 h-4.5 text-info flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <div>
                  <p className="text-[13px] font-semibold text-text-primary leading-snug">
                    Active Delivery Status
                  </p>
                  <p className="text-[11px] text-text-secondary mt-0.5">Track standard supplier transactions and delivery schedules.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation / Action Hub */}
      <div className="glass-card glow-card rounded-2xl p-5 stagger-enter" style={{ animationDelay: '300ms' }}>
        <h3
          className="text-[10px] font-medium text-text-secondary uppercase tracking-[0.14em] mb-3"

        >
          Action Hub
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <Link
            href="/orders"
            className="flex items-center justify-center gap-2 p-3 bg-bg-tertiary hover:bg-bg-hover rounded-xl border border-border hover:border-accent/30 hover:-translate-y-1 active:scale-95 transition-all duration-200 group"
          >
            <Plus className="w-4 h-4 text-accent group-hover:rotate-90 transition-transform duration-300 flex-shrink-0" />
            <span className="text-[13px] font-medium text-text-secondary">Create Order</span>
          </Link>
          <Link
            href="/inventory"
            className="flex items-center justify-center gap-2 p-3 bg-bg-tertiary hover:bg-bg-hover rounded-xl border border-border hover:border-accent/30 hover:-translate-y-1 active:scale-95 transition-all duration-200 group"
          >
            <Package className="w-4 h-4 text-info flex-shrink-0" />
            <span className="text-[13px] font-medium text-text-secondary">Stock Inward</span>
          </Link>
          <Link
            href="/inventory"
            className="flex items-center justify-center gap-2 p-3 bg-bg-tertiary hover:bg-bg-hover rounded-xl border border-border hover:border-accent/30 hover:-translate-y-1 active:scale-95 transition-all duration-200 group"
          >
            <ShoppingCart className="w-4 h-4 text-success flex-shrink-0" />
            <span className="text-[13px] font-medium text-text-secondary">Add Item</span>
          </Link>
          <Link
            href="/reports"
            className="flex items-center justify-center gap-2 p-3 bg-bg-tertiary hover:bg-bg-hover rounded-xl border border-border hover:border-accent/30 hover:-translate-y-1 active:scale-95 transition-all duration-200 group"
          >
            <FileText className="w-4 h-4 text-warning flex-shrink-0" />
            <span className="text-[13px] font-medium text-text-secondary">View Reports</span>
          </Link>
          <Link
            href="/inventory"
            className="flex items-center justify-center gap-2 p-3 bg-bg-tertiary hover:bg-bg-hover rounded-xl border border-border hover:border-accent/30 hover:-translate-y-1 active:scale-95 transition-all duration-200 group"
          >
            <AlertTriangle className="w-4 h-4 text-error flex-shrink-0" />
            <span className="text-[13px] font-medium text-text-secondary">Low Stock</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
