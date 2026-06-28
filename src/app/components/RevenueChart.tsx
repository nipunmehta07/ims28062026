"use client";

import React, { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getRevenueData } from "../actions";

export default function RevenueChart() {
  const [data, setData] = useState<any[]>([]);
  const [range, setRange] = useState<number | 'custom'>(7);
  const [customDates, setCustomDates] = useState({ start: "", end: "" });

  useEffect(() => {
    if (range !== 'custom') loadData(range);
  }, [range]);

  const loadData = async (days: number) => {
    const result = await getRevenueData(days);
    setData(result);
  };

  const handleCustomSubmit = async () => {
    const result = await getRevenueData(undefined, customDates.start, customDates.end);
    setData(result);
  };

  return (
    <div className="relative p-6 md:p-8 rounded-[2rem] space-y-6">
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem]" />
      <div className="absolute inset-[1px] bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-zinc-900 dark:via-zinc-800/50 dark:to-zinc-900 rounded-[2rem]" />
      
      {/* Content */}
      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 dark:text-emerald-400">Revenue Analytics</h4>
          <h2 className="text-xl font-black italic bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">OPERATIONAL FLOW</h2>
        </div>

        {/* PRESET CONTROLS */}
        <div className="flex bg-emerald-500/5 dark:bg-emerald-500/10 p-1 rounded-xl border border-emerald-500/10">
          {[7, 30].map((d) => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${
                range === d 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20' 
                  : 'text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400'
              }`}
            >
              {d} Days
            </button>
          ))}
          <button
            onClick={() => setRange('custom')}
            className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${
              range === 'custom' 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/20' 
                : 'text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400'
            }`}
          >
            Custom
          </button>
        </div>
      </div>

      {/* CUSTOM DATE INPUTS */}
      {range === 'custom' && (
        <div className="relative flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <input 
            type="date" 
            className="text-[10px] p-2 rounded-lg border border-emerald-500/20 bg-white dark:bg-zinc-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all" 
            onChange={(e) => setCustomDates({...customDates, start: e.target.value})} 
          />
          <span className="text-emerald-400">→</span>
          <input 
            type="date" 
            className="text-[10px] p-2 rounded-lg border border-emerald-500/20 bg-white dark:bg-zinc-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all" 
            onChange={(e) => setCustomDates({...customDates, end: e.target.value})} 
          />
          <button 
            onClick={handleCustomSubmit} 
            className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[9px] font-black px-4 py-2 rounded-lg uppercase tracking-widest hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
          >
            Apply
          </button>
        </div>
      )}

      {/* CHART AREA */}
      <div className="h-[300px] w-full relative">
        {/* Emerald glow behind chart */}
        <div className="absolute inset-0 blur-3xl opacity-20 dark:opacity-10 -z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
        </div>
        
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="emeraldGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" className="dark:stroke-zinc-800" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{fontSize: 9, fontWeight: 900, fill: '#9ca3af'}} 
              dy={10} 
            />
            <YAxis hide />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '16px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', 
                fontSize: '10px', 
                fontWeight: '900',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)'
              }}
              formatter={(value: any) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
            />
            <Area 
              type="monotone" 
              dataKey="amount" 
              stroke="url(#emeraldGrad)" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorAmt)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}