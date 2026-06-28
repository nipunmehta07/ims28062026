"use client";

import React from "react";
import RevenueChart from "./RevenueChart";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";

export default function DashboardView() {
  return (
    <div className="flex flex-col lg:flex-row gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* 1. THE INTERACTIVE REVENUE CHART */}
      <Card 
        variant="glass" 
        padding="lg" 
        radius="xl" 
        className="flex-1 min-w-0 relative overflow-hidden"
      >
        {/* Subtle emerald accent line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
        <RevenueChart />
      </Card>

      {/* 2. SYSTEM STATUS & ACTIONS */}
      <div className="w-full lg:w-[380px] space-y-4 md:space-y-6">
        {/* Force a very dark gray in dark mode to ensure it pops */}
        <Card 
          variant="dark" 
          padding="xl" 
          radius="2xl" 
          className="min-h-[450px] flex flex-col justify-between relative overflow-hidden"
        >
          {/* Emerald mesh pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, emerald-500 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }} />
          
          <div className="relative">
            <p className="text-[10px] font-black text-emerald-500/60 dark:text-emerald-600 uppercase tracking-[0.4em] mb-6">System Status</p>
            <h2 className="text-4xl font-black italic leading-tight tracking-tighter uppercase">
              INFRASTRUCTURE <br /> 
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">ACTIVE</span>
            </h2>
          </div>

          <div className="space-y-6 relative">
            <Card 
              variant="default" 
              padding="md" 
              radius="2xl" 
              className="bg-gradient-to-r from-emerald-500/10 to-teal-500/5 dark:from-emerald-500/20 dark:to-teal-500/10 border border-emerald-500/20 dark:border-emerald-500/30"
            >
              <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-3">Database Status</p>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
                <span className="text-[12px] font-bold text-gray-100 tracking-wide">Cloud Sync: Online</span>
              </div>
            </Card>

            <Button variant="gradient" size="lg" className="w-full shadow-lg shadow-emerald-500/20">
              Export Global Report
            </Button>
          </div>
        </Card>
      </div>

    </div>
  );
}