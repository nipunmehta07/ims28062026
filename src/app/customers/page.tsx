'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCustomers, addCustomerAction, updateCustomerAction, deleteCustomerAction } from '@/app/actions';
import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Users, Search, ShoppingBag, Clock, UserCircle, IndianRupee, TrendingUp, Plus, Pencil, Trash2, X, Save, Phone, Mail, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

const avatarColors = [
  'bg-accent/15 text-accent',
  'bg-success/15 text-success',
  'bg-info/15 text-info',
  'bg-warning/15 text-warning',
  'bg-error/15 text-error',
];

const emptyCustomer = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
};

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyCustomer);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => getCustomers()
  });

  const addMutation = useMutation({
    mutationFn: addCustomerAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer registered successfully');
      closeDrawer();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to add customer')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof emptyCustomer }) => updateCustomerAction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer updated');
      closeDrawer();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update')
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCustomerAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer removed');
      setDeleteConfirm(null);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete')
  });

  // Compute customer stats from linked orders
  const enrichedCustomers = useMemo(() => {
    return customers.map((customer: any, index: number) => {
      const orders = customer.salesOrders || [];
      const totalOrders = orders.length;
      const totalSpend = orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
      const activeOrders = orders.filter((o: any) => o.status === 'PENDING').length;
      const lastOrderDate = orders.length > 0
        ? new Date(Math.max(...orders.map((o: any) => new Date(o.orderDate).getTime()))).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';

      return {
        ...customer,
        totalOrders,
        totalSpend,
        activeOrders,
        lastOrderDate,
        colorClass: avatarColors[index % avatarColors.length],
      };
    });
  }, [customers]);

  const filtered = enrichedCustomers.filter((c: any) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.contactPerson || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  // KPI totals
  const totalCustomers = enrichedCustomers.length;
  const totalRevenue = enrichedCustomers.reduce((s: number, c: any) => s + c.totalSpend, 0);
  const activeCount = enrichedCustomers.filter((c: any) => c.activeOrders > 0).length;

  function openCreate() {
    setForm(emptyCustomer);
    setEditingId(null);
    setDrawerOpen(true);
  }

  function openEdit(customer: any) {
    setForm({
      name: customer.name || '',
      contactPerson: customer.contactPerson || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      notes: customer.notes || '',
    });
    setEditingId(customer.id);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingId(null);
    setForm(emptyCustomer);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      addMutation.mutate(form);
    }
  }

  const isSaving = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6 max-w-6xl animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="glass-card bg-mesh-gradient rounded-2xl p-6 relative overflow-hidden transition-all duration-300">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-text-primary tracking-tight">Customer Directory</h1>
            <p className="text-sm text-text-secondary">Manage buyer profiles, track spending history, and maintain contact records.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 hover:shadow-accent/30"
            >
              <Plus className="w-4 h-4" />
              Add Customer
            </button>
            <div className="flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full">
              <Users className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-semibold text-accent tracking-wide uppercase">Customers</span>
            </div>
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
          <span className="text-xs text-text-tertiary relative z-10">Registered buyers</span>
        </div>
        <div className="glass-card glow-card rounded-2xl p-5 relative overflow-hidden stagger-enter">
          <div className="absolute inset-0 bg-gradient-to-br from-success/5 via-transparent to-transparent opacity-50" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Lifetime Revenue</span>
            <div className="w-7 h-7 bg-success/10 rounded-lg flex items-center justify-center">
              <IndianRupee className="w-4 h-4 text-success" />
            </div>
          </div>
          <p className="text-2xl font-black text-text-primary mt-3 stat-number relative z-10">
            ₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </p>
          <span className="text-xs text-text-tertiary relative z-10">From all linked orders</span>
        </div>
        <div className="glass-card glow-card rounded-2xl p-5 relative overflow-hidden stagger-enter">
          <div className="absolute inset-0 bg-gradient-to-br from-warning/5 via-transparent to-transparent opacity-50" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Active Buyers</span>
            <div className="w-7 h-7 bg-warning/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-warning" />
            </div>
          </div>
          <p className="text-2xl font-black text-text-primary mt-3 stat-number relative z-10">{activeCount}</p>
          <span className="text-xs text-text-tertiary relative z-10">With pending orders</span>
        </div>
      </div>

      {/* Main Table */}
      <Card className="glass-card rounded-2xl p-5">
        <div className="relative mb-5 max-w-md">
          <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Search customers by name, contact, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm pl-9 pr-4 py-2.5 rounded-xl border border-border bg-bg-tertiary text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none outline-transparent transition-all"
          />
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-text-tertiary text-sm">Loading customers...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <UserCircle className="w-10 h-10 text-text-tertiary mx-auto mb-3 opacity-40" />
            <p className="text-sm text-text-secondary font-medium">No customers found</p>
            <p className="text-xs text-text-tertiary mt-1">Register your first customer to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow hover={false} className="border-b border-border bg-bg-tertiary/40">
                  <TableHead className="text-xs font-bold text-text-secondary">Customer</TableHead>
                  <TableHead className="text-xs font-bold text-text-secondary">Contact</TableHead>
                  <TableHead className="text-xs font-bold text-text-secondary text-center">Orders</TableHead>
                  <TableHead className="text-xs font-bold text-text-secondary text-right">Total Spend</TableHead>
                  <TableHead className="text-xs font-bold text-text-secondary text-center">Active</TableHead>
                  <TableHead className="text-xs font-bold text-text-secondary">Last Order</TableHead>
                  <TableHead className="text-xs font-bold text-text-secondary text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((customer: any, index: number) => {
                  const initials = customer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                  return (
                    <TableRow key={customer.id} className="border-b border-border hover:bg-bg-hover/30 transition-colors row-enter" style={{ animationDelay: `${index * 40}ms` }}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold', customer.colorClass)}>
                            {initials}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-text-primary">{customer.name}</p>
                            {customer.contactPerson && (
                              <p className="text-xs text-text-tertiary">{customer.contactPerson}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-text-secondary space-y-0.5">
                        {customer.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-text-tertiary" />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                        {customer.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-text-tertiary" />
                            <a href={`mailto:${customer.email}`} className="hover:text-accent transition-colors underline underline-offset-2 decoration-border hover:decoration-accent">
                              {customer.email}
                            </a>
                          </div>
                        )}
                        {!customer.phone && !customer.email && <span className="text-text-tertiary">—</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-bold text-text-primary">{customer.totalOrders}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold text-text-primary">
                          ₹{customer.totalSpend.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {customer.activeOrders > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-warning bg-warning/10 px-2 py-0.5 rounded-full border border-warning/20">
                            <ShoppingBag className="w-3 h-3" />
                            {customer.activeOrders}
                          </span>
                        ) : (
                          <span className="text-xs text-text-tertiary">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-text-secondary font-medium">
                        {customer.lastOrderDate}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(customer)}
                            className="p-1.5 text-text-tertiary hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {deleteConfirm === customer.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => deleteMutation.mutate(customer.id)}
                                className="px-2 py-1 text-[10px] font-bold text-white bg-error rounded-lg hover:bg-error/90 transition-colors"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="p-1.5 text-text-tertiary hover:text-text-primary rounded-lg transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(customer.id)}
                              className="p-1.5 text-text-tertiary hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Drawer / Slide Panel */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={closeDrawer} />
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-bg-primary border-l border-border z-50 shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-text-primary">
                  {editingId ? 'Edit Customer' : 'Register New Customer'}
                </h2>
                <button type="button" onClick={closeDrawer} className="p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">Customer Name *</label>
                <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full text-sm px-3 py-2.5 rounded-xl border border-border bg-bg-tertiary text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none outline-transparent transition-all" />
              </div>

              {/* Contact Person */}
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">Contact Person</label>
                <input value={form.contactPerson} onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))}
                  className="w-full text-sm px-3 py-2.5 rounded-xl border border-border bg-bg-tertiary text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none outline-transparent transition-all" />
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">Phone</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-xl border border-border bg-bg-tertiary text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none outline-transparent transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-xl border border-border bg-bg-tertiary text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none outline-transparent transition-all" />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">Address</label>
                <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} rows={2}
                  className="w-full text-sm px-3 py-2.5 rounded-xl border border-border bg-bg-tertiary text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none outline-transparent transition-all resize-none" />
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Internal notes about this customer..."
                  className="w-full text-sm px-3 py-2.5 rounded-xl border border-border bg-bg-tertiary text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none outline-transparent transition-all resize-none" />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent text-white rounded-xl text-sm font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : editingId ? 'Update Customer' : 'Register Customer'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
