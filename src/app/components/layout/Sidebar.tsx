// components/layout/Sidebar.tsx
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  ClipboardList, 
  ShoppingCart,
  Users,
  Truck,
  Factory,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  Plus,
  Star,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
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

const favorites = [
  { name: 'Recent Orders', href: '/orders?filter=recent', icon: Clock },
  { name: 'Low Stock', href: '/inventory?filter=low-stock', icon: Package },
];

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();

  return (
    <aside className={cn(
      "relative flex flex-col bg-[#14141e] border-r border-[#2a2a3e] transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-[#2a2a3e]">
        {!collapsed ? (
          <span className="text-xl font-semibold text-white">Zoie</span>
        ) : (
          <span className="text-xl font-semibold text-white">Z</span>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 p-3">
        <button className="flex-1 flex items-center gap-2 px-3 py-2 text-sm text-[#a0a0b8] bg-[#1e1e2e] rounded-lg hover:bg-[#2a2a3e] transition-colors">
          <Search className="w-4 h-4" />
          {!collapsed && "Search..."}
          {!collapsed && <kbd className="ml-auto text-xs text-[#6e6e8a]">⌘K</kbd>}
        </button>
        <button className="p-2 text-[#a0a0b8] hover:text-white hover:bg-[#2a2a3e] rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all",
                isActive 
                  ? "bg-[#6366f1] text-white" 
                  : "text-[#a0a0b8] hover:text-white hover:bg-[#1e1e2e]"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Favorites Section */}
      {!collapsed && (
        <div className="border-t border-[#2a2a3e] p-3">
          <p className="text-xs font-medium text-[#6e6e8a] uppercase tracking-wider mb-2">Favorites</p>
          <div className="space-y-1">
            {favorites.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-sm text-[#a0a0b8] rounded-lg hover:text-white hover:bg-[#1e1e2e] transition-colors"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-1/2 -translate-y-1/2 p-1 bg-[#1e1e2e] border border-[#2a2a3e] rounded-full hover:bg-[#2a2a3e] transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}