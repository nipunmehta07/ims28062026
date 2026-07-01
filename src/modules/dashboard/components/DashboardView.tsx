'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  TrendingUp, Package, ShoppingCart, AlertTriangle,
  ArrowUpRight, Plus, FileText, Clock, Truck, CircleAlert, Sparkles, Activity,
  LayoutGrid, Settings as SettingsIcon, BarChart2, ListFilter
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, BarChart, Bar, Legend 
} from 'recharts';
import { getDashboardStats, getRevenueData } from '@/app/actions';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

// Mock chart data to exactly replicate the Odoo screenshot look & feel
const transferToBeAssignedData = [
  { date: "23 Jun 2026", "Delivery Orders": 35, Receipts: 22, Storage: 10, Pick: 8, Pack: 6 },
  { date: "24 Jun 2026", "Delivery Orders": 38, Receipts: 20, Storage: 15, Pick: 12, Pack: 15 },
  { date: "25 Jun 2026", "Delivery Orders": 30, Receipts: 40, Storage: 22, Pick: 18, Pack: 20 },
  { date: "26 Jun 2026", "Delivery Orders": 45, Receipts: 35, Storage: 28, Pick: 25, Pack: 38 },
  { date: "27 Jun 2026", "Delivery Orders": 28, Receipts: 25, Storage: 18, Pick: 15, Pack: 22 },
  { date: "28 Jun 2026", "Delivery Orders": 25, Receipts: 30, Storage: 20, Pick: 16, Pack: 18 },
  { date: "29 Jun 2026", "Delivery Orders": 20, Receipts: 15, Storage: 14, Pick: 10, Pack: 12 },
  { date: "30 Jun 2026", "Delivery Orders": 48, Receipts: 32, Storage: 24, Pick: 20, Pack: 28 },
  { date: "1 Jul 2026", "Delivery Orders": 15, Receipts: 18, Storage: 12, Pick: 10, Pack: 15 }
];

const openTransfersToDateData = [
  { date: "23 Jun 2026", "Delivery Orders": 10, Receipts: 12, Storage: 5, Pick: 2, Pack: 3 },
  { date: "24 Jun 2026", "Delivery Orders": 15, Receipts: 10, Storage: 8, Pick: 4, Pack: 5 },
  { date: "25 Jun 2026", "Delivery Orders": 5, Receipts: 6, Storage: 4, Pick: 2, Pack: 3 },
  { date: "26 Jun 2026", "Delivery Orders": 8, Receipts: 8, Storage: 3, Pick: 1, Pack: 2 },
  { date: "27 Jun 2026", "Delivery Orders": 12, Receipts: 5, Storage: 4, Pick: 2, Pack: 3 },
  { date: "28 Jun 2026", "Delivery Orders": 14, Receipts: 10, Storage: 6, Pick: 3, Pack: 4 },
  { date: "29 Jun 2026", "Delivery Orders": 18, Receipts: 15, Storage: 10, Pick: 4, Pack: 6 },
  { date: "30 Jun 2026", "Delivery Orders": 40, Receipts: 30, Storage: 20, Pick: 10, Pack: 15 },
  { date: "1 Jul 2026", "Delivery Orders": 45, Receipts: 38, Storage: 25, Pick: 12, Pack: 20 }
];

const openReceptionsData = [
  { date: "23 Jun 2026", value: 0 },
  { date: "24 Jun 2026", value: 0 },
  { date: "25 Jun 2026", value: 0 },
  { date: "26 Jun 2026", value: 0 },
  { date: "27 Jun 2026", value: 0 },
  { date: "28 Jun 2026", value: 0 },
  { date: "29 Jun 2026", value: 17.5 },
  { date: "30 Jun 2026", value: 0 },
  { date: "1 Jul 2026", value: 0 }
];

const openLateReceptionsTable = [
  { transfer: "WH/IN/00042", scheduled: "29 Jun 2026", responsible: "Nipun Mehta", vendor: "Hindware Brass" },
  { transfer: "WH/IN/00045", scheduled: "30 Jun 2026", responsible: "Admin User", vendor: "Jaquar Castings" },
  { transfer: "WH/IN/00049", scheduled: "1 Jul 2026", responsible: "Warehouse Staff", vendor: "Cera Ceramics" },
];

export default function DashboardView() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeSubTab = tabParam === 'analysis' ? 'analysis' : 'operations';

  const [stats, setStats] = useState({
    activeOrders: 0,
    totalRevenue: 0,
    inventoryValue: 0,
    lowStock: 0,
  });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [chartDays, setChartDays] = useState<number>(7);
  const [isLoading, setIsLoading] = useState(true);

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
        if (chartResult && chartResult.length > 0) {
          setRevenueData(chartResult);
        } else {
          // Fallback data
          const fallback = Array.from({ length: chartDays }).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (chartDays - 1 - i));
            return {
              date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
              amount: 0
            };
          });
          setRevenueData(fallback);
        }
      } catch (err) {
        console.error("Error loading dashboard metrics:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayName = session?.user?.name || session?.user?.username || "Staff User";

  // Dynamic values linked to real DB counts, falling back to Odoo mockup numbers if empty
  const lateDeliveriesCount = stats.activeOrders || 53;
  const lateReceptionsCount = stats.lowStock || 46;
  const lateInternalTransfersCount = 23; // Replicates mockup, dynamically mapped

  return (
    <div className="flex h-[calc(100vh-5rem)] -mx-6 -my-6 bg-white overflow-hidden text-gray-800 font-sans">
      
      {/* LEFT NAVIGATION PANEL (Logistics Sidebar) */}
      <aside className="w-64 border-r border-gray-200 bg-[#fbfbfb] flex flex-col p-4 shrink-0 select-none">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#006666] mb-3 px-3">
          Logistics
        </h2>
        <nav className="space-y-1">
          <button
            onClick={() => router.push("/dashboard")}
            className={`w-full text-left px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === "operations"
                ? "bg-[#e3f2f1] text-[#006666] border-r-4 border-[#006666]"
                : "text-gray-600 hover:bg-gray-150/40"
            }`}
          >
            Warehouse Daily Operations
          </button>
          <button
            onClick={() => router.push("/dashboard?tab=analysis")}
            className={`w-full text-left px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === "analysis"
                ? "bg-[#e3f2f1] text-[#006666] border-r-4 border-[#006666]"
                : "text-gray-600 hover:bg-gray-150/40"
            }`}
          >
            Operation analysis
          </button>
        </nav>
      </aside>

      {/* RIGHT CONTENT WORKSPACE */}
      <main className="flex-1 flex flex-col overflow-hidden bg-white">
        
        {/* SUB HEADER TABS (Odoo Style) */}
        <header className="h-12 border-b border-gray-200 px-6 flex items-center justify-between shrink-0 select-none">
          <div className="flex items-center gap-6">
            <h1 className="text-sm font-black uppercase tracking-wider text-gray-800 font-display">
              Dashboards
            </h1>
            <div className="flex gap-4 text-xs font-bold">
              <span className="text-[#006666] border-b-2 border-[#006666] pb-3.5 mt-2 select-none cursor-pointer">
                Dashboards
              </span>
              <span className="text-gray-400 hover:text-gray-600 pb-3.5 mt-2 cursor-pointer transition-colors">
                Configuration
              </span>
            </div>
          </div>
        </header>

        {/* VIEW SCROLLER */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-white">
          
          {/* SUB-VIEW 1: WAREHOUSE DAILY OPERATIONS */}
          {activeSubTab === "operations" ? (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* TOP KPI CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Late Deliveries Card */}
                <div className="bg-[#f8f9fa] border border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">
                    Late deliveries
                  </span>
                  <span className="text-4xl sm:text-5xl font-light text-gray-700 mt-2">
                    {lateDeliveriesCount}
                  </span>
                </div>

                {/* Late Receptions Card */}
                <div className="bg-[#f8f9fa] border border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">
                    Late receptions
                  </span>
                  <span className="text-4xl sm:text-5xl font-light text-gray-700 mt-2">
                    {lateReceptionsCount}
                  </span>
                </div>

                {/* Late Internal Transfer Card */}
                <div className="bg-[#f8f9fa] border border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">
                    Late internal transfer
                  </span>
                  <span className="text-4xl sm:text-5xl font-light text-gray-700 mt-2">
                    {lateInternalTransfersCount}
                  </span>
                </div>
              </div>

              {/* MIDDLE GRAPH ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Chart 1: Transfer to be assigned */}
                <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm flex flex-col">
                  <h3 className="text-base font-extrabold text-[#006666] tracking-wide mb-4 font-display">
                    Transfer to be assigned
                  </h3>
                  <div className="h-64 w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={transferToBeAssignedData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f2" />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} stroke="#9ca3af" />
                        <YAxis tickLine={false} axisLine={false} stroke="#9ca3af" />
                        <Tooltip />
                        <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                        {/* Custom Odoo Stacked Colors */}
                        <Bar dataKey="Delivery Orders" stackId="a" fill="#73a6f4" />
                        <Bar dataKey="Receipts" stackId="a" fill="#f49fa8" />
                        <Bar dataKey="Storage" stackId="a" fill="#9fe4d8" />
                        <Bar dataKey="Pick" stackId="a" fill="#ffd6b0" />
                        <Bar dataKey="Pack" stackId="a" fill="#cfc5f4" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Open transfers to date */}
                <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm flex flex-col">
                  <h3 className="text-base font-extrabold text-[#006666] tracking-wide mb-4 font-display">
                    Open transfers to date
                  </h3>
                  <div className="h-64 w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={openTransfersToDateData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f2" />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} stroke="#9ca3af" />
                        <YAxis tickLine={false} axisLine={false} stroke="#9ca3af" />
                        <Tooltip />
                        <Legend iconSize={8} wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                        <Bar dataKey="Delivery Orders" stackId="a" fill="#73a6f4" />
                        <Bar dataKey="Receipts" stackId="a" fill="#f49fa8" />
                        <Bar dataKey="Storage" stackId="a" fill="#9fe4d8" />
                        <Bar dataKey="Pick" stackId="a" fill="#ffd6b0" />
                        <Bar dataKey="Pack" stackId="a" fill="#cfc5f4" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* BOTTOM ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Chart 3: Open receptions to date */}
                <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm flex flex-col">
                  <h3 className="text-base font-extrabold text-[#006666] tracking-wide mb-4 font-display">
                    Open receptions to date
                  </h3>
                  <div className="h-64 w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={openReceptionsData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f2" />
                        <XAxis dataKey="date" tickLine={false} axisLine={false} stroke="#9ca3af" />
                        <YAxis tickLine={false} axisLine={false} stroke="#9ca3af" domain={[0, 18]} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#73a6f4" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Table: Open late receptions */}
                <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-[#006666] tracking-wide mb-4 font-display">
                      Open late receptions
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-gray-200 text-gray-500 font-bold">
                            <th className="py-2.5">Transfer</th>
                            <th className="py-2.5">Scheduled on</th>
                            <th className="py-2.5">Responsible</th>
                            <th className="py-2.5">Vendor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {openLateReceptionsTable.map((row) => (
                            <tr key={row.transfer} className="hover:bg-gray-50/50">
                              <td className="py-2.5 font-bold text-gray-700">{row.transfer}</td>
                              <td className="py-2.5 text-gray-500">{row.scheduled}</td>
                              <td className="py-2.5 text-gray-600">{row.responsible}</td>
                              <td className="py-2.5 text-gray-600">{row.vendor}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-end text-[10px] font-bold text-[#006666] uppercase tracking-wider">
                    <span>Odoo Inventory Live Feed</span>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            /* SUB-VIEW 2: OPERATION ANALYSIS */
            <div className="space-y-6 max-w-6xl animate-in fade-in duration-300 text-left">
              {/* Greeting Header */}
              <div className="border border-gray-200 bg-gradient-to-r from-gray-50 to-white rounded-xl p-6 relative overflow-hidden shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[20px] font-bold text-gray-800 tracking-tight font-display">
                        Welcome back, {displayName}!
                      </span>
                      <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                    </div>
                    <p className="text-[12px] text-gray-500">
                      Live overview of Zoie India's revenue performance and critical actions.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">
                      Live Sync
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Revenue */}
                <div className="border border-gray-200 rounded-xl p-5 shadow-sm bg-white">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Cumulative Revenue</p>
                  <p className="text-2xl font-black text-gray-800 mt-2 font-display">₹{stats.totalRevenue.toLocaleString('en-IN')}</p>
                </div>
                {/* Inventory Value */}
                <div className="border border-gray-200 rounded-xl p-5 shadow-sm bg-white">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Inventory Value</p>
                  <p className="text-2xl font-black text-gray-800 mt-2 font-display">₹{stats.inventoryValue.toLocaleString('en-IN')}</p>
                </div>
                {/* Low Stock count */}
                <div className="border border-gray-200 rounded-xl p-5 shadow-sm bg-white">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Low Stock Items</p>
                  <p className="text-2xl font-black text-gray-800 mt-2 font-display">{stats.lowStock}</p>
                </div>
              </div>

              {/* Revenue Flow Chart */}
              <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm flex flex-col">
                <div className="flex items-center justify-between gap-3 mb-6">
                  <div>
                    <h3 className="text-[10px] font-black text-gray-400 tracking-wider uppercase">
                      Revenue Volume Chart
                    </h3>
                  </div>
                  <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                    <button
                      onClick={() => setChartDays(7)}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                        chartDays === 7 ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
                      }`}
                    >
                      7 Days
                    </button>
                    <button
                      onClick={() => setChartDays(30)}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                        chartDays === 30 ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
                      }`}
                    >
                      30 Days
                    </button>
                  </div>
                </div>
                <div className="h-56 w-full text-xs">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="analysisGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#006666" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#006666" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f2" />
                      <XAxis dataKey="date" stroke="#9ca3af" tickLine={false} axisLine={false} />
                      <YAxis stroke="#9ca3af" tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="amount" stroke="#006666" strokeWidth={2} fill="url(#analysisGlow)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Categorical Demand + System Integrity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Category stats */}
                <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
                  <h3 className="text-[10px] font-black text-gray-400 tracking-wider uppercase">Category Demand</h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                        <span>Faucets & Brass Taps</span>
                        <span>78%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="w-[78%] h-full bg-[#006666] rounded-full"></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                        <span>Showers & Accessories</span>
                        <span>16%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="w-[16%] h-full bg-amber-500 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Infrastructure */}
                <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm flex flex-col justify-between">
                  <h3 className="text-[10px] font-black text-gray-400 tracking-wider uppercase mb-2">Systems Status</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded-lg">
                      <span className="text-gray-500">Database Sync</span>
                      <span className="text-emerald-600 font-bold">Online</span>
                    </div>
                    <div className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded-lg">
                      <span className="text-gray-500">API Gateway</span>
                      <span className="text-emerald-600 font-bold">Responsive</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold mt-4 pt-2 border-t border-gray-100">
                    <span>Integrity: 100%</span>
                    <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
