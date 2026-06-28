// src/app/page.tsx
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          <p className="text-text-secondary">Welcome back, John! Here's what's happening.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm text-white bg-accent rounded-lg hover:bg-accent-hover transition-colors">
            New Order
          </button>
          <button className="p-2 text-text-secondary hover:text-white hover:bg-hover rounded-lg transition-colors">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Revenue" 
          value="₹48,291" 
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
          value="₹129,842" 
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
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-medium text-white">Revenue Overview</h3>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 text-sm text-text-secondary hover:text-white hover:bg-hover rounded-lg transition-colors">7D</button>
                <button className="px-3 py-1 text-sm text-white bg-accent rounded-lg">30D</button>
                <button className="px-3 py-1 text-sm text-text-secondary hover:text-white hover:bg-hover rounded-lg transition-colors">90D</button>
              </div>
            </div>
            {/* Chart placeholder - Replace with Recharts */}
            <div className="h-64 flex items-center justify-center bg-background-tertiary rounded-lg">
              <span className="text-text-tertiary">Revenue chart coming soon</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium text-white mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {[1,2,3,4].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-background-tertiary rounded-lg flex items-center justify-center">
                    <Package className="w-4 h-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">Order #{1234 + i} created</p>
                    <p className="text-xs text-text-tertiary">{i} hours ago</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
  const color = variant === 'warning' ? 'text-warning' : isUp ? 'text-success' : 'text-error';
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-text-secondary">{title}</span>
          <Icon className="w-5 h-5 text-text-tertiary" />
        </div>
        <div className="flex items-end justify-between">
          <span className="text-2xl font-semibold text-white">{value}</span>
          <span className={`flex items-center gap-1 text-sm ${color}`}>
            {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {change}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}