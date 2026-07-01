// src/components/layout/CommandPalette.tsx
'use client';

import { useEffect, useState } from 'react';
import { 
  Search, 
  LayoutDashboard,
  Package, 
  ShoppingCart, 
  Users, 
  FileText, 
  Settings, 
  Truck,
  Factory,
  ClipboardList,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const commands = [
  { 
    category: 'Navigation', 
    items: [
      { name: 'Go to Dashboard', shortcut: 'Ctrl+D', icon: LayoutDashboard, href: '/' },
      { name: 'Go to Inventory', shortcut: 'Ctrl+I', icon: Package, href: '/inventory' },
      { name: 'Go to Orders', shortcut: 'Ctrl+O', icon: ShoppingCart, href: '/orders' },
      { name: 'Go to Manufacturing', shortcut: 'Ctrl+M', icon: Factory, href: '/manufacturing' },
      { name: 'Go to BOM', shortcut: 'Ctrl+B', icon: ClipboardList, href: '/bom' },
      { name: 'Go to Customers', shortcut: 'Ctrl+C', icon: Users, href: '/customers' },
      { name: 'Go to Suppliers', shortcut: 'Ctrl+S', icon: Truck, href: '/suppliers' },
      { name: 'Go to Reports', shortcut: 'Ctrl+R', icon: FileText, href: '/reports' },
    ]
  },
  { 
    category: 'Actions', 
    items: [
      { name: 'Create New Order', shortcut: 'Ctrl+Shift+O', icon: ShoppingCart, action: 'create-order' },
      { name: 'Create New Product', shortcut: 'Ctrl+Shift+P', icon: Package, action: 'create-product' },
      { name: 'Open Settings', shortcut: 'Ctrl+Shift+S', icon: Settings, href: '/settings' },
    ]
  },
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const allItems = commands.flatMap(cat => cat.items.map(item => ({ ...item, category: cat.category })));
  
  const filteredItems = query 
    ? allItems.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
      )
    : allItems;

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredItems[selectedIndex];
        if (selected) {
          if (selected.href) {
            window.location.href = selected.href;
          } else if (selected.action) {
            console.log('Action:', selected.action);
          }
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, filteredItems, selectedIndex, onClose]);

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50" 
        onClick={onClose} 
      />
      
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl z-50">
        <div className="bg-bg-secondary border border-border rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <Search className="w-5 h-5 text-text-tertiary flex-shrink-0" />
            <input
              type="text"
              placeholder="Search or type a command..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-text-primary placeholder-text-tertiary outline-none text-base"
              autoFocus
            />
            <div className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 text-xs text-text-tertiary bg-bg-tertiary rounded-md border border-border font-mono">Ctrl</kbd>
              <kbd className="px-2 py-1 text-xs text-text-tertiary bg-bg-tertiary rounded-md border border-border font-mono">K</kbd>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto p-2 space-y-1">
            {filteredItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-text-tertiary">No results found</p>
                <p className="text-xs text-text-tertiary mt-1">Try a different search term</p>
              </div>
            ) : (
              filteredItems.map((item, index) => {
                const isSelected = index === selectedIndex;
                return (
                  <button
                    key={`${item.category}-${item.name}`}
                    className={cn(
                      'flex items-center justify-between w-full px-4 py-3 text-sm rounded-xl transition-all duration-150',
                      isSelected
                        ? 'bg-accent text-white shadow-lg shadow-accent/20'
                        : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
                    )}
                    onClick={() => {
                      if (item.href) window.location.href = item.href;
                      else if (item.action) console.log('Action:', item.action);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        isSelected ? 'bg-white/10' : 'bg-bg-tertiary'
                      )}>
                        <item.icon className={cn(
                          'w-4 h-4',
                          isSelected ? 'text-white' : 'text-text-tertiary'
                        )} />
                      </div>
                      <div className="text-left">
                        <p className={isSelected ? 'text-white' : 'text-text-primary'}>
                          {item.name}
                        </p>
                        <p className="text-xs text-text-tertiary">
                          {item.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <kbd className="px-2 py-0.5 text-xs text-text-tertiary bg-bg-tertiary rounded-md border border-border font-mono">
                        {item.shortcut}
                      </kbd>
                      {isSelected && (
                        <ArrowRight className="w-4 h-4 text-white/70" />
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t border-border px-4 py-2.5 flex items-center justify-between">
            <p className="text-xs text-text-tertiary">
              <span className="font-mono bg-bg-tertiary px-1.5 py-0.5 rounded">↑↓</span> navigate
              <span className="font-mono bg-bg-tertiary px-1.5 py-0.5 rounded ml-2">↵</span> select
              <span className="font-mono bg-bg-tertiary px-1.5 py-0.5 rounded ml-2">esc</span> close
            </p>
            <p className="text-xs text-text-tertiary">Zoie v1.0</p>
          </div>
        </div>
      </div>
    </>
  );
}