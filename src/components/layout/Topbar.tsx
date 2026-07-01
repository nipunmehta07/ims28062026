// src/components/layout/Topbar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  Bell, User, Command, Menu, X, Search, Sparkles, LogOut,
  LayoutDashboard, Package, ClipboardList, 
  ShoppingCart, Users, Truck, Factory, FileText, Settings as SettingsIcon,
  Sun, Moon, LayoutGrid, MessageCircle, Compass
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Manufacturing', href: '/manufacturing', icon: Factory },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Suppliers', href: '/suppliers', icon: Truck },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
];

export function Topbar({ onCommandPalette }: { onCommandPalette: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { data: session } = useSession();

  const user = session?.user;
  const username = user?.name || user?.username || "Staff User";
  const userRole = user?.role || "STAFF";
  const initials = username.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "US";
  const isAdmin = userRole === "ADMIN";

  // Filter links for mobile sidebar menu
  const filteredNavItems = navItems.filter((item) => {
    if (item.name === 'Settings' || item.name === 'Reports') {
      return isAdmin;
    }
    return true;
  });

  // Calculate dynamic module title based on route path
  let moduleTitle = "Zoie ERP";
  let moduleIcon = LayoutGrid;
  let subTabs: { label: string; href: string; active: boolean }[] = [];

  if (pathname.startsWith('/dashboard')) {
    moduleTitle = "Dashboards";
    moduleIcon = LayoutDashboard;
    subTabs = [
      { label: "Dashboards", href: "/dashboard", active: !tabParam || tabParam === 'operations' },
      { label: "Configuration", href: "/dashboard?tab=analysis", active: tabParam === 'analysis' }
    ];
  } else if (pathname.startsWith('/inventory')) {
    moduleTitle = "Inventory";
    moduleIcon = Package;
    subTabs = [
      { label: "Overview", href: "/inventory?tab=overview", active: !tabParam || tabParam === 'overview' },
      { label: "Operations", href: "/inventory?tab=operations", active: tabParam === 'operations' },
      { label: "Products", href: "/inventory?tab=products", active: tabParam === 'products' },
      { label: "Reporting", href: "/inventory?tab=reporting", active: tabParam === 'reporting' },
      { label: "Configuration", href: "/inventory?tab=config", active: tabParam === 'config' }
    ];
  } else if (pathname.startsWith('/orders')) {
    moduleTitle = "Orders";
    moduleIcon = ShoppingCart;
    subTabs = [
      { label: "Sales Pipeline", href: "/orders", active: true }
    ];
  } else if (pathname.startsWith('/manufacturing') || pathname.startsWith('/bom')) {
    moduleTitle = "Manufacturing";
    moduleIcon = Factory;
    subTabs = [
      { label: "Manufacturing Orders", href: "/manufacturing?tab=production", active: !tabParam || tabParam === 'production' },
      { label: "Bill of Materials", href: "/manufacturing?tab=bom", active: tabParam === 'bom' }
    ];
  } else if (pathname.startsWith('/customers')) {
    moduleTitle = "Customers";
    moduleIcon = Users;
    subTabs = [
      { label: "Directory", href: "/customers", active: true }
    ];
  } else if (pathname.startsWith('/suppliers')) {
    moduleTitle = "Suppliers";
    moduleIcon = Truck;
    subTabs = [
      { label: "Suppliers Directory", href: "/suppliers", active: true }
    ];
  } else if (pathname.startsWith('/reports')) {
    moduleTitle = "Reports";
    moduleIcon = FileText;
    subTabs = [
      { label: "Reports Analysis", href: "/reports", active: true }
    ];
  } else if (pathname.startsWith('/settings')) {
    moduleTitle = "Settings";
    moduleIcon = SettingsIcon;
    subTabs = [
      { label: "General Settings", href: "/settings", active: true }
    ];
  }

  const ActiveIcon = moduleIcon;

  return (
    <>
      <header className="sticky top-0 z-40 w-full h-14 bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-900 select-none shadow-sm flex items-center justify-between px-4 md:px-6">
        
        {/* LEFT SECTION: App Launcher, Module Header & Sub-Tabs */}
        <div className="flex items-center gap-3">
          
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* App Launcher (9 Dots) */}
          <Link 
            href="/" 
            className="p-2 text-gray-500 hover:text-[#006666] dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-gray-150/40 dark:hover:bg-zinc-900 rounded-lg transition-all hover:scale-105 active:scale-95"
            title="App Launcher"
          >
            <LayoutGrid className="w-5 h-5" />
          </Link>

          {/* Vertical Separator */}
          <div className="hidden sm:block h-6 w-px bg-gray-200 dark:bg-zinc-800 mx-1" />

          {/* Active Module Header */}
          <div className="hidden sm:flex items-center gap-2 font-display">
            <ActiveIcon className="w-4 h-4 text-[#006666]" />
            <span className="text-sm font-black text-gray-800 dark:text-gray-100 tracking-wide uppercase">
              {moduleTitle}
            </span>
          </div>

          {/* Sub Navigation Tabs */}
          {subTabs.length > 0 && (
            <nav className="hidden md:flex items-center gap-4 text-xs font-bold pl-6 border-l border-gray-150 dark:border-zinc-800 h-6">
              {subTabs.map((tab) => (
                <Link
                  key={tab.label}
                  href={tab.href}
                  className={cn(
                    "transition-colors pb-0.5",
                    tab.active
                      ? "text-[#006666] border-b-2 border-[#006666]"
                      : "text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
                  )}
                >
                  {tab.label}
                </Link>
              ))}
            </nav>
          )}
        </div>

        {/* RIGHT SECTION: Odoo Utilities */}
        <div className="flex items-center gap-2 sm:gap-4.5 text-gray-600 dark:text-zinc-400">
          
          {/* Search Trigger */}
          <button
            onClick={onCommandPalette}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-lg transition-colors text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200"
            title="Search Operations (Ctrl+K)"
          >
            <Search className="w-4.5 h-4.5" />
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* AI Assistant Badge */}
          <Link
            href="/"
            className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/20 dark:hover:bg-purple-950/40 rounded-lg border border-purple-100 dark:border-purple-900/30 transition-all hover:scale-105 active:scale-95"
            title="Zoie AI Assistant"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest leading-none font-display">AI</span>
          </Link>

          {/* Chat Notifications Badge */}
          <div className="relative">
            <Link
              href="/"
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-lg transition-colors block text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200"
            >
              <MessageCircle className="w-4.5 h-4.5" />
            </Link>
            <span className="absolute -top-1 -right-1 bg-[#a2436f] text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
              3
            </span>
          </div>

          {/* Notification Bell */}
          <NotificationDropdown />

          {/* History/Compass Icon */}
          <Link
            href="/audit-trail"
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-lg transition-colors text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200"
            title="Audit Trail Logs"
          >
            <Compass className="w-4.5 h-4.5" />
          </Link>

          {/* Settings gear */}
          {isAdmin && (
            <Link
              href="/settings"
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-lg transition-colors text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200"
              title="System Configuration Settings"
            >
              <SettingsIcon className="w-4.5 h-4.5" />
            </Link>
          )}

          {/* Vertical Separator */}
          <div className="hidden sm:block h-5 w-px bg-gray-200 dark:bg-zinc-800 mx-1" />

          {/* Org name */}
          <span className="hidden lg:inline text-xs font-bold text-[#006666] bg-gray-50 dark:bg-zinc-900 px-3 py-1 rounded-full border border-gray-150 dark:border-zinc-800">
            Zoie INC.
          </span>

          {/* Profile Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center p-0.5 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-xl transition-colors select-none"
            >
              <div className="w-7 h-7 bg-[#006666] rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-sm border border-white/10">
                {initials}
              </div>
            </button>

            {profileDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-150 text-left">
                  <div className="px-4 py-2 border-b border-gray-150 dark:border-zinc-800 mb-1">
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{username}</p>
                    <p className="text-[9px] font-mono text-gray-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">{userRole}</p>
                  </div>
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      signOut({ callbackUrl: '/login' });
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors uppercase tracking-wider"
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

      {/* Mobile Menu Dropdown Panel */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute top-14 left-4 right-4 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-900 shadow-2xl rounded-2xl overflow-hidden animate-in slide-in-from-top-4 duration-300">
            <div className="max-h-[70vh] overflow-y-auto p-4 space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2 font-display">
                Navigation Menu
              </p>
              {filteredNavItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 text-xs rounded-xl transition-all duration-150',
                      isActive
                        ? 'bg-[#e3f2f1] text-[#006666] font-bold'
                        : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-900'
                    )}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ==========================================
// NOTIFICATION DROPDOWN COMPONENT
// ==========================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getNotifications, markNotificationRead, markAllNotificationsRead, runStockAlertsCheck } from "@/app/actions";

function NotificationDropdown() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    runStockAlertsCheck().then(() => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });
  }, [queryClient]);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications(),
    refetchInterval: 15000
  });

  const readMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] })
  });

  const readAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] })
  });

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="relative p-1.5 text-gray-500 hover:text-gray-800 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-lg transition-colors select-none"
      >
        <Bell className="w-4.5 h-4.5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
        )}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 text-left">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-150 dark:border-zinc-800 bg-gray-50/40">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Activity Feed</span>
              {unreadCount > 0 && (
                <button 
                  onClick={() => readAllMutation.mutate()}
                  className="text-[9px] font-bold text-[#006666] hover:underline uppercase">
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-zinc-800">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-gray-400">No notifications.</div>
              ) : (
                notifications.map((n: any) => (
                  <div 
                    key={n.id} 
                    onClick={() => {
                      if (!n.read) readMutation.mutate(n.id);
                    }}
                    className={cn(
                      "p-3.5 cursor-pointer transition-colors text-xs space-y-1",
                      n.read ? "bg-transparent hover:bg-gray-50" : "bg-[#006666]/5 hover:bg-[#006666]/10"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={cn(
                        "font-bold",
                        n.type === 'WARNING' ? 'text-amber-600' :
                        n.type === 'SUCCESS' ? 'text-emerald-600' : 'text-gray-800 dark:text-gray-100'
                      )}>
                        {n.title}
                      </span>
                      <span className="text-[9px] text-gray-400 shrink-0">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-snug">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}