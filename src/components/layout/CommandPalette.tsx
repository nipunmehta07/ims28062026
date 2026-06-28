// src/components/layout/CommandPalette.tsx
'use client';

import { useEffect, useState } from 'react';
import { Search, Command, Package, ShoppingCart, Users, FileText, Settings, Plus } from 'lucide-react';

const commands = [
  { 
    category: 'Navigation', 
    items: [
      { name: 'Go to Dashboard', shortcut: 'G D', icon: Command },
      { name: 'Go to Inventory', shortcut: 'G I', icon: Package },
      { name: 'Go to Orders', shortcut: 'G O', icon: ShoppingCart },
      { name: 'Go to Customers', shortcut: 'G C', icon: Users },
      { name: 'Go to Reports', shortcut: 'G R', icon: FileText },
    ]
  },
  { 
    category: 'Actions', 
    items: [
      { name: 'Create New Order', shortcut: 'N O', icon: ShoppingCart },
      { name: 'Create New Product', shortcut: 'N P', icon: Package },
      { name: 'Open Settings', shortcut: 'S', icon: Settings },
    ]
  },
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) {
          onClose();
        } else {
          onClose(); // This toggles open
        }
      }
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setQuery('');
    }
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed top-[25%] left-1/2 -translate-x-1/2 w-full max-w-2xl bg-background-secondary border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <Search className="w-5 h-5 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search or type a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-text-tertiary outline-none"
            autoFocus
          />
          <kbd className="px-2 py-1 text-xs text-text-tertiary bg-background-tertiary rounded">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2">
          {commands.map((category) => (
            <div key={category.category}>
              <p className="px-3 py-2 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                {category.category}
              </p>
              {category.items.map((item) => (
                <button
                  key={item.name}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm text-text-secondary hover:text-white hover:bg-hover rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                  <kbd className="px-2 py-0.5 text-xs text-text-tertiary bg-background-tertiary rounded">
                    {item.shortcut}
                  </kbd>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}