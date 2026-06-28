"use client";

import React, { useEffect, useState } from "react";
import { getTopSellingStats } from "@/app/actions";

export default function TopProducts() {
  const [data, setData] = useState<any>({ topSellingSKUs: [], highPriorityAlerts: [] });
  const [range, setRange] = useState<number | 'custom'>(7);
  const [customDates, setCustomDates] = useState({ start: "", end: "" });

  useEffect(() => {
    if (range !== 'custom') load(range);
  }, [range]);

  const load = async (days?: number, start?: string, end?: string) => {
    const result = await getTopSellingStats(days, start, end);
    setData(result);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      
      {/* TOP 5 SELLING SKUs WITH FILTERS */}
      <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-4 w-1 bg-black rounded-full" />
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Market Demand</h4>
            </div>
            <h2 className="text-xl font-black italic uppercase">Top 5 SKUs</h2>
          </div>

          {/* DATE TOGGLES */}
          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
            {[7, 30].map((d) => (
              <button key={d} onClick={() => setRange(d)} className={`px-3 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${range === d ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>
                {d}D
              </button>
            ))}
            <button onClick={() => setRange('custom')} className={`px-3 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${range === 'custom' ? 'bg-white shadow-sm text-black' : 'text-gray-400'}`}>
              Custom
            </button>
          </div>
        </div>

        {range === 'custom' && (
          <div className="flex gap-2 mb-6 animate-in fade-in zoom-in-95">
            <input type="date" className="text-[9px] p-2 border rounded-lg" onChange={e => setCustomDates({...customDates, start: e.target.value})} />
            <input type="date" className="text-[9px] p-2 border rounded-lg" onChange={e => setCustomDates({...customDates, end: e.target.value})} />
            <button onClick={() => load(undefined, customDates.start, customDates.end)} className="bg-black text-white px-3 rounded-lg text-[8px] font-black uppercase">Go</button>
          </div>
        )}

        <div className="space-y-5">
          {data.topSellingSKUs.map((item: any, idx: number) => (
            <div key={item.id} className="flex justify-between items-center group">
              <div className="flex items-center gap-4">
                <span className="text-[10px] font-black text-gray-300">0{idx + 1}</span>
                <div className="flex flex-col">
                  <span className="text-[12px] font-black uppercase tracking-tight text-gray-800">{item.name}</span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{item.sku}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-black text-gray-900">{item.totalSold} {item.unit}</span>
                <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-tighter">Velocity Active</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RESTOCK PRIORITY CARD */}
      <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
         <div className="flex items-center gap-2 mb-6">
          <div className="h-4 w-1 bg-rose-500 rounded-full" />
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400">Critical Priority</h4>
        </div>
        <h2 className="text-xl font-black italic mb-8 uppercase">Restock Required</h2>
        <div className="space-y-4">
          {data.highPriorityAlerts.map((item: any) => (
            <div key={item.id} className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100 flex justify-between items-center">
              <div>
                <span className="text-[11px] font-black uppercase text-gray-900">{item.name}</span>
                <p className="text-[9px] font-bold text-rose-600 uppercase mt-1 tracking-widest">Only {item.quantityOnHand} Left</p>
              </div>
              <button className="bg-white border border-rose-200 text-rose-600 px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all">Order</button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}