'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSalesOrders } from '@/app/actions';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Users, Search, ShoppingBag, Landmark, Clock, UserCircle, IndianRupee, TrendingUp } from 'lucide-react';

interface CustomerSummary {
  name: string;
  totalOrders: number;
  totalSpend: number;
  lastOrderDate: string;
  activeOrders: number;
}

const avatarColors = [
  'bg-accent/15 text-accent',
  'bg-success/15 text-success',
  'bg-info/15 text-info',
  'bg-warning/15 text-warning',
  'bg-error/15 text-error',
];

export default function CustomersPage() {
  const [search, setSearch] = useState('');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['salesOrders'],
    queryFn: () => getSalesOrders()
  });

  // Calculate customer profiles based on sales orders database
  const customerMap = orders.reduce((acc: any, order: any) => {
    const name = order.customerName || 'Walk-in Customer';
    if (!acc[name]) {
      acc[name] = {
        name,
        totalOrders: 0,
        totalSpend: 0,
        lastOrderDate: order.orderDate,
        activeOrders: 0
      };
    }

    const profile = acc[name];
    profile.totalOrders += 1;
    profile.totalSpend += order.totalAmount || 0;
    
    // Track most recent date
    if (new Date(order.orderDate) > new Date(profile.lastOrderDate)) {
      profile.lastOrderDate = order.orderDate;
    }

    if (order.status === 'PENDING') {
      profile.activeOrders += 1;
    }

    return acc;
  }, {});

  const customerList: CustomerSummary[] = Object.values(customerMap);

  const filteredCustomers = customerList.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  // KPI calculations
  const totalCustomers = customerList.length;
  const totalCustomerRevenue = useMemo(() => customerList.reduce((s, c) => s + c.totalSpend, 0), [customerList]);
  const avgOrderValue = useMemo(() => {
    const totalOrders = customerList.reduce((s, c) => s + c.totalOrders, 0);
    return totalOrders > 0 ? totalCustomerRevenue / totalOrders : 0;
  }, [customerList, totalCustomerRevenue]);

  return (
    <div className="space-y-6 max-w-6xl animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="glass-card bg-mesh-gradient rounded-2xl p-6 relative overflow-hidden transition-all duration-300">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-text-primary tracking-tight">Customer Database</h1>
            <p className="text-sm text-text-secondary">Review dynamic customer metrics, order histories, and purchase values grouped live from Sales Orders.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full">
            <Users className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-semibold text-accent tracking-wide uppercase">Partners</span>
          </div>
        </div>
      </div>

      {/* KPI Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card glow-card rounded-2xl p-5 relative overflow-hidden stagger-enter">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-50" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Total Customers</span>
            <div className="w-7 h-7 bg-accent/10 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-accent" />
            </div>
          </div>
          <p className="text-2xl font-black text-text-primary mt-3 stat-number relative z-10">{totalCustomers}</p>
          <span className="text-xs text-text-tertiary relative z-10">Unique buyers on record</span>
        </div>
        <div className="glass-card glow-card rounded-2xl p-5 relative overflow-hidden stagger-enter">
          <div className="absolute inset-0 bg-gradient-to-br from-success/5 via-transparent to-transparent opacity-50" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Customer Revenue</span>
            <div className="w-7 h-7 bg-success/10 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-4 h-4 text-success" />
            </div>
          </div>
          <p className="text-2xl font-black text-text-primary mt-3 stat-number relative z-10">₹{totalCustomerRevenue.toLocaleString('en-IN')}</p>
          <span className="text-xs text-text-tertiary relative z-10">Total lifetime billing</span>
        </div>
        <div className="glass-card glow-card rounded-2xl p-5 relative overflow-hidden stagger-enter">
          <div className="absolute inset-0 bg-gradient-to-br from-info/5 via-transparent to-transparent opacity-50" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Avg. Order Value</span>
            <div className="w-7 h-7 bg-info/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-info" />
            </div>
          </div>
          <p className="text-2xl font-black text-text-primary mt-3 stat-number relative z-10">₹{Math.round(avgOrderValue).toLocaleString('en-IN')}</p>
          <span className="text-xs text-text-tertiary relative z-10">Per transaction average</span>
        </div>
      </div>

      {/* Main Grid Card */}
      <Card className="glass-card rounded-2xl p-5">
        {/* Search */}
        <div className="relative mb-5 max-w-md">
          <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm pl-9 pr-4 py-2.5 rounded-xl border border-border bg-bg-tertiary text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none outline-transparent transition-all"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-14 w-full rounded-xl" />)}
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center border border-dashed border-border rounded-xl bg-bg-tertiary/30">
            <div className="w-14 h-14 bg-bg-tertiary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <UserCircle className="w-7 h-7 text-text-tertiary" />
            </div>
            <p className="text-sm font-semibold text-text-primary mb-1">No customers found</p>
            <p className="text-xs text-text-tertiary max-w-xs mx-auto">Customer profiles are generated automatically when sales orders are created.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow hover={false} className="border-b border-border bg-bg-tertiary/40">
                  <TableHead className="text-xs font-bold text-text-secondary">Customer Name</TableHead>
                  <TableHead className="text-xs font-bold text-text-secondary text-right">Orders Count</TableHead>
                  <TableHead className="text-xs font-bold text-text-secondary text-right">Total Billing</TableHead>
                  <TableHead className="text-xs font-bold text-text-secondary text-right">Active Pending</TableHead>
                  <TableHead className="text-xs font-bold text-text-secondary">Last Active Order</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer, index) => (
                  <TableRow key={customer.name} className="border-b border-border hover:bg-bg-hover/30 transition-colors row-enter" style={{ animationDelay: `${index * 30}ms` }}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${avatarColors[index % avatarColors.length]}`}>
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-text-primary">{customer.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-bold text-text-primary text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-text-tertiary" />
                        {customer.totalOrders}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-bold text-text-primary text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Landmark className="w-3.5 h-3.5 text-success" />
                        ₹{customer.totalSpend.toLocaleString('en-IN')}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-bold text-right">
                      {customer.activeOrders > 0 ? (
                        <span className="text-accent bg-accent/10 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                          {customer.activeOrders} pending
                        </span>
                      ) : (
                        <span className="text-text-tertiary text-xs">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-text-secondary">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-text-tertiary" />
                        {new Date(customer.lastOrderDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
