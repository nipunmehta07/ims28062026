// src/modules/suppliers/components/SuppliersView.tsx
'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSuppliers, addSupplierAction, updateSupplierAction, deleteSupplierAction } from '@/app/actions';
import { Truck, Search, Phone, Mail, Award, CheckCircle, Users, Clock, Plus, Pencil, Trash2, X, Save, MapPin, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

const ratingColors: Record<string, string> = {
  'A+': 'bg-emerald-50 text-emerald-600 border border-emerald-100',
  'A': 'bg-teal-50 text-[#006666] border border-[#006666]/10',
  'B+': 'bg-amber-50 text-amber-600 border border-amber-100',
  'B': 'bg-gray-50 text-gray-500 border border-gray-200',
};

const statusColors: Record<string, string> = {
  'Preferred': 'text-emerald-600 bg-emerald-50 border-emerald-100',
  'Active': 'text-[#006666] bg-teal-50 border-[#006666]/10',
  'Inactive': 'text-gray-400 bg-gray-50 border-gray-200',
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

export default function SuppliersView() {
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

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s: any) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.materials || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [suppliers, search]);

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
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300 font-sans text-gray-800 text-left">
      
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-lg font-black text-gray-800 font-display uppercase tracking-wider">Supplier Directory</h2>
        </div>
        <button 
          onClick={openCreate}
          className="px-4 py-2 bg-[#6a4a63] hover:bg-[#5c3e55] text-white text-xs font-bold uppercase rounded-lg shadow-sm cursor-pointer"
        >
          + Add Supplier
        </button>
      </div>

      {/* KPI Summary Columns (Odoo style) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Total Vendors */}
        <div className="bg-[#f8f9fa] border border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">
            Total Vendors
          </span>
          <span className="text-4xl font-light text-gray-700 mt-2">
            {totalVendors}
          </span>
        </div>

        {/* Preferred Vendors */}
        <div className="bg-[#f8f9fa] border border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">
            Preferred Vendors
          </span>
          <span className="text-4xl font-light text-gray-700 mt-2">
            {preferredCount}
          </span>
        </div>

        {/* Avg Lead Time */}
        <div className="bg-[#f8f9fa] border border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center shadow-sm">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">
            Avg. Lead Time
          </span>
          <span className="text-4xl font-light text-gray-700 mt-2">
            {avgLeadTime} <span className="text-sm font-semibold text-gray-400">days</span>
          </span>
        </div>
      </div>

      {/* Directory content */}
      <div className="space-y-4">
        
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search suppliers by name or materials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#6a4a63] bg-white font-medium"
          />
        </div>

        {/* Suppliers Table */}
        {isLoading ? (
          <div className="p-12 text-center text-gray-400 text-xs">Syncing vendor profiles...</div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 bg-gray-50/30 border border-dashed border-gray-200 rounded-2xl space-y-3">
            <Truck className="w-12 h-12 text-gray-300" strokeWidth={1} />
            <div className="space-y-1 text-center">
              <p className="text-xs font-bold text-gray-700">No suppliers registered yet</p>
              <p className="text-[10px] text-gray-400">Click the button above to add vendor partners.</p>
            </div>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-3">Vendor</th>
                    <th className="p-3">Supplied Materials</th>
                    <th className="p-3">Lead Time</th>
                    <th className="p-3">Rating</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Contact Info</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSuppliers.map((supplier: any) => (
                    <tr key={supplier.id} className="hover:bg-gray-50/50">
                      <td className="p-3 font-bold text-gray-800">
                        <div>
                          {supplier.name}
                          {supplier.contactPerson && (
                            <p className="text-[10px] text-gray-400 font-normal mt-0.5">{supplier.contactPerson}</p>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-gray-600 max-w-xs truncate">{supplier.materials || '—'}</td>
                      <td className="p-3 text-gray-500 font-medium">{supplier.leadTimeDays ? `${supplier.leadTimeDays} days` : '—'}</td>
                      <td className="p-3">
                        <span className={cn(
                          "inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border",
                          ratingColors[supplier.rating] || ratingColors['B']
                        )}>
                          {supplier.rating} Rating
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={cn(
                          "inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded border",
                          statusColors[supplier.status] || statusColors['Active']
                        )}>
                          {supplier.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-y-0.5 text-gray-500 font-medium">
                        {supplier.phone && (
                          <div className="flex items-center justify-end gap-1.5">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{supplier.phone}</span>
                          </div>
                        )}
                        {supplier.email && (
                          <div className="flex items-center justify-end gap-1.5">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <a href={`mailto:${supplier.email}`} className="hover:text-[#6a4a63] transition-colors underline">
                              {supplier.email}
                            </a>
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(supplier)}
                            className="px-2 py-1 border border-gray-200 rounded text-gray-500 hover:bg-gray-50 transition-colors font-bold uppercase text-[9px]"
                            title="Edit"
                          >
                            Edit
                          </button>
                          {deleteConfirm === supplier.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => deleteMutation.mutate(supplier.id)}
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
                              onClick={() => setDeleteConfirm(supplier.id)}
                              className="px-2 py-1 border border-gray-200 rounded text-rose-500 hover:bg-rose-50 transition-colors font-bold uppercase text-[9px]"
                              title="Delete"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* CREATE / EDIT SUPPLIER DRAWER */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeDrawer} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl p-6 overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-sm font-black uppercase text-gray-800 tracking-wider">
                  {editingId ? 'Edit Supplier details' : 'Register New Supplier'}
                </h3>
                <button 
                  onClick={closeDrawer}
                  className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} id="supplierForm" className="space-y-4 text-xs font-medium text-gray-600">
                <div className="space-y-1.5">
                  <label className="font-bold">Supplier Company Name *</label>
                  <input 
                    required 
                    value={form.name} 
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none"
                    placeholder="e.g. Hindware Brass Ltd."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold">Contact Person</label>
                  <input 
                    value={form.contactPerson} 
                    onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none"
                    placeholder="e.g. Vinay Sharma"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold">Phone Number</label>
                    <input 
                      value={form.phone} 
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none font-medium"
                      placeholder="e.g. +91 99999 77777"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold">Email Address</label>
                    <input 
                      type="email" 
                      value={form.email} 
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none font-medium"
                      placeholder="e.g. sales@hindware.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold">Factory Address</label>
                  <textarea 
                    value={form.address} 
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))} 
                    rows={2}
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none font-medium resize-none"
                    placeholder="Physical street address..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold">Supplied Materials</label>
                  <input 
                    value={form.materials} 
                    onChange={e => setForm(f => ({ ...f, materials: e.target.value }))} 
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none"
                    placeholder="e.g. Brass Ingots, Chrome Valves"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold">Lead Time (days)</label>
                    <input 
                      type="number" 
                      min={0} 
                      step={0.5} 
                      value={form.leadTimeDays} 
                      onChange={e => setForm(f => ({ ...f, leadTimeDays: parseFloat(e.target.value) || 0 }))}
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold">Rating</label>
                    <select 
                      value={form.rating} 
                      onChange={e => setForm(f => ({ ...f, rating: e.target.value }))}
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none bg-white font-medium"
                    >
                      <option value="A+">A+ (Premium)</option>
                      <option value="A">A (Reliable)</option>
                      <option value="B+">B+ (Standard)</option>
                      <option value="B">B (Basic)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold">Status</label>
                    <select 
                      value={form.status} 
                      onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                      className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none bg-white font-medium"
                    >
                      <option value="Preferred">Preferred</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold">Internal Notes</label>
                  <textarea 
                    value={form.notes} 
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} 
                    rows={2} 
                    className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none font-medium resize-none"
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
                form="supplierForm"
                disabled={isSaving}
                className="px-5 py-2 bg-[#6a4a63] hover:bg-[#5c3e55] text-white text-xs font-bold uppercase rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : editingId ? 'Update Supplier' : 'Register Supplier'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
