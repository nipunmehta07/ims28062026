"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, ShieldCheck, User as UserIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "./ui/Button";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  menuItems: any[];
  badgeCount: number;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  setIsSidebarHovered: (val: boolean) => void;
}

export default function Sidebar({ 
  activeTab, setActiveTab, menuItems, isCollapsed, setIsCollapsed, setIsSidebarHovered 
}: SidebarProps) {
  
  const { data: session } = useSession();
  const [internalHover, setInternalHover] = useState(false);
  const shouldExpand = internalHover || !isCollapsed;

  const isAdmin = session?.user?.role === "ADMIN";
  const userRole = session?.user?.role || "STAFF";

  /**
   * FILTER LOGIC:
   * We hide 'dashboard' and 'settings' if the user is not an ADMIN.
   */
  const filteredMenuItems = menuItems.filter((item) => {
    const restrictedTabs = ["dashboard", "settings"];
    if (restrictedTabs.includes(item.id)) {
      return isAdmin; // Only allow if ADMIN
    }
    return true; // Allow all other tabs (Orders, Inventory, etc.)
  });

  return (
    <aside 
      onMouseEnter={() => {
        if (isCollapsed) {
          setInternalHover(true);
          setIsSidebarHovered(true);
        }
      }}
      onMouseLeave={() => {
        setInternalHover(false);
        setIsSidebarHovered(false);
      }}
      className={`fixed left-0 top-0 h-full transition-all duration-500 ease-in-out z-50 
        ${shouldExpand ? "w-72 p-6" : "w-20 p-2"}`}
    >
      <div className="relative h-full bg-background dark:bg-zinc-950 border border-gray-200 dark:border-white/5 rounded-[2.5rem] shadow-2xl flex flex-col items-center overflow-hidden transition-colors duration-500">
        
        {/* LOGO SECTION */}
        <div className={`w-full flex items-center border-b border-gray-50 dark:border-white/5 py-8 
          ${shouldExpand ? "px-8 gap-4" : "justify-center"}`}>
          <div className="w-10 h-10 bg-foreground text-background rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-colors">
            <span className="font-black text-xs italic">Z</span>
          </div>
          {shouldExpand && (
            <div className="flex flex-col text-left animate-in fade-in duration-500">
              <h1 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground truncate">
                Zoie India
              </h1>
              <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Manufacturing ERP</p>
            </div>
          )}
        </div>

        {/* NAVIGATION: Uses filteredMenuItems instead of menuItems */}
        <nav className={`flex-1 w-full py-6 space-y-4 overflow-y-auto no-scrollbar 
          ${shouldExpand ? "px-4" : "px-2"}`}>
          {filteredMenuItems.map((item) => (
            <Button
              key={item.id}
              variant={activeTab === item.id ? "primary" : "ghost"}
              size={isCollapsed ? "sm" : "md"}
              onClick={() => setActiveTab(item.id)}
              className={`w-full ${shouldExpand ? "" : "justify-center"} ${activeTab === item.id ? "shadow-xl scale-105" : ""}`}
            >
              <span className="text-xl shrink-0 leading-none">{item.icon}</span>
              {shouldExpand && (
                <span className="text-[10px] font-black uppercase tracking-widest truncate animate-in slide-in-from-left-2 duration-300">
                  {item.label}
                </span>
              )}
            </Button>
          ))}
        </nav>

        {/* FOOTER: USER & ROLE SECTION */}
        <div className="w-full border-t border-gray-50 dark:border-white/5 py-6 flex flex-col items-center gap-4 bg-gray-50/50 dark:bg-zinc-900/20">
          
          <div className={`flex items-center w-full transition-all ${shouldExpand ? "px-6 gap-3" : "justify-center"}`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isAdmin ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'}`}>
              {isAdmin ? <ShieldCheck size={16} /> : <UserIcon size={16} />}
            </div>
            
            {shouldExpand && (
              <div className="flex flex-col text-left truncate animate-in fade-in duration-300">
                <span className="text-[10px] font-black uppercase text-foreground truncate">
                  {session?.user?.name || session?.user?.username || "Staff User"}
                </span>
                <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-widest w-fit mt-0.5 ${
                  isAdmin ? 'bg-rose-100 text-rose-600' : 'bg-zinc-200 text-zinc-500'
                }`}>
                  {userRole}
                </span>
              </div>
            )}
          </div>

          <button 
            onClick={() => {
              setIsCollapsed(!isCollapsed);
              setInternalHover(false);
              setIsSidebarHovered(false);
            }}
            className="w-8 h-8 bg-foreground text-background rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all border-4 border-background dark:border-zinc-950"
          >
            {isCollapsed ? <ChevronRight size={12} strokeWidth={3} /> : <ChevronLeft size={12} strokeWidth={3} />}
          </button>
        </div>
      </div>
    </aside>
  );
}