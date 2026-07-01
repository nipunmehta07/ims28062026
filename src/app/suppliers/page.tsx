'use client';

import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Truck, Search, Phone, Mail, Award, CheckCircle, Users, Clock, Plus, Pencil, Trash2, X, Save, MapPin } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSuppliers, addSupplierAction, updateSupplierAction, deleteSupplierAction } from '@/app/actions';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

const ratingColors: Record<string, string> = {
  'A+': 'bg-success/15 text-success border-success/20',
  'A': 'bg-info/15 text-info border-info/20',
  'B+': 'bg-warning/15 text-warning border-warning/20',
  'B': 'bg-text-tertiary/15 text-text-tertiary border-border',
};

const statusColors: Record<string, string> = {
  'Preferred': 'text-success bg-success/10 border-success/20',
  'Active': 'text-info bg-info/10 border-info/20',
  'Inactive': 'text-text-tertiary bg-bg-tertiary border-border',
};

const emptySupplier = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  materials: '',
  leadTimeDays: 0,
  rating: 'B' as string,
  status: 'Active' as string,
  notes: '',
};

export default function SuppliersPage() {
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptySupplier);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  
  const queryClient = useQueryClient();

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => getSuppliers()
  });

  const addMutation = useMutation({
    mutationFn: addSupplierAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Supplier registered successfully');
      closeDrawer();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to add supplier')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof emptySupplier }) => updateSupplierAction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Supplier updated');
      closeDrawer();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to update')
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSupplierAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Supplier removed');
      setDeleteConfirm(null);
    },
    onError: (err: any) => toast.error(err.message || 'Failed to delete')
  });

  const filteredSuppliers = suppliers.filter((s: any) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.materials || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalVendors = suppliers.length;
  const preferredCount = suppliers.filter((s: any) => s.status === 'Preferred').length;
  const avgLeadTime = useMemo(() => {
    if (suppliers.length === 0) return '0.0';
    const total = suppliers.reduce((s: number, v: any) => s + (v.leadTimeDays || 0), 0);
    return (total / suppliers.length).toFixed(1);
  }, [suppliers]);

  function openCreate() {
    setForm(emptySupplier);
    setEditingId(null);
    setDrawerOpen(true);
  }

  function openEdit(supplier: any) {
    setForm({
      name: supplier.name || '',
      contactPerson: supplier.contactPerson || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      materials: supplier.materials || '',
      leadTimeDays: supplier.leadTimeDays || 0,
      rating: supplier.rating || 'B',
      status: supplier.status || 'Active',
      notes: supplier.notes || '',
    });
    setEditingId(supplier.id);
    setDrawerOpen(true);
  }

  function closeDrawer() {
    setDrawerOpen(false);
    setEditingId(null);
    setForm(emptySupplier);
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
            <h1 className="text-xl font-bold text-text-primary tracking-tight">Supplier Directory</h1>
            <p className="text-sm text-text-secondary">Manage component procurement sources, lead times, and materials vendors.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 hover:shadow-accent/30"
            >
              <Plus className="w-4 h-4" />
              Add Supplier
            </button>
            <div className="flex items-center gap-2 px-3 py-1 bg-info/10 border border-info/20 rounded-full">
              <Truck className="w-3.5 h-3.5 text-info" />
              <span className="text-xs font-semibold text-info tracking-wide uppercase">Suppliers</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card glow-card rounded-2xl p-5 relative overflow-hidden stagger-enter">
          <div className="absolute inset-0 bg-gradient-to-br from-info/5 via-transparent to-transparent opacity-50" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Total Vendors</span>
            <div className="w-7 h-7 bg-info/10 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-info" />
            </div>
          </div>
          <p className="text-2xl font-black text-text-primary mt-3 stat-number relative z-10">{totalVendors}</p>
          <span className="text-xs text-text-tertiary relative z-10">Registered supply partners</span>
        </div>
        <div className="glass-card glow-card rounded-2xl p-5 relative overflow-hidden stagger-enter">
          <div className="absolute inset-0 bg-gradient-to-br from-success/5 via-transparent to-transparent opacity-50" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Preferred Vendors</span>
            <div className="w-7 h-7 bg-success/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-success" />
            </div>
          </div>
          <p className="text-2xl font-black text-text-primary mt-3 stat-number relative z-10">{preferredCount}</p>
          <span className="text-xs text-text-tertiary relative z-10">Top-tier quality partners</span>
        </div>
        <div className="glass-card glow-card rounded-2xl p-5 relative overflow-hidden stagger-enter">
          <div className="absolute inset-0 bg-gradient-to-br from-warning/5 via-transparent to-transparent opacity-50" />
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Avg. Lead Time</span>
            <div className="w-7 h-7 bg-warning/10 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-warning" />
            </div>
          </div>
          <p className="text-2xl font-black text-text-primary mt-3 stat-number relative z-10">{avgLeadTime} <span className="text-sm font-semibold text-text-secondary">days</span></p>
          <span className="text-xs text-text-tertiary relative z-10">Weighted average delivery</span>
        </div>
      </div>

      {/* Main Table */}
      <Card className="glass-card rounded-2xl p-5">
        {/* Search */}
        <div className="relative mb-5 max-w-md">
          <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Search suppliers or materials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm pl-9 pr-4 py-2.5 rounded-xl border border-border bg-bg-tertiary text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none outline-transparent transition-all"
          />
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-text-tertiary text-sm">Loading suppliers...</div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="py-16 text-center">
            <Truck className="w-10 h-10 text-text-tertiary mx-auto mb-3 opacity-40" />
            <p className="text-sm text-text-secondary font-medium">No suppliers found</p>
            <p className="text-xs text-text-tertiary mt-1">Add your first vendor to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow hover={false} className="border-b border-border bg-bg-tertiary/40">
                  <TableHead className="text-xs font-bold text-text-secondary">Vendor</TableHead>
                  <TableHead className="text-xs font-bold text-text-secondary">Supplied Materials</TableHead>
                  <TableHead className="text-xs font-bold text-text-secondary">Lead Time</TableHead>
                  <TableHead className="text-xs font-bold text-text-secondary">Rating</TableHead>
                  <TableHead className="text-xs font-bold text-text-secondary">Status</TableHead>
                  <TableHead className="text-xs font-bold text-text-secondary text-right">Contact Info</TableHead>
                  <TableHead className="text-xs font-bold text-text-secondary text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier: any, index: number) => (
                  <TableRow key={supplier.id} className="border-b border-border hover:bg-bg-hover/30 transition-colors row-enter" style={{ animationDelay: `${index * 40}ms` }}>
                    <TableCell className="text-sm font-semibold text-text-primary">
                      <div>
                        {supplier.name}
                        {supplier.contactPerson && (
                          <p className="text-xs text-text-tertiary font-normal mt-0.5">{supplier.contactPerson}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-text-primary max-w-[200px]">
                      {supplier.materials || '—'}
                    </TableCell>
                    <TableCell className="text-xs text-text-secondary font-medium">
                      {supplier.leadTimeDays ? `${supplier.leadTimeDays} days` : '—'}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${ratingColors[supplier.rating] || ratingColors['B']}`}>
                        <Award className="w-3 h-3" />
                        {supplier.rating}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        'px-2.5 py-0.5 rounded-full font-bold text-xs flex items-center gap-1 w-fit border',
                        statusColors[supplier.status] || statusColors['Active']
                      )}>
                        {supplier.status === 'Preferred' && <CheckCircle className="w-3 h-3" />}
                        {supplier.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-text-secondary text-right space-y-1">
                      {supplier.phone && (
                        <div className="flex items-center justify-end gap-1.5">
                          <Phone className="w-3 h-3 text-text-tertiary" />
                          <span>{supplier.phone}</span>
                        </div>
                      )}
                      {supplier.email && (
                        <div className="flex items-center justify-end gap-1.5">
                          <Mail className="w-3 h-3 text-text-tertiary" />
                          <a href={`mailto:${supplier.email}`} className="hover:text-accent transition-colors underline underline-offset-2 decoration-border hover:decoration-accent">
                            {supplier.email}
                          </a>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(supplier)}
                          className="p-1.5 text-text-tertiary hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {deleteConfirm === supplier.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => deleteMutation.mutate(supplier.id)}
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
                            onClick={() => setDeleteConfirm(supplier.id)}
                            className="p-1.5 text-text-tertiary hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
                  {editingId ? 'Edit Supplier' : 'Register New Supplier'}
                </h2>
                <button type="button" onClick={closeDrawer} className="p-2 text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">Supplier Name *</label>
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

              {/* Materials */}
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">Supplied Materials</label>
                <input value={form.materials} onChange={e => setForm(f => ({ ...f, materials: e.target.value }))} placeholder="e.g., Brass Ingots, Chrome Plating"
                  className="w-full text-sm px-3 py-2.5 rounded-xl border border-border bg-bg-tertiary text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none outline-transparent transition-all" />
              </div>

              {/* Lead Time, Rating, Status */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">Lead Time (days)</label>
                  <input type="number" min={0} step={0.5} value={form.leadTimeDays} onChange={e => setForm(f => ({ ...f, leadTimeDays: parseFloat(e.target.value) || 0 }))}
                    className="w-full text-sm px-3 py-2.5 rounded-xl border border-border bg-bg-tertiary text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none outline-transparent transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">Rating</label>
                  <select value={form.rating} onChange={e => setForm(f => ({ ...f, rating: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-xl border border-border bg-bg-tertiary text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none outline-transparent transition-all">
                    <option value="A+">A+ (Premium)</option>
                    <option value="A">A (Reliable)</option>
                    <option value="B+">B+ (Standard)</option>
                    <option value="B">B (Basic)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full text-sm px-3 py-2.5 rounded-xl border border-border bg-bg-tertiary text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none outline-transparent transition-all">
                    <option value="Preferred">Preferred</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5 block">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                  className="w-full text-sm px-3 py-2.5 rounded-xl border border-border bg-bg-tertiary text-text-primary focus:border-accent focus:ring-2 focus:ring-accent/10 outline-none outline-transparent transition-all resize-none" />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent text-white rounded-xl text-sm font-bold hover:bg-accent/90 transition-all shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : editingId ? 'Update Supplier' : 'Register Supplier'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}