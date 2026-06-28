"use client";

import React, { useState, useRef } from "react";
import toast from "react-hot-toast";
import { generateBackupData, factoryResetInstance, restoreBackupData } from "../actions"; 

export default function SettingsView() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- NEW PROGRESS STATES ---
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
    <div className="flex flex-col gap-8 animate-in fade-in duration-700">
      <input type="file" ref={fileInputRef} onChange={onFileChange} accept=".json" className="hidden" />

      {/* SYSTEM PROGRESS OVERLAY (Only shows when active) */}
      {isProcessing && (
        <div className="bg-black p-8 rounded-[2rem] shadow-2xl border border-gray-800 max-w-4xl animate-in zoom-in-95 duration-300">
           <div className="flex justify-between items-end mb-4">
              <h4 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">{statusLabel}</h4>
              <span className="text-[10px] font-black text-gray-500 uppercase">{progress}%</span>
           </div>
           <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-white h-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
           </div>
        </div>
      )}

      {/* BACKUP & RECOVERY */}
      <div className={`bg-white p-12 rounded-[3rem] border border-gray-200 shadow-sm max-w-4xl transition-opacity ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
        <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em] mb-8">Backup & Recovery</h4>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={handleBackup} className="flex-1 bg-black text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-[0.98] shadow-xl">
            Generate Backup
          </button>
          
          <button onClick={handleRestore} className="flex-1 bg-white border border-gray-200 text-gray-900 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:border-black transition-all active:scale-[0.98]">
            Restore Data
          </button>
        </div>
        
        <p className="mt-6 text-[10px] font-bold text-gray-400 uppercase tracking-tight">
          Last Snapshot Target: <span className="text-black">ap-south-1-production</span>
        </p>
      </div>

      {/* DANGER ZONE (Same as original, but with isProcessing disabled state) */}
      <div className={`bg-white p-12 rounded-[3rem] border border-rose-100 shadow-sm max-w-4xl transition-opacity ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
        <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-[0.3em] mb-8">Danger Zone</h4>
        <div className="space-y-6">
          <p className="text-[12px] text-gray-400 font-medium italic leading-relaxed">
            **Factory Reset:** This will truncate all tables in the production database. 
            This action is **irreversible**. All inventory and history will be lost.
          </p>
          <button onClick={handleFactoryReset} className="w-full bg-rose-50 text-rose-600 border border-rose-100 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all active:scale-[0.98]">
            Factory Reset Instance
          </button>
        </div>
      </div>
    </div>
  );
}