// src/modules/settings/components/SettingsView.tsx
"use client";

import React, { useState, useRef } from "react";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  generateBackupData, 
  factoryResetInstance, 
  restoreBackupData,
  getUsers,
  createUserAction,
  updateUserRoleAction,
  deleteUserAction
} from "@/app/actions"; 
import { Settings, Shield, AlertTriangle, Activity, Download, Upload, Users, UserPlus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsView() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  
  // --- PROGRESS STATES ---
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusLabel, setStatusLabel] = useState("");

  // --- USER FORM STATE ---
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("STAFF");
  const [password, setPassword] = useState("");

  // --- QUERY & MUTATIONS ---
  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["settingsUsers"],
    queryFn: () => getUsers()
  });

  const createUserMutation = useMutation({
    mutationFn: createUserAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settingsUsers"] });
      toast.success("User registered successfully!");
      setUsername("");
      setName("");
      setEmail("");
      setPassword("");
    },
    onError: (err: any) => toast.error(err.message || "Failed to create user")
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string, role: string }) => updateUserRoleAction(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settingsUsers"] });
      toast.success("User role updated");
    },
    onError: (err: any) => toast.error(err.message || "Failed to update role")
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUserAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settingsUsers"] });
      toast.success("User deleted");
    },
    onError: (err: any) => toast.error(err.message || "Failed to delete user")
  });

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

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !name || !email) {
      toast.error("Please fill in all required fields.");
      return;
    }
    createUserMutation.mutate({ username, name, email, role, password });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300 font-sans text-gray-800 text-left">
      <input type="file" ref={fileInputRef} onChange={onFileChange} accept=".json" className="hidden" />

      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-lg font-black text-gray-800 font-display uppercase tracking-wider">System Settings</h2>
        </div>
      </div>

      {/* SYSTEM PROGRESS OVERLAY */}
      {isProcessing && (
        <div className="border border-[#6a4a63]/20 bg-[#6a4a63]/5 p-5 rounded-xl animate-in zoom-in-95 duration-300">
           <div className="flex justify-between items-end mb-3 text-xs">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#6a4a63] animate-pulse" />
                <span className="font-bold text-gray-700 uppercase">{statusLabel}</span>
              </div>
              <span className="font-bold text-gray-500 uppercase">{progress}%</span>
           </div>
           <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#6a4a63] h-full transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
           </div>
        </div>
      )}

      {/* RBAC USER MANAGEMENT PANEL */}
      <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Users className="w-4 h-4 text-[#006666]" />
          <h3 className="text-xs font-black uppercase text-gray-800 tracking-wider">User Directory & RBAC</h3>
        </div>
        
        {/* Create User Form */}
        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50/50 border border-gray-200 text-xs font-medium text-gray-600">
          <div className="md:col-span-2 flex items-center gap-1.5 text-[10px] font-black text-[#006666] uppercase tracking-wider border-b border-gray-200/50 pb-2">
            <UserPlus className="w-4 h-4" /> Register User
          </div>
          <div className="space-y-1">
            <label className="font-bold">Full Name *</label>
            <input 
              required 
              type="text" 
              placeholder="e.g. Vinay Sharma" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none" 
            />
          </div>
          <div className="space-y-1">
            <label className="font-bold">Username *</label>
            <input 
              required 
              type="text" 
              placeholder="e.g. vinay" 
              value={username} 
              onChange={e => setUsername(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none" 
            />
          </div>
          <div className="space-y-1">
            <label className="font-bold">Email Address *</label>
            <input 
              required 
              type="email" 
              placeholder="e.g. vinay@zoie.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none" 
            />
          </div>
          <div className="space-y-1">
            <label className="font-bold">Password</label>
            <input 
              type="password" 
              placeholder="Defaults to Zoie123!" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="w-full p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none" 
            />
          </div>
          
          <div className="md:col-span-2 flex flex-col sm:flex-row items-end justify-between gap-4 mt-2">
            <div className="w-full sm:flex-1 space-y-1 text-left">
              <label className="font-bold">Assigned Role</label>
              <select 
                value={role} 
                onChange={e => setRole(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none bg-white font-medium"
              >
                <option value="ADMIN">ADMIN (Full Access)</option>
                <option value="MANAGER">MANAGER (BOMs & Auditing)</option>
                <option value="WAREHOUSE">WAREHOUSE (Stock Control Only)</option>
                <option value="SALES">SALES (Orders Pipeline Only)</option>
                <option value="STAFF">STAFF (General Access)</option>
              </select>
            </div>
            
            <button 
              type="submit" 
              disabled={createUserMutation.isPending}
              className="px-6 py-2 bg-[#6a4a63] hover:bg-[#5c3e55] text-white text-xs font-bold rounded-lg tracking-wider uppercase disabled:opacity-50 cursor-pointer w-full sm:w-auto text-center"
            >
              {createUserMutation.isPending ? "Creating..." : "Add User"}
            </button>
          </div>
        </form>

        {/* Users List */}
        {loadingUsers ? (
          <div className="text-center py-6 text-xs text-gray-400">Loading user list...</div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-3">User</th>
                  <th className="p-3">Username / Email</th>
                  <th className="p-3">Assigned Role</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50/50">
                    <td className="p-3 font-bold text-gray-800">{u.name}</td>
                    <td className="p-3">
                      <p className="text-gray-700 font-mono font-bold">{u.username}</p>
                      <p className="text-gray-400 text-[10px] font-medium">{u.email}</p>
                    </td>
                    <td className="p-3">
                      <select 
                        value={u.role} 
                        onChange={e => updateRoleMutation.mutate({ userId: u.id, role: e.target.value })}
                        className="px-2.5 py-1 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 outline-none focus:border-accent bg-white cursor-pointer"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="WAREHOUSE">WAREHOUSE</option>
                        <option value="SALES">SALES</option>
                        <option value="STAFF">STAFF</option>
                      </select>
                    </td>
                    <td className="p-3 text-right">
                      <button 
                        onClick={() => { if (confirm("Remove user access?")) deleteUserMutation.mutate(u.id); }}
                        className="p-1 text-gray-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-all cursor-pointer" 
                        title="Delete Access"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* BACKUP & RECOVERY */}
      <div className={cn(
        "border border-gray-200 rounded-xl p-5 bg-white shadow-sm space-y-4 transition-opacity",
        isProcessing ? "opacity-50 pointer-events-none" : ""
      )}>
        <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
          <Shield className="w-4 h-4 text-[#006666]" />
          <h3 className="text-xs font-black uppercase text-gray-800 tracking-wider">System Backups</h3>
        </div>
        <p className="text-xs text-gray-500 font-medium">Backup inventory states, BOM configurations, and order ledgers locally or restore previous configurations.</p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={handleBackup} 
            className="flex-1 flex items-center justify-center gap-2 bg-[#6a4a63] hover:bg-[#5c3e55] text-white py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98] shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Generate Backup File
          </button>
          
          <button 
            onClick={handleRestore} 
            className="flex-1 flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Restore Data File
          </button>
        </div>
      </div>

      {/* DANGER ZONE */}
      <div className={cn(
        "border border-rose-200 rounded-xl p-5 bg-rose-50/10 space-y-4 transition-opacity",
        isProcessing ? "opacity-50 pointer-events-none" : ""
      )}>
        <div className="flex items-center gap-2 border-b border-rose-100 pb-3">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <h3 className="text-xs font-black uppercase text-rose-600 tracking-wider">Danger Zone</h3>
        </div>
        <div className="space-y-4">
          <p className="text-xs text-gray-500 leading-relaxed font-medium">
            <strong>Factory Reset:</strong> This will permanently delete all records (Items, Sales Orders, BOM Recipes, Transactions) in your PostgreSQL database instance. 
            This process is <span className="text-rose-600 font-bold">irreversible</span> and wipes all data history.
          </p>
          <button 
            onClick={handleFactoryReset} 
            className="w-full bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-200 hover:border-transparent py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98] cursor-pointer"
          >
            Wipe & Factory Reset Instance
          </button>
        </div>
      </div>

    </div>
  );
}
