"use client";

import React, { useEffect, useState } from "react";
import { getDashboardStats } from "@/app/actions";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";

export default function DashboardStats() {
  const [stats, setStats] = useState({
    activeOrders: 0,
    totalRevenue: 0,
    inventoryValue: 0,
    lowStock: 0,
  });

  useEffect(() => {
    async function load() {
      const data = await getDashboardStats();
      setStats(data);
    }
    load();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      
      {/* TOTAL REVENUE */}
      <Card 
        variant="glass" 
        padding="lg" 
        radius="2xl" 
        className="relative overflow-hidden group hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300"
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent" />
        {/* Mesh pattern */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, emerald-500 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }} />
        
        <div className="relative flex justify-between items-start mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white text-lg shadow-lg shadow-emerald-500/30">
            <span className="font-black">₹</span>
          </div>
          <Badge variant="gradient" size="sm" className="shadow-sm">
            +12.5%
          </Badge>
        </div>
        <p className="text-[9px] md:text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Total Revenue</p>
        <h3 className="text-2xl md:text-3xl font-black italic tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          ₹{stats.totalRevenue.toLocaleString('en-IN')}
        </h3>
        
        {/* Sparkline decoration */}
        <div className="absolute bottom-0 right-0 w-24 h-12 opacity-20">
          <svg viewBox="0 0 100 50" className="w-full h-full">
            <path
              d="M0,40 Q20,35 40,30 T80,15 T100,10"
              fill="none"
              stroke="url(#sparkGrad1)"
              strokeWidth="2"
            />
            <defs>
              <linearGradient id="sparkGrad1" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </Card>

      {/* ACTIVE ORDERS */}
      <Card 
        variant="glass" 
        padding="lg" 
        radius="2xl" 
        className="relative overflow-hidden group hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-cyan-500/5 to-transparent" />
        
        <div className="relative flex justify-between items-start mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-zinc-800 dark:to-zinc-900 rounded-xl flex items-center justify-center text-xl">
            <span className="text-gray-400 dark:text-gray-600">📦</span>
          </div>
          <Badge variant="success" size="sm" pulse>{stats.activeOrders} Pending</Badge>
        </div>
        <p className="text-[9px] md:text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Active Orders</p>
        <h3 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          {stats.activeOrders}
        </h3>
      </Card>

      {/* INVENTORY VALUE */}
      <Card 
        variant="glass" 
        padding="lg" 
        radius="2xl" 
        className="relative overflow-hidden group hover:scale-[1.02] hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-teal-500/5 to-transparent" />
        
        <div className="relative flex justify-between items-start mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-zinc-800 dark:to-zinc-900 rounded-xl flex items-center justify-center text-xl">
            <span className="text-gray-400 dark:text-gray-600">📈</span>
          </div>
          <Badge variant="success" size="sm">Balanced</Badge>
        </div>
        <p className="text-[9px] md:text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Inventory Value</p>
        <h3 className="text-2xl md:text-3xl font-black italic tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          ₹{stats.inventoryValue.toLocaleString('en-IN')}
        </h3>
      </Card>

      {/* LOW STOCK */}
      <Card 
        variant="glass" 
        padding="lg" 
        radius="2xl" 
        className="relative overflow-hidden group hover:scale-[1.02] hover:shadow-xl hover:shadow-rose-500/10 transition-all duration-300"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-transparent" />
        
        <div className="relative flex justify-between items-start mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-red-500 rounded-xl flex items-center justify-center text-white text-lg shadow-lg shadow-rose-500/30">
            <span>⚠️</span>
          </div>
          <Badge variant="danger" size="sm" pulse>Critical</Badge>
        </div>
        <p className="text-[9px] md:text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Low Stock</p>
        <h3 className="text-2xl md:text-3xl font-black bg-gradient-to-r from-rose-600 to-red-500 bg-clip-text text-transparent">
          {stats.lowStock.toString().padStart(2, '0')}
        </h3>
      </Card>

    </div>
  );
}