// src/components/layout/AppShell.tsx
'use client';

import { useState, useEffect } from 'react';
import { Topbar } from './Topbar';
import { CommandPalette } from './CommandPalette';

import { isPrimaryModifierPressed } from '@/lib/platform';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Global keyboard shortcuts (Ctrl+K palette, Ctrl+D Dashboard, Ctrl+I Inventory, etc.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid firing shortcuts when user is typing in form inputs/textareas
      const activeEl = document.activeElement?.tagName;
      if (activeEl === 'INPUT' || activeEl === 'TEXTAREA' || activeEl === 'SELECT') {
        return;
      }

      const isMod = isPrimaryModifierPressed(e);

      if (isMod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      } else if (isMod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        window.location.href = '/';
      } else if (isMod && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        window.location.href = '/inventory';
      } else if (isMod && e.key.toLowerCase() === 'o' && !e.shiftKey) {
        e.preventDefault();
        window.location.href = '/orders';
      } else if (isMod && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        window.location.href = '/manufacturing';
      } else if (isMod && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        window.location.href = '/bom';
      } else if (isMod && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        window.location.href = '/customers';
      } else if (isMod && e.key.toLowerCase() === 's' && !e.shiftKey) {
        e.preventDefault();
        window.location.href = '/suppliers';
      } else if (isMod && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        window.location.href = '/reports';
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Simulate loading completion when components are mounted to client
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-bg-primary flex flex-col items-center justify-center z-[9999] animate-fade-in">
        <div className="flex flex-col items-center gap-4">
          {/* Minimalist modern spinning design loader */}
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-accent/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em] font-display">Zoie</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs font-bold text-text-primary uppercase tracking-widest font-display animate-pulse">Syncing Instance</p>
            <p className="text-[9px] text-text-tertiary uppercase tracking-widest font-mono">Zoie Bathware v1.0</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <Topbar onCommandPalette={() => setCommandPaletteOpen(true)} />
      <main className="p-6 max-w-7xl mx-auto">
        {children}
      </main>
      {/* Only render CommandPalette once */}
      <CommandPalette 
        open={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)} 
      />
    </div>
  );
}