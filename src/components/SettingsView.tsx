"use client";

import React, { useState, useRef } from "react";
import toast from "react-hot-toast";
import { generateBackupData, factoryResetInstance, restoreBackupData } from "@/app/actions"; 
import { Settings, Shield, AlertTriangle, Activity, Download, Upload } from "lucide-react";

export default function SettingsView() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- PROGRESS STATES ---
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusLabel, setStatusLabel] = useState("");

  // Helper to simulate progress for Server Actions
  const simulateProgress = (label: string, duration: number = 2000) => {
    setStatusLabel(label);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, duration / 20);
    return interval;
  };

  // --- BACKUP LOGIC ---
  const handleBackup = async () => {
    setIsProcessing(true);
    const interval = simulateProgress("Generating system snapshot...");
    
    try {
      const response = await generateBackupData();
      if (!response.success) throw new Error(response.error || "Unknown Error");

      if (response.payload) {
        setProgress(100);
        setStatusLabel("Download starting...");
        
        const blob = new Blob([response.payload], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Admin-Backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success("Backup downloaded successfully");
      }
    } catch (error: any) {
      toast.error(error.message || "Connection failed");
    } finally {
      clearInterval(interval);
      setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
      }, 1000);
    }
  };

  // --- RESTORE LOGIC ---
  const handleRestore = () => fileInputRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const interval = simulateProgress("Verifying & Restoring data...");

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        JSON.parse(content); // Local integrity check

        const result = await restoreBackupData(content);

        if (result.success) {
          setProgress(100);
          setStatusLabel("Restore complete. Refreshing...");
          toast.success("Database restored successfully");
          setTimeout(() => window.location.reload(), 1500);
        } else {
          throw new Error(result.error);
        }
      } catch (err: any) {
        toast.error(err.message || "Invalid backup format");
        setIsProcessing(false);
      } finally {
        clearInterval(interval);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- FACTORY RESET LOGIC ---
  const handleFactoryReset = async () => {
    const firstCheck = confirm("CRITICAL: This will permanently delete ALL data. Proceed?");
    if (!firstCheck) return;

    const verification = prompt("Type 'ERASE-ALL-DATA' to confirm permanent deletion.");
    if (verification === "ERASE-ALL-DATA") {
      setIsProcessing(true);
      const interval = simulateProgress("Wiping production instance...");
      try {
        const result = await factoryResetInstance();
        if (result.success) {
          setProgress(100);
          toast.success("System wiped successfully");
          setTimeout(() => window.location.reload(), 1500);
        } else {
          throw new Error(result.error);
        }
      } catch (error: any) {
        toast.error(error.message || "Reset failed");
        setIsProcessing(false);
      } finally {
        clearInterval(interval);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-3xl">
      <input type="file" ref={fileInputRef} onChange={onFileChange} accept=".json" className="hidden" />

      {/* Page Header */}
      <div className="glass-card bg-mesh-gradient rounded-2xl p-6 relative overflow-hidden transition-all duration-300">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-text-primary tracking-tight">System Settings</h1>
            <p className="text-sm text-text-secondary">Configure backups, restore snapshots, and manage your production database instance.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full">
            <Settings className="w-3.5 h-3.5 text-accent animate-spin" style={{ animationDuration: '8s' }} />
            <span className="text-xs font-semibold text-accent tracking-wide uppercase">Config</span>
          </div>
        </div>
      </div>

      {/* SYSTEM PROGRESS OVERLAY (Only shows when active) */}
      {isProcessing && (
        <div className="glass-card bg-mesh-gradient p-5 rounded-2xl shadow-xl border border-accent/20 animate-in zoom-in-95 duration-300">
           <div className="flex justify-between items-end mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent animate-pulse" />
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">{statusLabel}</h4>
              </div>
              <span className="text-xs font-bold text-text-secondary uppercase">{progress}%</span>
           </div>
           <div className="w-full bg-bg-tertiary h-2.5 rounded-full overflow-hidden border border-border">
              <div 
                className="bg-accent h-full transition-all duration-500 ease-out rounded-full progress-glow"
                style={{ width: `${progress}%` }}
              />
           </div>
        </div>
      )}

      {/* BACKUP & RECOVERY */}
      <div className={`glass-card rounded-2xl p-6 transition-opacity duration-300 ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-accent" />
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">System Backups</h4>
        </div>
        <p className="text-xs text-text-secondary mb-6">Backup inventory states, BOM configurations, and order ledgers locally or restore previous configurations.</p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={handleBackup} className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white py-3 rounded-xl text-sm font-semibold tracking-wider transition-all active:scale-[0.98] shadow-lg shadow-accent/20">
            <Download className="w-4 h-4" />
            Generate Backup
          </button>
          
          <button onClick={handleRestore} className="flex-1 flex items-center justify-center gap-2 bg-bg-tertiary hover:bg-bg-hover border border-border text-text-primary py-3 rounded-xl text-sm font-semibold tracking-wider transition-all active:scale-[0.98]">
            <Upload className="w-4 h-4" />
            Restore Data
          </button>
        </div>
        
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-text-tertiary">
          <span>Target Bucket: <span className="font-semibold text-text-secondary">ap-south-1-production</span></span>
          <span>Snapshot format: JSON</span>
        </div>
      </div>

      {/* DANGER ZONE */}
      <div className={`glass-card rounded-2xl p-6 border-error/20 dark:border-error/20 transition-opacity duration-300 ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-4 h-4 text-error" />
          <h4 className="text-xs font-bold text-error uppercase tracking-wider">Danger Zone</h4>
        </div>
        <div className="space-y-4">
          <p className="text-xs text-text-secondary leading-relaxed">
            <strong>Factory Reset:</strong> This will permanently truncate all tables (Items, Orders, BOMs, Transactions) in your PostgreSQL database instance. 
            This process is <span className="text-error font-bold">irreversible</span> and wipes all data history.
          </p>
          <button onClick={handleFactoryReset} className="w-full bg-error/10 hover:bg-error text-error hover:text-white border border-error/20 hover:border-transparent py-3 rounded-xl text-sm font-bold tracking-wider transition-all active:scale-[0.98]">
            Wipe & Factory Reset Instance
          </button>
        </div>
      </div>
    </div>
  );
}