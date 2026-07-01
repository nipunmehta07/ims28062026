"use client";

import React, { useState, useRef, useEffect } from "react";
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
import { Settings, Shield, AlertTriangle, Activity, Download, Upload, Users, UserPlus, ShieldAlert, Trash2 } from "lucide-react";

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
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 max-w-3xl">
      <input type="file" ref={fileInputRef} onChange={onFileChange} accept=".json" className="hidden" />

      {/* Page Header */}
      <div className="glass-card bg-mesh-gradient rounded-2xl p-6 relative overflow-hidden transition-all duration-300">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-text-primary tracking-tight">System Settings</h1>
            <p className="text-sm text-text-secondary">Configure backups, restore snapshots, manage database users, and customize system configuration parameters.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full">
            <Settings className="w-3.5 h-3.5 text-accent animate-spin" style={{ animationDuration: '8s' }} />
            <span className="text-xs font-semibold text-accent tracking-wide uppercase">Config</span>
          </div>
        </div>
      </div>

      {/* SYSTEM PROGRESS OVERLAY */}
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

      {/* RBAC USER MANAGEMENT PANEL */}
      <div className="glass-card rounded-2xl p-6 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-accent" />
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">User Directory & RBAC</h4>
        </div>
        <p className="text-xs text-text-secondary mb-6">Manage roles and platform credentials for all staff members.</p>

        {/* Create User Form */}
        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 p-4 rounded-xl bg-bg-tertiary/40 border border-border/60">
          <div className="md:col-span-2 flex items-center gap-1 text-[11px] font-bold text-text-secondary uppercase tracking-wider border-b border-border/40 pb-2">
            <UserPlus className="w-3.5 h-3.5 text-accent" /> Register User
          </div>
          <div>
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-1">Full Name</label>
            <input required type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-xl text-xs text-text-primary outline-none focus:border-accent" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-1">Username</label>
            <input required type="text" placeholder="johndoe" value={username} onChange={e => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-xl text-xs text-text-primary outline-none focus:border-accent" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-1">Email Address</label>
            <input required type="email" placeholder="john@zoie.com" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-xl text-xs text-text-primary outline-none focus:border-accent" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-1">Password</label>
            <input type="password" placeholder="Defaults to Zoie123!" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-xl text-xs text-text-primary outline-none focus:border-accent" />
          </div>
          <div className="md:col-span-2 flex items-end justify-between gap-4 mt-2">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block mb-1">Assigned Role</label>
              <select value={role} onChange={e => setRole(e.target.value)}
                className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-xl text-xs text-text-primary outline-none focus:border-accent">
                <option value="ADMIN">ADMIN (Full Access)</option>
                <option value="MANAGER">MANAGER (BOMs & Auditing)</option>
                <option value="WAREHOUSE">WAREHOUSE (Stock Control Only)</option>
                <option value="SALES">SALES (Orders Pipeline Only)</option>
                <option value="STAFF">STAFF (General Access)</option>
              </select>
            </div>
            <button type="submit" disabled={createUserMutation.isPending}
              className="px-6 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl tracking-wider uppercase transition-all shadow-md active:scale-95 disabled:opacity-50">
              {createUserMutation.isPending ? "Creating..." : "Add User"}
            </button>
          </div>
        </form>

        {/* Users List */}
        {loadingUsers ? (
          <div className="text-center py-6 text-xs text-text-tertiary">Loading user list...</div>
        ) : (
          <div className="overflow-hidden border border-border rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-bg-tertiary/40 border-b border-border font-bold text-text-secondary">
                  <th className="p-3">User</th>
                  <th className="p-3">Username / Email</th>
                  <th className="p-3">Assigned Role</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-bg-hover/30 transition-colors">
                    <td className="p-3 font-semibold text-text-primary">{u.name}</td>
                    <td className="p-3 space-y-0.5">
                      <p className="text-text-primary font-mono">{u.username}</p>
                      <p className="text-text-tertiary text-[10px]">{u.email}</p>
                    </td>
                    <td className="p-3">
                      <select value={u.role} onChange={e => updateRoleMutation.mutate({ userId: u.id, role: e.target.value })}
                        className="px-2.5 py-1 bg-bg-secondary border border-border rounded-lg text-xs font-semibold text-text-primary outline-none focus:border-accent">
                        <option value="ADMIN">ADMIN</option>
                        <option value="MANAGER">MANAGER</option>
                        <option value="WAREHOUSE">WAREHOUSE</option>
                        <option value="SALES">SALES</option>
                        <option value="STAFF">STAFF</option>
                      </select>
                    </td>
                    <td className="p-3 text-right">
                      <button onClick={() => { if (confirm("Remove user access?")) deleteUserMutation.mutate(u.id); }}
                        className="p-1.5 text-text-tertiary hover:text-error hover:bg-error/10 rounded-lg transition-colors" title="Delete Access">
                        <Trash2 className="w-3.5 h-3.5" />
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