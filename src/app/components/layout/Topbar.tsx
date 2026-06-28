// components/layout/Topbar.tsx
import { Bell, User, Settings as SettingsIcon, Command } from 'lucide-react';

export function Topbar({ onCommandPalette }: { onCommandPalette: () => void }) {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-[#2a2a3e] bg-[#0a0a0f]">
      <div className="flex items-center gap-4">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm">
          <span className="text-[#a0a0b8]">Home</span>
          <span className="text-[#6e6e8a]">/</span>
          <span className="text-white">Dashboard</span>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {/* Command Palette Shortcut */}
        <button 
          onClick={onCommandPalette}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-[#a0a0b8] bg-[#1e1e2e] rounded-lg hover:bg-[#2a2a3e] transition-colors"
        >
          <Command className="w-3 h-3" />
          <span>⌘K</span>
        </button>

        {/* Notification */}
        <button className="relative p-2 text-[#a0a0b8] hover:text-white hover:bg-[#1e1e2e] rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#6366f1] rounded-full"></span>
        </button>

        {/* User */}
        <button className="flex items-center gap-3 p-1.5 hover:bg-[#1e1e2e] rounded-lg transition-colors">
          <div className="w-8 h-8 bg-[#6366f1] rounded-full flex items-center justify-center text-sm font-medium">
            JD
          </div>
        </button>
      </div>
    </header>
  );
}