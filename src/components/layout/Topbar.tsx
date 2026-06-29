// src/components/layout/Topbar.tsx
'use client';

import { useState } from 'react';
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
              <span className="font-mono text-xs">⌘K</span>
            </button>

            <ThemeToggle />

            <button className="relative p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full"></span>
            </button>

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

          {/* Right: Mobile - User Avatar */}
          <div className="flex md:hidden items-center justify-end w-[200px] flex-shrink-0 relative">
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
                <div className="absolute right-0 top-12 w-52 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-150">
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
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute top-16 left-0 right-0 bg-white dark:bg-zinc-950 border-b border-gray-250 dark:border-zinc-800 shadow-2xl rounded-b-3xl mx-4 overflow-hidden">
            <div className="max-h-[80vh] overflow-y-auto p-3 space-y-1">
              {filteredNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-4 px-4 py-3.5 text-base rounded-xl transition-all duration-150',
                      isActive
                        ? 'bg-accent text-white shadow-lg shadow-accent/20'
                        : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-900'
                    )}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      isActive ? 'bg-white/10' : 'bg-gray-100 dark:bg-zinc-900'
                    )}>
                      <item.icon className={cn(
                        'w-5 h-5',
                        isActive ? 'text-white' : 'text-gray-500 dark:text-zinc-400'
                      )} />
                    </div>
                    <div className="flex-1">
                      <p className={isActive ? 'text-white font-medium' : 'text-gray-900 dark:text-zinc-100'}>
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-zinc-500">
                        {isActive ? 'Current page' : 'Navigate to'}
                      </p>
                    </div>
                    {isActive && (
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    )}
                  </Link>
                );
              })}
              
              <div className="h-px bg-gray-100 dark:bg-zinc-800 my-2 mx-3" />
              
              <button
                onClick={() => {
                  onCommandPalette();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-4 px-4 py-3.5 text-base rounded-xl transition-all duration-150 w-full text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-900"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-zinc-900 flex items-center justify-center">
                  <Search className="w-5 h-5 text-gray-500 dark:text-zinc-400" />
                  <Command className="w-3.5 h-3.5 absolute ml-4 mt-4 text-gray-400 dark:text-zinc-500" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-gray-900 dark:text-zinc-100">Open Command Palette</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500">⌘K</p>
                </div>
              </button>

              <div className="flex items-center gap-3 px-4 py-3 mt-1">
                <button
                  onClick={toggleTheme}
                  className="flex-1 flex items-center justify-center gap-2 p-3 bg-gray-100 dark:bg-zinc-900 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-xl transition-colors border border-gray-200 dark:border-zinc-800"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-5 h-5 text-amber-500" />
                  ) : (
                    <Moon className="w-5 h-5 text-indigo-500" />
                  )}
                  <span className="text-sm text-gray-600 dark:text-zinc-400">
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </span>
                </button>

                <button className="flex-1 flex items-center justify-center gap-2 p-3 bg-gray-100 dark:bg-zinc-900 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded-xl transition-colors border border-gray-200 dark:border-zinc-800 relative">
                  <Bell className="w-5 h-5 text-gray-500 dark:text-zinc-400" />
                  <span className="text-sm text-gray-600 dark:text-zinc-400">Notifications</span>
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-accent rounded-full"></span>
                </button>
              </div>
            </div>
            
            <div className="border-t border-gray-155 dark:border-zinc-800 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-accent rounded-xl flex items-center justify-center text-sm font-medium text-white">
                  {initials}
                </div>
                <div>
                  <p className="text-sm text-gray-900 dark:text-zinc-100 font-medium">{username}</p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 capitalize">{userRole}</p>
                </div>
              </div>
              <span className="text-xs text-gray-400 dark:text-zinc-500">v1.0</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}