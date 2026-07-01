// src/modules/customers/components/CustomersView.tsx
'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCustomers, addCustomerAction, updateCustomerAction, deleteCustomerAction } from '@/app/actions';
import { Users, Search, ShoppingBag, Clock, UserCircle, IndianRupee, TrendingUp, Plus, Pencil, Trash2, X, Save, Phone, Mail, MapPin, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

const avatarColors = [
  'bg-teal-50 text-[#006666] border border-[#006666]/10',
  'bg-purple-50 text-[#6a4a63] border border-[#6a4a63]/10',
  'bg-rose-50 text-rose-600 border border-rose-100',
  'bg-amber-50 text-amber-600 border border-amber-100',
  'bg-emerald-50 text-emerald-600 border border-emerald-100',
];

const emptyCustomer = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
};

export default function CustomersView() {
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

  const filtered = useMemo(() => {
    return enrichedCustomers.filter((c: any) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.contactPerson || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [enrichedCustomers, search]);

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
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300 font-sans text-gray-800 text-left">
      
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-lg font-black text-gray-800 font-display uppercase tracking-wider">Customer Directory</h2>
        </div>
        <button 
          onClick={openCreate}
          className="px-4 py-2 bg-[#6a4a63] hover:bg-[#5c3e55] text-white text-xs font-bold uppercase rounded-lg shadow-sm cursor-pointer"
        >
          + Add Customer
        </button>
      </div>

      {/* KPI Summary Rows (Odoo style) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Total Customers */}
        <div className="bg-[#f8f9fa] border border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">
            Total Customers
          </span>
          <span className="text-4xl font-light text-gray-700 mt-2">
            {totalCustomers}
          </span>
        </div>

        {/* Lifetime Revenue */}
        <div className="bg-[#f8f9fa] border border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">
            Lifetime Revenue
          </span>
          <span className="text-4xl font-light text-gray-700 mt-2">
            ₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </span>
        </div>

        {/* Active Buyers */}
        <div className="bg-[#f8f9fa] border border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">
            Active Buyers (With orders)
          </span>
          <span className="text-4xl font-light text-gray-700 mt-2">
            {activeCount}
          </span>
        </div>
      </div>

      {/* Main Directory panel */}
      <div className="space-y-4">
        
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search customers by name or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#6a4a63] bg-white font-medium"
          />
        </div>

        {/* Customers Table */}
        {isLoading ? (
          <div className="p-12 text-center text-gray-400 text-xs">Syncing customer records...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-gray-50/30 border border-dashed border-gray-200 rounded-2xl space-y-3">
            <UserCircle className="w-12 h-12 text-gray-300" strokeWidth={1} />
            <div className="space-y-1 text-center">
              <p className="text-xs font-bold text-gray-700">No customers registered yet</p>
              <p className="text-[10px] text-gray-400">Click the button above to add buyer profiles.</p>
            </div>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3">Customer</th>
                    <th className="p-3">Contact</th>
                    <th className="p-3 text-center">Orders Count</th>
                    <th className="p-3 text-right">Total spend</th>
                    <th className="p-3 text-center">Pending orders</th>
                    <th className="p-3">Last Order Date</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((customer: any) => {
                    const initials = customer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
                    return (
                      <tr key={customer.id} className="hover:bg-gray-50/50">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold', customer.colorClass)}>
                              {initials}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-gray-800">{customer.name}</p>
                              {customer.contactPerson && (
                                <p className="text-[10px] text-gray-400 font-medium">{customer.contactPerson}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3 space-y-0.5 text-gray-500 font-medium">
                          {customer.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span>{customer.phone}</span>
                            </div>
                          )}
                          {customer.email && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-gray-400" />
                              <a href={`mailto:${customer.email}`} className="hover:text-[#6a4a63] transition-colors underline">
                                {customer.email}
                              </a>
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-center font-bold text-gray-700">{customer.totalOrders}</td>
                        <td className="p-3 text-right font-bold text-gray-700">
                          ₹{customer.totalSpend.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </td>
                        <td className="p-3 text-center">
                          {customer.activeOrders > 0 ? (
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-amber-50 text-amber-600 border border-amber-100">
                              {customer.activeOrders} Orders
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="p-3 text-gray-500 font-medium">{customer.lastOrderDate}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEdit(customer)}
                              className="px-2 py-1 border border-gray-200 rounded text-gray-500 hover:bg-gray-50 transition-colors font-bold uppercase text-[9px]"
                              title="Edit"
                            >
                              Edit
                            </button>
                            {deleteConfirm === customer.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => deleteMutation.mutate(customer.id)}
                                  className="px-2 py-1 text-[9px] font-bold text-white bg-rose-500 rounded hover:bg-rose-600 transition-colors uppercase"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="p-1 hover:bg-gray-50 text-gray-400 hover:text-gray-700 rounded transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirm(customer.id)}
                                className="px-2 py-1 border border-gray-200 rounded text-rose-500 hover:bg-rose-50 transition-colors font-bold uppercase text-[9px]"
                                title="Delete"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* CREATE / EDIT CUSTOMER DRAWER */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeDrawer} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl p-6 overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-sm font-black uppercase text-gray-800 tracking-wider">
                  {editingId ? 'Edit Customer profile' : 'Register New Customer'}
                </h3>
                <button 
                  onClick={closeDrawer}
                  className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} id="customerForm" className="space-y-4 text-xs font-medium text-gray-600">
                <div className="space-y-1.5">
                  <label className="font-bold">Customer Name *</label>
                  <input 
                    required 
                    value={form.name} 
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none"
                    placeholder="e.g. Acme Corporation"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold">Contact Representative</label>
                  <input 
                    value={form.contactPerson} 
                    onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none"
                    placeholder="e.g. John Miller"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold">Phone Number</label>
                    <input 
                      value={form.phone} 
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none font-medium"
                      placeholder="e.g. +91 99999 88888"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold">Email Address</label>
                    <input 
                      type="email" 
                      value={form.email} 
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none font-medium"
                      placeholder="e.g. billing@acme.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold">Billing Address</label>
                  <textarea 
                    value={form.address} 
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))} 
                    rows={2}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none font-medium resize-none"
                    placeholder="Physical street address..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold">Internal Notes</label>
                  <textarea 
                    value={form.notes} 
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} 
                    rows={3} 
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none font-medium resize-none"
                    placeholder="Specific delivery routing, custom credit values..."
                  />
                </div>
              </form>
            </div>

            <div className="border-t border-gray-100 pt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeDrawer}
                className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="customerForm"
                disabled={isSaving}
                className="px-5 py-2 bg-[#6a4a63] hover:bg-[#5c3e55] text-white text-xs font-bold uppercase rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : editingId ? 'Update Buyer' : 'Register Buyer'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
