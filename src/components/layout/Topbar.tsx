// src/components/layout/Topbar.tsx
import { Bell, User, Command } from 'lucide-react';

export function Topbar({ onCommandPalette }: { onCommandPalette: () => void }) {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background">
      <div className="flex items-center gap-4">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-text-secondary">Home</span>
          <span className="text-text-tertiary">/</span>
          <span className="text-white">Dashboard</span>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {/* Command Palette Shortcut */}
        <button 
          onClick={onCommandPalette}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-text-secondary bg-background-tertiary rounded-lg hover:bg-hover transition-colors"
        >
          <Command className="w-3 h-3" />
          <span>⌘K</span>
        </button>

        {/* Notification */}
        <button className="relative p-2 text-text-secondary hover:text-white hover:bg-hover rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent rounded-full"></span>
        </button>

        {/* User */}
        <button className="flex items-center gap-3 p-1.5 hover:bg-hover rounded-lg transition-colors">
          <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-sm font-medium">
            JD
          </div>
        </button>
      </div>
    </header>
  );
}