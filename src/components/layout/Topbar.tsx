// src/components/layout/Topbar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Bell, User, Command, Menu, X, Search, Sparkles,
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
  { name: 'BOM', href: '/bom', icon: ClipboardList },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Suppliers', href: '/suppliers', icon: Truck },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Topbar({ onCommandPalette }: { onCommandPalette: () => void }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

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
            <span className="text-xl font-semibold text-white tracking-tight">Zoie</span>
            <span className="hidden md:inline text-xs text-white/40 font-medium tracking-wider uppercase ml-1">ERP</span>
          </div>

          {/* Center: Desktop Navigation */}
          <nav className="hidden md:flex items-center justify-center flex-1 gap-0.5">
            {navItems.map((item) => {
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
          <div className="hidden md:flex items-center justify-end gap-2 md:gap-3 w-[200px] flex-shrink-0">
            {/* Command Palette Button - New Design */}
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

            <button className="flex items-center gap-3 p-1.5 hover:bg-white/10 rounded-xl transition-colors">
              <div className="w-8 h-8 bg-accent rounded-xl flex items-center justify-center text-sm font-medium text-white">
                NP
              </div>
            </button>
          </div>

          {/* Right: Mobile - Only User Avatar */}
          <div className="flex md:hidden items-center justify-end w-[200px] flex-shrink-0">
            <button className="flex items-center gap-3 p-1.5 hover:bg-white/10 rounded-xl transition-colors">
              <div className="w-8 h-8 bg-accent rounded-xl flex items-center justify-center text-sm font-medium text-white">
                NP
              </div>
            </button>
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
          <div className="absolute top-16 left-0 right-0 bg-bg-secondary border-b border-border shadow-2xl rounded-b-3xl mx-4 overflow-hidden">
            <div className="max-h-[80vh] overflow-y-auto p-3 space-y-1">
              {navItems.map((item) => {
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
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                    )}
                  >
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      isActive ? 'bg-white/10' : 'bg-bg-tertiary'
                    )}>
                      <item.icon className={cn(
                        'w-5 h-5',
                        isActive ? 'text-white' : 'text-text-tertiary'
                      )} />
                    </div>
                    <div className="flex-1">
                      <p className={isActive ? 'text-white font-medium' : 'text-text-primary'}>
                        {item.name}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {isActive ? 'Current page' : 'Navigate to'}
                      </p>
                    </div>
                    {isActive && (
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    )}
                  </Link>
                );
              })}
              
              <div className="h-px bg-border my-2 mx-3" />
              
              <button
                onClick={() => {
                  onCommandPalette();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-4 px-4 py-3.5 text-base rounded-xl transition-all duration-150 w-full text-text-secondary hover:text-text-primary hover:bg-bg-hover"
              >
                <div className="w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center">
                  <Search className="w-5 h-5 text-text-tertiary" />
                  <Command className="w-3 h-3 absolute ml-4 mt-4 text-text-tertiary/40" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-text-primary">Open Command Palette</p>
                  <p className="text-xs text-text-tertiary">⌘K</p>
                </div>
              </button>

              <div className="flex items-center gap-3 px-4 py-3 mt-1">
                <button
                  onClick={toggleTheme}
                  className="flex-1 flex items-center justify-center gap-2 p-3 bg-bg-tertiary hover:bg-bg-hover rounded-xl transition-colors border border-border"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-5 h-5 text-warning" />
                  ) : (
                    <Moon className="w-5 h-5 text-info" />
                  )}
                  <span className="text-sm text-text-secondary">
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </span>
                </button>

                <button className="flex-1 flex items-center justify-center gap-2 p-3 bg-bg-tertiary hover:bg-bg-hover rounded-xl transition-colors border border-border relative">
                  <Bell className="w-5 h-5 text-text-secondary" />
                  <span className="text-sm text-text-secondary">Notifications</span>
                  <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full"></span>
                </button>
              </div>
            </div>
            
            <div className="border-t border-border px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-accent rounded-xl flex items-center justify-center text-sm font-medium text-white">
                  NP
                </div>
                <div>
                  <p className="text-sm text-text-primary font-medium">Nipun</p>
                  <p className="text-xs text-text-tertiary">Admin</p>
                </div>
              </div>
              <span className="text-xs text-text-tertiary">v1.0</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}