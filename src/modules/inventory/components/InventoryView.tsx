// src/modules/inventory/components/InventoryView.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Plus, Search, Edit, Trash2, Package, AlertTriangle, CheckCircle, XCircle,
  RefreshCw, History, TrendingUp, TrendingDown, Minus, Calendar, Check,
  SlidersHorizontal, LayoutGrid, List, Sparkles, Settings as SettingsIcon,
  ShoppingBag, ClipboardCheck, PlayCircle, Barcode, HelpCircle, User, ArrowUpRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { getInwardHistory } from '@/app/actions';

// Types matching current schema
interface Transaction {
  id: string;
  itemId: string;
  changeQty: number;
  newTotalQty: number;
  reason: string;
  createdAt: string;
  userName?: string;
  item: {
    name: string;
    sku: string;
    unit: string;
  };
}

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  subCategory: string;
  unit: string;
  unitCost: number;
  openingStock: number;
  openingStockDate: string;
  quantityOnHand: number; // maps to DB quantityOnHand
  minStock: number;
  location: string;
  createdAt: string;
  updatedAt: string;
}

const categories = ['Faucets', 'Showers', 'Sinks', 'Toilets', 'Accessories'];
const units = ['pcs', 'Box', 'Kg', 'Ltr', 'Mtr', 'Set'];

export default function InventoryView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const typeParam = searchParams.get('type');
  
  const activeTab = tabParam === 'operations' ? 'operations' :
                    tabParam === 'products' ? 'products' :
                    tabParam === 'reporting' ? 'reporting' :
                    tabParam === 'config' ? 'config' : 'overview';

  // State
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
  });
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  
  // Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isReplenishOpen, setIsReplenishOpen] = useState(false);
  const [replenishItemId, setReplenishItemId] = useState<string | null>(null);
  const [replenishQty, setReplenishQty] = useState<number>(0);
  const [replenishNote, setReplenishNote] = useState('');
  
  // Product Form Data
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    category: 'Faucets',
    subCategory: '',
    unit: 'pcs',
    unitCost: 0,
    openingStock: 0,
    openingStockDate: new Date().toISOString().split('T')[0],
    minStock: 0,
    location: '',
  });

  // Query transaction logs using the existing server action
  const { data: transactions = [], refetch: refetchTransactions } = useQuery<any[]>({
    queryKey: ["inwardHistory"],
    queryFn: () => getInwardHistory(),
  });

  // Fetch Inventory items from database api
  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/inventory`);
      const resData = await response.json();
      if (response.ok) {
        setItems(resData.data || []);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Combined metrics
  const totalStockValue = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.quantityOnHand * item.unitCost), 0);
  }, [items]);

  const lowStockCount = useMemo(() => {
    return items.filter(item => item.quantityOnHand <= item.minStock && item.minStock > 0).length;
  }, [items]);

  // Operations filter (Receipts vs Deliveries vs Scrap)
  const [operationsFilter, setOperationsFilter] = useState<'all' | 'receipts' | 'deliveries' | 'scrap'>('all');
  
  // Sync type Param to local operations filter
  useEffect(() => {
    if (typeParam === 'receipts') setOperationsFilter('receipts');
    else if (typeParam === 'deliveries') setOperationsFilter('deliveries');
    else setOperationsFilter('all');
  }, [typeParam]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const searchMatch = !filters.search || 
        t.item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        t.item.sku.toLowerCase().includes(filters.search.toLowerCase()) ||
        t.reason.toLowerCase().includes(filters.search.toLowerCase());

      if (!searchMatch) return false;

      if (operationsFilter === 'receipts') return t.changeQty > 0;
      if (operationsFilter === 'deliveries') return t.changeQty < 0;
      if (operationsFilter === 'scrap') return t.reason.toLowerCase().includes('scrap');
      return true;
    });
  }, [transactions, operationsFilter, filters.search]);

  // Products filters
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = !filters.search ||
        item.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.sku.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesCategory = !filters.category || item.category === filters.category;
      
      let matchesStatus = true;
      if (filters.status === 'in') matchesStatus = item.quantityOnHand > item.minStock;
      else if (filters.status === 'low') matchesStatus = item.quantityOnHand <= item.minStock && item.quantityOnHand > 0;
      else if (filters.status === 'out') matchesStatus = item.quantityOnHand === 0;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [items, filters]);

  // Overview Mock Values for Bar Charts
  const overviewStats = useMemo(() => {
    const receiptsCount = transactions.filter(t => t.changeQty > 0).length;
    const deliveriesCount = transactions.filter(t => t.changeQty < 0).length;
    return {
      receipts: receiptsCount || 8,
      deliveries: deliveriesCount || 4,
      manufacturing: 12
    };
  }, [transactions]);

  // Product CRUD
  const handleOpenCreate = () => {
    setEditingItem(null);
    setProductForm({
      name: '',
      sku: '',
      category: 'Faucets',
      subCategory: '',
      unit: 'pcs',
      unitCost: 0,
      openingStock: 0,
      openingStockDate: new Date().toISOString().split('T')[0],
      minStock: 0,
      location: '',
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setProductForm({
      name: item.name,
      sku: item.sku,
      category: item.category,
      subCategory: item.subCategory || '',
      unit: item.unit,
      unitCost: item.unitCost,
      openingStock: item.openingStock,
      openingStockDate: item.openingStockDate ? item.openingStockDate.split('T')[0] : new Date().toISOString().split('T')[0],
      minStock: item.minStock,
      location: item.location || '',
    });
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingItem ? 'PUT' : 'POST';
    const body = editingItem ? { id: editingItem.id, ...productForm } : productForm;

    const t = toast.loading(editingItem ? "Saving changes..." : "Adding product...");
    try {
      const response = await fetch('/api/inventory', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast.success(editingItem ? 'Product updated!' : 'Product added!', { id: t });
        setIsProductModalOpen(false);
        fetchInventory();
      } else {
        const errData = await response.json();
        toast.error(errData.error || 'Failed to save product', { id: t });
      }
    } catch {
      toast.error('Failed to save product', { id: t });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    const t = toast.loading("Deleting product...");
    try {
      const response = await fetch(`/api/inventory?id=${id}`, { method: 'DELETE' });
      if (response.ok) {
        toast.success('Product deleted!', { id: t });
        fetchInventory();
      } else {
        const errData = await response.json();
        toast.error(errData.error || 'Failed to delete', { id: t });
      }
    } catch {
      toast.error('Failed to delete', { id: t });
    }
  };

  // Replenishment Action
  const handleOpenReplenish = (itemId: string) => {
    setReplenishItemId(itemId);
    setReplenishQty(0);
    setReplenishNote('');
    setIsReplenishOpen(true);
  };

  const handleReplenishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replenishItemId) return;
    if (replenishQty <= 0) {
      toast.error("Please enter a positive quantity");
      return;
    }

    const t = toast.loading("Submitting replenishment...");
    try {
      const response = await fetch('/api/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: replenishItemId,
          updateType: 'addition',
          quantityChange: replenishQty,
          note: replenishNote || `Replenished ${replenishQty} units`
        })
      });

      if (response.ok) {
        toast.success("Replenishment done!", { id: t });
        setIsReplenishOpen(false);
        fetchInventory();
        refetchTransactions();
      } else {
        const err = await response.json();
        toast.error(err.error || 'Replenish failed', { id: t });
      }
    } catch {
      toast.error('Replenish failed', { id: t });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300 font-sans text-gray-800 text-left">
      
      {/* 1. OVERVIEW VIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <h2 className="text-lg font-black text-gray-800 font-display flex items-center gap-2">
              Inventory Overview <SettingsIcon className="w-4 h-4 text-gray-400 cursor-pointer animate-hover" />
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Receipts Card */}
            <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm flex flex-col justify-between h-72">
              <div>
                <span className="text-[#006666] font-bold text-sm tracking-wide">Receipts</span>
                <div className="mt-3">
                  <button
                    onClick={() => router.push('/inventory?tab=operations&type=receipts')}
                    className="px-3.5 py-1.5 bg-[#6a4a63] hover:bg-[#5c3e55] text-white text-[10px] font-bold uppercase rounded-lg shadow-sm tracking-wider cursor-pointer"
                  >
                    Open
                  </button>
                </div>
              </div>
              
              {/* Minimalist Bar Chart representation */}
              <div className="flex items-end gap-1.5 h-36 pt-4 border-t border-gray-100">
                <div className="w-full bg-gray-100 rounded-t-sm h-[60%] hover:bg-[#73a6f4] transition-colors" />
                <div className="w-full bg-gray-100 rounded-t-sm h-[80%] hover:bg-[#73a6f4] transition-colors" />
                <div className="w-full bg-gray-100 rounded-t-sm h-[40%] hover:bg-[#73a6f4] transition-colors" />
                <div className="w-full bg-gray-100 rounded-t-sm h-[20%] hover:bg-[#73a6f4] transition-colors" />
                <div className="w-full bg-gray-100 rounded-t-sm h-[85%] hover:bg-[#73a6f4] transition-colors" />
                <div className="w-full bg-gray-100 rounded-t-sm h-[30%] hover:bg-[#73a6f4] transition-colors" />
              </div>
            </div>

            {/* Delivery Orders Card */}
            <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm flex flex-col justify-between h-72">
              <div>
                <span className="text-[#006666] font-bold text-sm tracking-wide">Delivery Orders</span>
                <div className="mt-3">
                  <button
                    onClick={() => router.push('/inventory?tab=operations&type=deliveries')}
                    className="px-3.5 py-1.5 bg-[#6a4a63] hover:bg-[#5c3e55] text-white text-[10px] font-bold uppercase rounded-lg shadow-sm tracking-wider cursor-pointer"
                  >
                    Open
                  </button>
                </div>
              </div>

              {/* Minimalist Bar Chart representation */}
              <div className="flex items-end gap-1.5 h-36 pt-4 border-t border-gray-100">
                <div className="w-full bg-gray-100 rounded-t-sm h-[10%] hover:bg-[#f49fa8] transition-colors" />
                <div className="w-full bg-gray-100 rounded-t-sm h-[30%] hover:bg-[#f49fa8] transition-colors" />
                <div className="w-full bg-gray-100 rounded-t-sm h-[75%] hover:bg-[#f49fa8] transition-colors" />
                <div className="w-full bg-gray-100 rounded-t-sm h-[45%] hover:bg-[#f49fa8] transition-colors" />
                <div className="w-full bg-gray-100 rounded-t-sm h-[68%] hover:bg-[#f49fa8] transition-colors" />
                <div className="w-full bg-gray-100 rounded-t-sm h-[82%] hover:bg-[#f49fa8] transition-colors" />
              </div>
            </div>

            {/* Manufacturing Orders Card */}
            <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm flex flex-col justify-between h-72">
              <div>
                <span className="text-[#006666] font-bold text-sm tracking-wide">Manufacturing</span>
                <div className="mt-3">
                  <button
                    onClick={() => router.push('/manufacturing')}
                    className="px-3.5 py-1.5 bg-[#6a4a63] hover:bg-[#5c3e55] text-white text-[10px] font-bold uppercase rounded-lg shadow-sm tracking-wider cursor-pointer"
                  >
                    Open
                  </button>
                </div>
              </div>

              {/* Minimalist Bar Chart representation */}
              <div className="flex items-end gap-1.5 h-36 pt-4 border-t border-gray-100">
                <div className="w-full bg-gray-100 rounded-t-sm h-[70%] hover:bg-[#9fe4d8] transition-colors" />
                <div className="w-full bg-gray-100 rounded-t-sm h-[42%] hover:bg-[#9fe4d8] transition-colors" />
                <div className="w-full bg-gray-100 rounded-t-sm h-[42%] hover:bg-[#9fe4d8] transition-colors" />
                <div className="w-full bg-gray-100 rounded-t-sm h-[15%] hover:bg-[#9fe4d8] transition-colors" />
                <div className="w-full bg-gray-100 rounded-t-sm h-[58%] hover:bg-[#9fe4d8] transition-colors" />
                <div className="w-full bg-gray-100 rounded-t-sm h-[64%] hover:bg-[#9fe4d8] transition-colors" />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 2. OPERATIONS VIEW */}
      {activeTab === 'operations' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Operations Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-[#6a4a63] hover:bg-[#5c3e55] text-white text-xs font-bold uppercase rounded-lg shadow-md cursor-pointer transition-all"
              >
                New
              </button>
              <h2 className="text-lg font-black text-gray-800 font-display uppercase tracking-wider">
                {operationsFilter === 'all' ? "All Transfers" : 
                 operationsFilter === 'receipts' ? "Receipts" : 
                 operationsFilter === 'deliveries' ? "Deliveries" : "Scrap Operations"}
              </h2>
            </div>

            {/* Quick operations category filter */}
            <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl border border-gray-200 text-[10px] font-bold">
              <button
                onClick={() => setOperationsFilter('all')}
                className={cn("px-3 py-1.5 rounded-lg transition-all", operationsFilter === 'all' ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700")}
              >
                All
              </button>
              <button
                onClick={() => setOperationsFilter('receipts')}
                className={cn("px-3 py-1.5 rounded-lg transition-all", operationsFilter === 'receipts' ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700")}
              >
                Receipts
              </button>
              <button
                onClick={() => setOperationsFilter('deliveries')}
                className={cn("px-3 py-1.5 rounded-lg transition-all", operationsFilter === 'deliveries' ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700")}
              >
                Deliveries
              </button>
              <button
                onClick={() => setOperationsFilter('scrap')}
                className={cn("px-3 py-1.5 rounded-lg transition-all", operationsFilter === 'scrap' ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700")}
              >
                Scrap
              </button>
            </div>
          </div>

          {/* Search bar inside operations */}
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search transfers..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#6a4a63] bg-white font-medium"
            />
          </div>

          {/* Table list or Illustration when empty */}
          {filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-gray-200 rounded-2xl bg-gray-50/30 text-center space-y-4">
              <div className="p-4 bg-purple-50 rounded-full border border-purple-100 hover:scale-105 transition-transform duration-300">
                <Barcode className="w-12 h-12 text-[#6a4a63]" strokeWidth={1} />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-gray-800 font-display">No transfers yet! Create a new one.</h3>
                <p className="text-xs text-gray-400 max-w-md mx-auto">
                  Reduce stockouts with alerts, barcode app, replenishment propositions, locations management traceability, quality control, etc.
                </p>
              </div>
              <button
                onClick={handleOpenCreate}
                className="px-5 py-2.5 bg-[#6a4a63] hover:bg-[#5c3e55] text-white text-xs font-bold uppercase rounded-lg shadow-md cursor-pointer transition-all active:scale-95"
              >
                Create a Transfer
              </button>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-3">Reference</th>
                      <th className="p-3">Product</th>
                      <th className="p-3">Quantity</th>
                      <th className="p-3">Source / Note</th>
                      <th className="p-3">Date</th>
                      <th className="p-3">Responsible</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTransactions.map((t, index) => {
                      const isAddition = t.changeQty > 0;
                      return (
                        <tr key={t.id} className="hover:bg-gray-50/50">
                          <td className="p-3 font-mono font-bold text-gray-700">
                            {isAddition ? `WH/IN/` : `WH/OUT/`}{t.id.slice(-5).toUpperCase()}
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-gray-800">{t.item.name}</span>
                            <span className="block text-[10px] text-gray-400 font-medium font-mono">{t.item.sku}</span>
                          </td>
                          <td className="p-3">
                            <span className={cn(
                              "font-bold text-xs px-2 py-0.5 rounded-full",
                              isAddition ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
                            )}>
                              {isAddition ? `+` : ``}{t.changeQty} {t.item.unit}
                            </span>
                          </td>
                          <td className="p-3 text-gray-500 max-w-xs truncate">{t.reason}</td>
                          <td className="p-3 text-gray-500">{new Date(t.createdAt).toLocaleDateString('en-IN')}</td>
                          <td className="p-3 text-gray-600">{t.userName || "System Admin"}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                              Done
                            </span>
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
      )}

      {/* 3. PRODUCTS VIEW */}
      {activeTab === 'products' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Header & Tool Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleOpenCreate}
                className="px-4 py-2 bg-[#6a4a63] hover:bg-[#5c3e55] text-white text-xs font-bold uppercase rounded-lg shadow-md cursor-pointer transition-all"
              >
                New
              </button>
              <h2 className="text-lg font-black text-gray-800 font-display uppercase tracking-wider">
                Products Master
              </h2>
            </div>

            {/* Right utilities: Search + View Toggler */}
            <div className="flex items-center gap-3">
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search SKU or Name..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-9 pr-4 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#6a4a63] bg-white font-medium w-48 sm:w-56"
                />
              </div>

              {/* View Toggle Buttons */}
              <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
                <button
                  onClick={() => setViewType('grid')}
                  className={cn("p-1 rounded-md transition-all", viewType === 'grid' ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600")}
                  title="Kanban Grid"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewType('list')}
                  className={cn("p-1 rounded-md transition-all", viewType === 'list' ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600")}
                  title="Table List"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Product list grid/table */}
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="w-8 h-8 border-4 border-[#6a4a63] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs">No products found matching filters.</div>
          ) : viewType === 'grid' ? (
            
            /* KANBAN GRID VIEW (Odoo style) */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in zoom-in-95 duration-200">
              {filteredItems.map((item) => (
                <div 
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between h-44 relative"
                  onClick={() => handleOpenEdit(item)}
                >
                  <div>
                    {/* Star favorite placeholder + Title */}
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-bold text-gray-800 truncate pr-4 group-hover:text-[#6a4a63] transition-colors">
                        {item.name}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 font-mono">
                        {item.sku}
                      </span>
                    </div>

                    <div className="mt-4 space-y-1.5 text-xs text-gray-500 font-medium">
                      <p>Category: <span className="text-gray-700">{item.category}</span></p>
                      <p>Price: <span className="text-gray-800 font-bold">₹{(item.unitCost * 1.4).toFixed(2)}</span></p>
                      <p>Cost: <span className="text-gray-600">₹{item.unitCost.toFixed(2)}</span></p>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-xs mt-2 select-none">
                    <span className={cn(
                      "font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider leading-none",
                      item.quantityOnHand <= item.minStock ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                    )}>
                      {item.quantityOnHand <= item.minStock ? "Low Stock" : "In Stock"}
                    </span>
                    <span className="font-black text-gray-700">
                      On Hand: {item.quantityOnHand} {item.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            
            /* LIST TABLE VIEW */
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-3">Name</th>
                      <th className="p-3">SKU</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Cost Price</th>
                      <th className="p-3">On Hand</th>
                      <th className="p-3">Min Level</th>
                      <th className="p-3">Location</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="p-3 font-bold text-gray-800">{item.name}</td>
                        <td className="p-3 font-mono font-bold text-gray-400">{item.sku}</td>
                        <td className="p-3 text-gray-600">{item.category}</td>
                        <td className="p-3 font-bold text-gray-700">₹{item.unitCost.toLocaleString('en-IN')}</td>
                        <td className="p-3">
                          <span className={cn(
                            "font-bold",
                            item.quantityOnHand <= item.minStock ? "text-amber-600" : "text-gray-700"
                          )}>
                            {item.quantityOnHand} {item.unit}
                          </span>
                        </td>
                        <td className="p-3 text-gray-500">{item.minStock} {item.unit}</td>
                        <td className="p-3 text-gray-500 font-medium font-mono">{item.location || "-"}</td>
                        <td className="p-3 text-right space-x-1">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(item.id)}
                            className="p-1.5 hover:bg-rose-50 rounded text-rose-500 hover:text-rose-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. REPORTING VIEW */}
      {activeTab === 'reporting' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-gray-200 pb-3 flex items-center justify-between">
            <h2 className="text-lg font-black text-gray-800 font-display uppercase tracking-wider">
              Stock Status Reporting
            </h2>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Product</th>
                    <th className="p-4">SKU</th>
                    <th className="p-4">On Hand</th>
                    <th className="p-4">Free to Use</th>
                    <th className="p-4">Incoming</th>
                    <th className="p-4">Outgoing</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => {
                    // Replicates Odoo reporting sheet fields
                    const freeToUse = Math.max(0, item.quantityOnHand - 2); // mockup reserves
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="p-4 font-bold text-gray-800">{item.name}</td>
                        <td className="p-4 font-mono font-bold text-gray-400">{item.sku}</td>
                        <td className="p-4 font-bold text-gray-700">{item.quantityOnHand.toFixed(2)}</td>
                        <td className="p-4 text-gray-600">{freeToUse.toFixed(2)}</td>
                        <td className="p-4 text-gray-400">0.00</td>
                        <td className="p-4 text-gray-400">0.00</td>
                        <td className="p-4 text-center space-x-3">
                          <button
                            onClick={() => router.push(`/inventory?tab=operations&search=${item.sku}`)}
                            className="inline-flex items-center gap-1 text-[#006666] font-bold hover:underline"
                          >
                            <History className="w-3.5 h-3.5" /> History
                          </button>
                          <button
                            onClick={() => handleOpenReplenish(item.id)}
                            className="inline-flex items-center gap-1 text-[#6a4a63] font-bold hover:underline"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Replenish
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. CONFIGURATION VIEW */}
      {activeTab === 'config' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="border-b border-gray-200 pb-3">
            <h2 className="text-lg font-black text-gray-800 font-display uppercase tracking-wider">
              Inventory Configuration
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Categories Card */}
            <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#006666] border-b border-gray-100 pb-2">Product Categories</h3>
              <div className="divide-y divide-gray-100">
                {categories.map((c) => {
                  const count = items.filter(i => i.category === c).length;
                  return (
                    <div key={c} className="flex justify-between items-center py-2.5">
                      <span className="text-xs font-bold text-gray-700">{c}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                        {count} products
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Warehouse Configuration info */}
            <div className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-[#006666] border-b border-gray-100 pb-2">Warehouse Parameters</h3>
              <div className="space-y-3 text-xs font-medium text-gray-600">
                <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                  <span>Warehouse Name</span>
                  <span className="font-bold text-gray-800">Zoie Central Warehouse</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                  <span>Traceability</span>
                  <span className="font-bold text-emerald-600">Unique Batch IDs</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded-lg">
                  <span>Standard Lead Time</span>
                  <span className="font-bold text-gray-800">2-3 Working Days</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ==========================================
          6. ADD / EDIT PRODUCT DRAWER MODAL
          ========================================== */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsProductModalOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl p-6 overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-sm font-black uppercase text-gray-800 tracking-wider">
                  {editingItem ? 'Edit Product' : 'Add New Product'}
                </h3>
                <button 
                  onClick={() => setIsProductModalOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleProductSubmit} id="productForm" className="space-y-4 text-xs font-medium text-gray-600">
                
                {/* Product Name */}
                <div className="space-y-1.5">
                  <label className="font-bold">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none"
                    placeholder="e.g. Premium Single Lever Faucet"
                  />
                </div>

                {/* SKU Code */}
                <div className="space-y-1.5">
                  <label className="font-bold">SKU Code *</label>
                  <input
                    type="text"
                    required
                    value={productForm.sku}
                    onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
                    className="w-full p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none"
                    placeholder="e.g. ZB-FAU-11001"
                  />
                </div>

                {/* Categories */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold">Category *</label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none bg-white"
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="font-bold">Unit *</label>
                    <select
                      value={productForm.unit}
                      onChange={(e) => setProductForm(prev => ({ ...prev, unit: e.target.value }))}
                      className="w-full p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none bg-white"
                    >
                      {units.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                {/* Cost */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold">Unit Cost (₹) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={productForm.unitCost}
                      onChange={(e) => setProductForm(prev => ({ ...prev, unitCost: Number(e.target.value) }))}
                      className="w-full p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="font-bold">Safety Min Stock</label>
                    <input
                      type="number"
                      min={0}
                      value={productForm.minStock}
                      onChange={(e) => setProductForm(prev => ({ ...prev, minStock: Number(e.target.value) }))}
                      className="w-full p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <label className="font-bold">Storage Location Location</label>
                  <input
                    type="text"
                    value={productForm.location}
                    onChange={(e) => setProductForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none"
                    placeholder="e.g. AISLE-B4-SHELF3"
                  />
                </div>

                {/* Opening stock (Add only) */}
                {!editingItem && (
                  <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 border border-gray-150 rounded-xl">
                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-700">Initial Quantity</label>
                      <input
                        type="number"
                        min={0}
                        value={productForm.openingStock}
                        onChange={(e) => setProductForm(prev => ({ ...prev, openingStock: Number(e.target.value) }))}
                        className="w-full p-2 border border-gray-200 bg-white rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="font-bold text-gray-700">As of Date</label>
                      <input
                        type="date"
                        value={productForm.openingStockDate}
                        onChange={(e) => setProductForm(prev => ({ ...prev, openingStockDate: e.target.value }))}
                        className="w-full p-2 border border-gray-200 bg-white rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

              </form>
            </div>

            <div className="border-t border-gray-100 pt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="productForm"
                className="px-5 py-2 bg-[#6a4a63] hover:bg-[#5c3e55] text-white text-xs font-bold uppercase rounded-lg shadow-sm cursor-pointer"
              >
                {editingItem ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          7. REPLENISHMENT / STOCK ADJUSTMENT MODAL
          ========================================== */}
      {isReplenishOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsReplenishOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200 text-xs font-medium text-gray-600 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-black uppercase text-gray-800 tracking-wider">Replenish Product Stock</h3>
              <button onClick={() => setIsReplenishOpen(false)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReplenishSubmit} id="replenishForm" className="space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="font-bold">Quantity to Add *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={replenishQty}
                  onChange={(e) => setReplenishQty(Number(e.target.value))}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none"
                  placeholder="e.g. 50"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="font-bold">Source Reference / Notes</label>
                <input
                  type="text"
                  value={replenishNote}
                  onChange={(e) => setReplenishNote(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-[#6a4a63] focus:outline-none"
                  placeholder="e.g. Supplier PO #420"
                />
              </div>
            </form>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsReplenishOpen(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="replenishForm"
                className="px-5 py-2 bg-[#6a4a63] hover:bg-[#5c3e55] text-white text-xs font-bold uppercase rounded-lg shadow-sm cursor-pointer"
              >
                Replenish
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
