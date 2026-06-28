// app/page.tsx (Dashboard)
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal
} from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          <p className="text-[#a0a0b8]">Welcome back, John! Here's what's happening.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm text-white bg-[#6366f1] rounded-lg hover:bg-[#818cf8] transition-colors">
            New Order
          </button>
          <button className="p-2 text-[#a0a0b8] hover:text-white hover:bg-[#1e1e2e] rounded-lg transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Revenue" 
          value="$48,291" 
          change="+12.5%" 
          trend="up"
          icon={TrendingUp}
        />
        <KpiCard 
          title="Orders" 
          value="342" 
          change="+8.2%" 
          trend="up"
          icon={ShoppingCart}
        />
        <KpiCard 
          title="Inventory Value" 
          value="$129,842" 
          change="-2.4%" 
          trend="down"
          icon={Package}
        />
        <KpiCard 
          title="Low Stock Alerts" 
          value="7" 
          change="+3" 
          trend="up"
          icon={AlertTriangle}
          variant="warning"
        />
      </div>

      {/* Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-[#14141e] border border-[#2a2a3e] rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-medium text-white">Revenue Overview</h3>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 text-sm text-[#a0a0b8] hover:text-white hover:bg-[#1e1e2e] rounded-lg transition-colors">7D</button>
              <button className="px-3 py-1 text-sm text-white bg-[#6366f1] rounded-lg">30D</button>
              <button className="px-3 py-1 text-sm text-[#a0a0b8] hover:text-white hover:bg-[#1e1e2e] rounded-lg transition-colors">90D</button>
            </div>
          </div>
          {/* Chart placeholder - use Recharts here */}
          <div className="h-64 flex items-center justify-center bg-[#1e1e2e] rounded-lg">
            <span className="text-[#6e6e8a]">Chart component here</span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#14141e] border border-[#2a2a3e] rounded-xl p-6">
          <h3 className="font-medium text-white mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[1,2,3,4].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#1e1e2e] rounded-lg flex items-center justify-center">
                  <Package className="w-4 h-4 text-[#6366f1]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">Order #1234 created</p>
                  <p className="text-xs text-[#6e6e8a]">2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// KPI Card Component
function KpiCard({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon, 
  variant 
}: { 
  title: string; 
  value: string; 
  change: string; 
  trend: 'up' | 'down'; 
  icon: any; 
  variant?: 'default' | 'warning' 
}) {
  const isUp = trend === 'up';
  const color = variant === 'warning' ? 'text-[#fbbf24]' : isUp ? 'text-[#34d399]' : 'text-[#f87171]';
  
  return (
    <div className="bg-[#14141e] border border-[#2a2a3e] rounded-xl p-6 hover:border-[#3a3a52] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-[#a0a0b8]">{title}</span>
        <Icon className="w-5 h-5 text-[#6e6e8a]" />
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-semibold text-white">{value}</span>
        <span className={`flex items-center gap-1 text-sm ${color}`}>
          {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {change}
        </span>
      </div>
    </div>
  );
}