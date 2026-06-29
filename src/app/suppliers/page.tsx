'use client';

import { Card } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Truck, Search, Phone, Mail, Award, CheckCircle, Users, Clock } from 'lucide-react';
import { useState, useMemo } from 'react';

const mockSuppliers = [
  {
    id: 1,
    name: 'Apex Brass Casting Ltd.',
    material: 'Brass Ingots & Core Castings',
    leadTime: '5-7 Days',
    leadDays: 6,
    rating: 'A+',
    ratingLabel: 'High Quality',
    status: 'Preferred',
    contact: '+91 98765 43210',
    email: 'castings@apexbrass.co.in'
  },
  {
    id: 2,
    name: 'Glow Platers & Polishers',
    material: 'Chrome Plating, Nickel Powder',
    leadTime: '3-4 Days',
    leadDays: 3.5,
    rating: 'A',
    ratingLabel: 'Reliable',
    status: 'Active',
    contact: '+91 99887 76655',
    email: 'orders@glowplating.com'
  },
  {
    id: 3,
    name: 'Neo Rubber Seals Corp.',
    material: 'Rubber Gaskets, O-Rings, Washers',
    leadTime: '2 Days',
    leadDays: 2,
    rating: 'A+',
    ratingLabel: 'Certified Grade',
    status: 'Preferred',
    contact: '+91 88776 65544',
    email: 'logistics@neorubber.in'
  },
  {
    id: 4,
    name: 'Indus Fasteners & Screws',
    material: 'Fixing Screws, Springs, Hex Nuts',
    leadTime: '3 Days',
    leadDays: 3,
    rating: 'B+',
    ratingLabel: 'Standard',
    status: 'Active',
    contact: '+91 77665 54433',
    email: 'fasteners@indusgroup.com'
  },
  {
    id: 5,
    name: 'Claycraft Ceramic Ovens',
    material: 'Ceramic Basins, Clay Powders',
    leadTime: '12-15 Days',
    leadDays: 13.5,
    rating: 'A',
    ratingLabel: 'Premium Clay',
    status: 'Active',
    contact: '+91 91234 56789',
    email: 'support@claycraftceramics.com'
  }
];

const ratingColors: Record<string, string> = {
  'A+': 'bg-success/15 text-success border-success/20',
  'A': 'bg-info/15 text-info border-info/20',
  'B+': 'bg-warning/15 text-warning border-warning/20',
  'B': 'bg-text-tertiary/15 text-text-tertiary border-border',
};

export default function SuppliersPage() {
  const [search, setSearch] = useState('');

  const filteredSuppliers = mockSuppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.material.toLowerCase().includes(search.toLowerCase())
  );

  const totalVendors = mockSuppliers.length;
  const preferredCount = mockSuppliers.filter(s => s.status === 'Preferred').length;
  const avgLeadTime = useMemo(() => {
    const total = mockSuppliers.reduce((s, v) => s + v.leadDays, 0);
    return (total / mockSuppliers.length).toFixed(1);
  }, []);

  return (
    <div className="space-y-6 max-w-6xl animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="glass-card bg-mesh-gradient rounded-2xl p-6 relative overflow-hidden transition-all duration-300">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-text-primary tracking-tight">Supplier Directory</h1>
            <p className="text-sm text-text-secondary">Manage component procurement sources, lead times, and materials vendors.</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-info/10 border border-info/20 rounded-full">
            <Truck className="w-3.5 h-3.5 text-info" />
            <span className="text-xs font-semibold text-info tracking-wide uppercase">Suppliers</span>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier, index) => (
                <TableRow key={supplier.id} className="border-b border-border hover:bg-bg-hover/30 transition-colors row-enter" style={{ animationDelay: `${index * 40}ms` }}>
                  <TableCell className="text-sm font-semibold text-text-primary">
                    {supplier.name}
                  </TableCell>
                  <TableCell className="text-sm text-text-primary max-w-[200px]">
                    {supplier.material}
                  </TableCell>
                  <TableCell className="text-xs text-text-secondary font-medium">
                    {supplier.leadTime}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${ratingColors[supplier.rating] || ratingColors['B']}`}>
                      <Award className="w-3 h-3" />
                      {supplier.rating} · {supplier.ratingLabel}
                    </span>
                  </TableCell>
                  <TableCell>
                    {supplier.status === 'Preferred' ? (
                      <span className="text-success bg-success/10 px-2.5 py-0.5 rounded-full font-bold text-xs flex items-center gap-1 w-fit border border-success/20">
                        <CheckCircle className="w-3 h-3" /> Preferred
                      </span>
                    ) : (
                      <span className="text-text-secondary bg-bg-tertiary px-2.5 py-0.5 rounded-full font-medium text-xs w-fit border border-border">
                        Active
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-text-secondary text-right space-y-1">
                    <div className="flex items-center justify-end gap-1.5">
                      <Phone className="w-3 h-3 text-text-tertiary" />
                      <span>{supplier.contact}</span>
                    </div>
                    <div className="flex items-center justify-end gap-1.5">
                      <Mail className="w-3 h-3 text-text-tertiary" />
                      <a href={`mailto:${supplier.email}`} className="hover:text-accent transition-colors underline underline-offset-2 decoration-border hover:decoration-accent">
                        {supplier.email}
                      </a>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}