// src/components/layout/Topbar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
  Bell, User, Command, Menu, X, Search, Sparkles, LogOut,
  LayoutDashboard, Package, ClipboardList, 
  ShoppingCart, Users, Truck, Factory, FileText, Settings,
  Sun, Moon
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Manufacturing', href: '/manufacturing', icon: Factory },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Suppliers', href: '/suppliers', icon: Truck },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Topbar({ onCommandPalette }: { onCommandPalette: () => void }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { data: session } = useSession();

  const user = session?.user;
  const username = user?.name || user?.username || "Staff User";
  const userRole = user?.role || "STAFF";
  const initials = username.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "US";
  const isAdmin = userRole === "ADMIN";

  // Filter links: Settings and Reports are only visible to ADMIN
  const filteredNavItems = navItems.filter((item) => {
    if (item.name === 'Settings' || item.name === 'Reports') {
      return isAdmin;
    }
    return true;
  });

  return (
    <>
      <header 
        className="sticky top-0 z-50 transition-colors duration-300 rounded-b-2xl shadow-lg"
        style={{
          backgroundColor: 'var(--color-topbar-bg)',
          borderBottom: '1px solid var(--color-topbar-border)',
        }}
      >
        <div className="flex items-center h-16 px-4 md:px-6">
          {/* Left: Logo + Mobile Menu Button */}
          <div className="flex items-center gap-3 w-[200px] flex-shrink-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <span className="text-xl font-bold text-white tracking-[0.15em] uppercase font-display">Zoie</span>
            <span className="hidden md:inline text-[10px] text-white/50 font-medium tracking-[0.2em] uppercase ml-1.5 font-display">Bathware</span>
          </div>

          {/* Center: Desktop Navigation */}
          <nav className="hidden md:flex items-center justify-center flex-1 gap-0.5">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-xl transition-all duration-200 whitespace-nowrap',
                    isActive
                      ? 'bg-white/10 text-white backdrop-blur-sm'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Actions - Desktop */}
          <div className="hidden md:flex items-center justify-end gap-2 md:gap-3 w-[200px] flex-shrink-0 relative">
            {/* Command Palette Button */}
            <button
              onClick={onCommandPalette}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-white/60 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10 group"
            >
              <div className="relative flex items-center">
                <Search className="w-4 h-4 group-hover:text-white transition-colors" />
                <Command className="w-2.5 h-2.5 absolute -bottom-1 -right-2 text-white/30 group-hover:text-white/60 transition-colors" />
              </div>
              <span className="font-mono text-xs">Ctrl+K</span>
            </button>

            <ThemeToggle />

            {/* Notification Bell with Dropdown */}
            <NotificationDropdown />

            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 p-1 hover:bg-white/10 rounded-xl transition-colors select-none"
              >
                <div className="w-8 h-8 bg-accent rounded-xl flex items-center justify-center text-sm font-medium text-white shadow-sm border border-white/10">
                  {initials}
                </div>
              </button>

              {profileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b border-gray-150 dark:border-zinc-800 mb-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{username}</p>
                      <p className="text-[10px] font-mono text-gray-400 uppercase tracking-wider mt-0.5">{userRole}</p>
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

          {/* Right: Mobile - Actions */}
          <div className="flex md:hidden items-center justify-end flex-1 gap-2">
            <ThemeToggle />
            <NotificationDropdown />
            
            {/* Profile Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center p-1 hover:bg-white/10 rounded-xl transition-colors select-none"
              >
                <div className="w-8 h-8 bg-accent rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-md border border-white/20">
                  {initials}
                </div>
              </button>

              {profileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-45" onClick={() => setProfileDropdownOpen(false)} />
                  <div className="absolute right-0 top-11 w-52 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 py-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-zinc-800 mb-1">
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{username}</p>
                      <p className="text-[9px] font-mono text-gray-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5">{userRole}</p>
                    </div>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        signOut({ callbackUrl: '/login' });
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[10px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/10 transition-colors uppercase tracking-wider"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Dropdown Panel */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden animate-in fade-in duration-200">
          {/* Glass backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute top-18 left-4 right-4 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border border-gray-200/50 dark:border-zinc-800/50 shadow-2xl rounded-3xl overflow-hidden animate-in slide-in-from-top-4 duration-300">
            <div className="max-h-[75vh] overflow-y-auto p-4 space-y-1.5">
              <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest px-3 mb-2 font-display">
                Navigation Menu
              </p>
              
              {filteredNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-4 px-3.5 py-3 text-sm rounded-2xl transition-all duration-150',
                      isActive
                        ? 'bg-accent text-white shadow-lg shadow-accent/20 font-bold'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                    )}
                  >
                    <div className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center transition-colors',
                      isActive ? 'bg-white/10' : 'bg-bg-tertiary'
                    )}>
                      <item.icon className={cn(
                        'w-4.5 h-4.5',
                        isActive ? 'text-white' : 'text-text-secondary'
                      )} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold tracking-tight">
                        {item.name}
                      </p>
                    </div>
                    {isActive && (
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    )}
                  </Link>
                );
              })}
              
              <div className="h-px bg-gray-150 dark:bg-zinc-800/60 my-3 mx-2" />
              
              {/* Command Palette Trigger */}
              <button
                onClick={() => {
                  onCommandPalette();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-4 px-3.5 py-3 text-sm rounded-2xl transition-all duration-150 w-full text-text-secondary hover:text-text-primary hover:bg-bg-hover"
              >
                <div className="w-9 h-9 rounded-xl bg-bg-tertiary flex items-center justify-center">
                  <Search className="w-4.5 h-4.5 text-text-secondary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold tracking-tight">Search Operations</p>
                  <p className="text-[10px] text-text-tertiary uppercase font-mono tracking-wider mt-0.5">Ctrl+K / ⌘K</p>
                </div>
              </button>
            </div>
            
            {/* Mobile Footer Status info */}
            <div className="border-t border-gray-150 dark:border-zinc-800/60 px-5 py-4 bg-bg-tertiary/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-accent rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-sm">
                  {initials}
                </div>
                <div>
                  <p className="text-xs font-bold text-text-primary tracking-tight">{username}</p>
                  <p className="text-[9px] font-mono text-text-tertiary uppercase tracking-wider mt-0.5">{userRole}</p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-text-tertiary tracking-wider font-display">ZOIE ERP</span>
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

  // Run a quick background check for low stock alerts on load to insert warnings
  useEffect(() => {
    runStockAlertsCheck().then(() => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });
  }, [queryClient]);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications(),
    refetchInterval: 15000 // Refresh alerts list every 15s
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
        className="relative p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors select-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full animate-ping" />
        )}
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 text-left">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-150 dark:border-zinc-800 bg-bg-tertiary/40">
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">Activity Feed</span>
              {unreadCount > 0 && (
                <button 
                  onClick={() => readAllMutation.mutate()}
                  className="text-[10px] font-bold text-accent hover:underline uppercase">
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-zinc-800">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-text-tertiary">No notifications or activity logs.</div>
              ) : (
                notifications.map((n: any) => (
                  <div 
                    key={n.id} 
                    onClick={() => {
                      if (!n.read) readMutation.mutate(n.id);
                    }}
                    className={cn(
                      "p-3.5 cursor-pointer transition-colors text-xs space-y-1",
                      n.read ? "bg-transparent hover:bg-bg-hover/20" : "bg-accent/5 hover:bg-accent/10"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={cn(
                        "font-bold",
                        n.type === 'WARNING' ? 'text-warning' :
                        n.type === 'SUCCESS' ? 'text-success' : 'text-text-primary'
                      )}>
                        {n.title}
                      </span>
                      <span className="text-[9px] text-text-tertiary shrink-0">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-secondary leading-snug">{n.message}</p>
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