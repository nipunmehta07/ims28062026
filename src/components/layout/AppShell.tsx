// src/components/layout/AppShell.tsx
'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { CommandPalette } from './CommandPalette';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar 
          onCommandPalette={() => setCommandPaletteOpen(true)} 
        />
        
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>

      <CommandPalette 
        open={commandPaletteOpen} 
        onClose={() => setCommandPaletteOpen(false)} 
      />
    </div>
  );
}