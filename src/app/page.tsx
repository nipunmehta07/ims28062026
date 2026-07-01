// src/app/page.tsx
"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, Package, Factory, Users, Settings, Sparkles, MessageCircle, Compass, 
  LogOut, HelpCircle, ShoppingCart, Truck, FileText
} from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

// App definitions using the real application modules
const modules = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, iconBg: "bg-blue-50 dark:bg-blue-950/20", iconColor: "text-blue-500" },
  { name: "Inventory", path: "/inventory", icon: Package, iconBg: "bg-amber-50 dark:bg-amber-950/20", iconColor: "text-amber-500" },
  { name: "Orders", path: "/orders", icon: ShoppingCart, iconBg: "bg-emerald-50 dark:bg-emerald-950/20", iconColor: "text-emerald-500" },
  { name: "Manufacturing", path: "/manufacturing", icon: Factory, iconBg: "bg-cyan-50 dark:bg-cyan-950/20", iconColor: "text-cyan-500" },
  { name: "Customers", path: "/customers", icon: Users, iconBg: "bg-purple-50 dark:bg-purple-950/20", iconColor: "text-purple-500" },
  { name: "Suppliers", path: "/suppliers", icon: Truck, iconBg: "bg-rose-50 dark:bg-rose-950/20", iconColor: "text-rose-500" },
  { name: "Reports", path: "/reports", icon: FileText, iconBg: "bg-violet-50 dark:bg-violet-950/20", iconColor: "text-violet-500", adminOnly: true },
  { name: "Settings", path: "/settings", icon: Settings, iconBg: "bg-gray-50 dark:bg-gray-900/20", iconColor: "text-gray-500", adminOnly: true },
];

export default function ModuleSelectorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Redirect to login if not authenticated
  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#eae8fc] via-[#e2dff5] to-[#decde8]">
        <div className="w-8 h-8 border-4 border-[#714b67] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const user = session?.user;
  const username = user?.name || user?.username || "Staff User";
  const userRole = user?.role || "STAFF";
  const initials = username.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "US";
  const isAdmin = userRole === "ADMIN";

  const handleModuleClick = (name: string, comingSoon?: boolean) => {
    if (comingSoon) {
      toast.success(`${name} module mock is coming soon!`, {
        icon: '🚀',
        style: {
          borderRadius: '12px',
          background: '#6a4a63',
          color: '#fff',
        }
      });
    }
  };

  // Filter modules based on admin privileges
  const filteredModules = modules.filter(m => !m.adminOnly || isAdmin);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#eae8fc] via-[#e2dff5] to-[#decde8] flex flex-col font-sans select-none overflow-x-hidden">
      
      {/* MODULE SCREEN HEADER */}
      <header className="w-full h-14 flex items-center justify-end px-6 bg-transparent shrink-0">
        <div className="flex items-center gap-5 text-gray-700 font-medium">
          
          {/* AI Sparkle Icon */}
          <button 
            onClick={() => handleModuleClick("Zoie AI Assistant", true)}
            className="p-1.5 hover:bg-white/30 rounded-lg transition-colors text-purple-600 hover:scale-105 active:scale-95"
            title="Zoie AI"
          >
            <Sparkles className="w-4.5 h-4.5" />
          </button>

          {/* Chat / Discuss Icon with Badge */}
          <div className="relative">
            <button 
              onClick={() => handleModuleClick("Discuss", true)}
              className="p-1.5 hover:bg-white/30 rounded-lg transition-colors hover:scale-105 active:scale-95 text-gray-700"
            >
              <MessageCircle className="w-4.5 h-4.5" />
            </button>
            <span className="absolute -top-1.5 -right-1.5 bg-[#a2436f] text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-sm">
              3
            </span>
          </div>

          {/* Compass Icon */}
          <button 
            onClick={() => handleModuleClick("App Market", true)}
            className="p-1.5 hover:bg-white/30 rounded-lg transition-colors hover:scale-105 active:scale-95 text-gray-700"
            title="Discover Apps"
          >
            <Compass className="w-4.5 h-4.5" />
          </button>

          {/* Org Name */}
          <span className="text-xs font-bold text-[#6a4a63] bg-white/40 px-3 py-1 rounded-full border border-white/20 select-none">
            Zoie INC.
          </span>

          {/* User Initial Avatar Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="w-8 h-8 rounded-xl bg-[#6a4a63] text-white flex items-center justify-center text-xs font-bold shadow-md hover:scale-105 active:scale-95 transition-all border border-white/20"
            >
              {initials}
            </button>

            {profileDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-150 z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                  <div className="px-4 py-2 border-b border-gray-100 mb-1">
                    <p className="text-xs font-bold text-gray-800 truncate">{username}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{userRole}</p>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors uppercase tracking-wider"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* MODULE SELECT GRID CONTAINER */}
      <main className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-4xl grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-x-6 gap-y-10 justify-items-center animate-in fade-in slide-in-from-bottom-8 duration-600">
          
          {filteredModules.map((m) => {
            const Icon = m.icon;
            
            return (
              <div key={m.name} className="flex flex-col items-center">
                <Link
                  href={m.path}
                  className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-3xl shadow-md hover:shadow-xl border border-gray-100/60 flex items-center justify-center hover:scale-105 hover:-translate-y-1 active:scale-95 transition-all duration-300 group"
                >
                  <div className={cn(
                    "w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center transition-all duration-300",
                    m.iconBg
                  )}>
                    <Icon className={cn("w-9 h-9 sm:w-11 sm:h-11 transition-transform group-hover:scale-110 group-hover:rotate-3 duration-300", m.iconColor)} strokeWidth={1.5} />
                  </div>
                </Link>
                
                <span className="text-xs sm:text-sm font-bold text-gray-700 tracking-wide mt-3 text-center truncate w-24">
                  {m.name}
                </span>
              </div>
            );
          })}
        </div>
      </main>

      {/* VERSION INFO FOOTER */}
      <footer className="w-full py-4 text-center text-[10px] text-gray-400 font-semibold uppercase tracking-widest shrink-0 select-none">
        Zoie Bathware • Manufacturing Suite v1.0
      </footer>
    </div>
  );
}
