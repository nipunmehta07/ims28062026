// src/app/inventory/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Download, 
  Upload,
  X,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  MoreHorizontal,
  Eye,
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import InwardLedger from '@/components/InwardLedger';

// Types
interface Transaction {
  id: string;
  type: 'addition' | 'deduction' | 'adjustment';
  quantity: number;
  previousBalance: number;
  newBalance: number;
  note: string;
  date: string;
  userId?: string;
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
  quantity: number;
  minStock: number;
  price: number;
  cost: number;
  location: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  history: Transaction[];
  createdAt: string;
  updatedAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Status badge config
const statusConfig = {
  'In Stock': { 
    bg: 'bg-success/10', 
    text: 'text-success', 
    icon: CheckCircle,
    label: 'In Stock'
  },
  'Low Stock': { 
    bg: 'bg-warning/10', 
    text: 'text-warning', 
    icon: AlertTriangle,
    label: 'Low Stock'
  },
  'Out of Stock': { 
    bg: 'bg-error/10', 
    text: 'text-error', 
    icon: XCircle,
    label: 'Out of Stock'
  },
};

// Transaction type config
const transactionConfig = {
  addition: { icon: TrendingUp, color: 'text-success', bg: 'bg-success/10', label: 'Addition' },
  deduction: { icon: TrendingDown, color: 'text-error', bg: 'bg-error/10', label: 'Deduction' },
  adjustment: { icon: Minus, color: 'text-info', bg: 'bg-info/10', label: 'Adjustment' },
};

const categories = ['Faucets', 'Showers', 'Sinks', 'Toilets', 'Accessories'];
const subCategories = {
  'Faucets': ['Kitchen Faucets', 'Bathroom Faucets', 'Premium Faucets', 'Commercial Faucets'],
  'Showers': ['Rain Showers', 'Handheld Showers', 'Wall Mounted', 'Ceiling Mounted'],
  'Sinks': ['Bathroom Sinks', 'Kitchen Sinks', 'Utility Sinks', 'Pedestal Sinks'],
  'Toilets': ['Dual Flush', 'Single Flush', 'Wall Hung', 'Floor Mounted'],
  'Accessories': ['Towel Bars', 'Soap Dispensers', 'Mirrors', 'Shower Screens'],
};

const units = ['Pcs', 'Box', 'Kg', 'Ltr', 'Mtr', 'Set'];

export default function InventoryPage() {
  // State
  const [activeTab, setActiveTab] = useState<'master' | 'inward'>('master');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    subCategory: '',
    status: '',
  });
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    subCategory: '',
    unit: 'Pcs',
    unitCost: 0,
    openingStock: 0,
    openingStockDate: new Date().toISOString().split('T')[0],
    minStock: 0,
    location: '',
  });
  const [transactionData, setTransactionData] = useState({
    type: 'addition' as 'addition' | 'deduction' | 'adjustment',
    quantity: 0,
    note: '',
  });
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [transactionItemId, setTransactionItemId] = useState<string | null>(null);

  // Fetch inventory data
  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.category && { category: filters.category }),
        ...(filters.subCategory && { subCategory: filters.subCategory }),
        ...(filters.status && { status: filters.status }),
      });

      const response = await fetch(`/api/inventory?${params}`);
      const data = await response.json();

      if (response.ok) {
        setItems(data.data);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch inventory:', data.error);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  // Load data on mount and when filters/pagination change
  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Handle search with debounce
  const handleSearch = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (key === 'category') {
      setFilters(prev => ({ ...prev, subCategory: '' }));
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({ search: '', category: '', subCategory: '', status: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Toggle item selection
  const toggleItemSelection = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItems(newSelection);
  };

  // Toggle all items
  const toggleAllItems = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  // Open create/update modal
  const openModal = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        sku: item.sku,
        category: item.category,
        subCategory: item.subCategory || '',
        unit: item.unit,
        unitCost: item.unitCost,
        openingStock: item.openingStock,
        openingStockDate: item.openingStockDate,
        minStock: item.minStock,
        location: item.location,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        sku: '',
        category: '',
        subCategory: '',
        unit: 'Pcs',
        unitCost: 0,
        openingStock: 0,
        openingStockDate: new Date().toISOString().split('T')[0],
        minStock: 0,
        location: '',
      });
    }
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  // Open product detail
  const openProductDetail = async (item: InventoryItem) => {
    try {
      const response = await fetch(`/api/inventory?id=${item.id}`);
      const data = await response.json();
      if (response.ok) {
        setSelectedItem(data.data);
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('Error fetching item details:', error);
    }
  };

  // Open transaction modal
  const openTransactionModal = (itemId: string) => {
    setTransactionItemId(itemId);
    setTransactionData({ type: 'addition', quantity: 0, note: '' });
    setShowTransactionModal(true);
  };

  // Handle transaction submission
  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionItemId) return;

    try {
      const response = await fetch(`/api/inventory`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: transactionItemId,
          updateType: transactionData.type,
          quantityChange: transactionData.quantity,
          note: transactionData.note || `${transactionData.type} of ${transactionData.quantity} units`,
        }),
      });

      if (response.ok) {
        await fetchInventory();
        setShowTransactionModal(false);
        setTransactionItemId(null);
        // Refresh detail if open
        if (showDetailModal && selectedItem) {
          const detailResponse = await fetch(`/api/inventory?id=${selectedItem.id}`);
          const detailData = await detailResponse.json();
          if (detailResponse.ok) {
            setSelectedItem(detailData.data);
          }
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update stock');
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Failed to update stock');
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingItem 
        ? `/api/inventory?id=${editingItem.id}` 
        : '/api/inventory';
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem ? { id: editingItem.id, ...formData } : formData),
      });

      if (response.ok) {
        await fetchInventory();
        closeModal();
      } else {
        const error = await response.json();
        console.error('Failed to save item:', error);
        alert(error.error || 'Failed to save item');
      }
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Failed to save item');
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const response = await fetch(`/api/inventory?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchInventory();
        setSelectedItems(prev => {
          const newSelection = new Set(prev);
          newSelection.delete(id);
          return newSelection;
        });
      } else {
        console.error('Failed to delete item');
        alert('Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item');
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedItems.size} items?`)) return;

    try {
      const deletePromises = Array.from(selectedItems).map(id =>
        fetch(`/api/inventory?id=${id}`, { method: 'DELETE' })
      );
      
      await Promise.all(deletePromises);
      await fetchInventory();
      setSelectedItems(new Set());
    } catch (error) {
      console.error('Error deleting items:', error);
      alert('Failed to delete items');
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format time
  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Quick stats
  const totalValue = items.reduce((sum, item) => sum + (item.unitCost * item.quantity), 0);
  const lowStockCount = items.filter(item => item.status === 'Low Stock').length;
  const outOfStockCount = items.filter(item => item.status === 'Out of Stock').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Inventory</h1>
          <p className="text-sm text-text-secondary">Manage your products and stock levels</p>
        </div>
        {activeTab === 'master' && (
          <div className="flex items-center gap-3 flex-wrap">
            <button 
              onClick={() => {}} 
              className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary bg-bg-tertiary hover:bg-bg-hover rounded-xl transition-colors border border-border"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button 
              onClick={() => {}} 
              className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary bg-bg-tertiary hover:bg-bg-hover rounded-xl transition-colors border border-border"
            >
              <Upload className="w-4 h-4" />
              Import
            </button>
            <button 
              onClick={() => openModal()}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-accent hover:bg-accent-hover rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>
        )}
      </div>

      {/* Sub-tabs Selector */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('master')}
          className={cn(
            "relative px-5 py-2.5 text-sm font-semibold transition-all",
            activeTab === 'master'
              ? "text-accent font-bold"
              : "text-text-secondary hover:text-text-primary"
          )}
        >
          Master Inventory
          <span className={cn(
            "ml-2 text-[10px] px-1.5 py-0.5 rounded-full font-bold",
            activeTab === 'master' ? "bg-accent/15 text-accent" : "bg-bg-tertiary text-text-tertiary"
          )}>
            {pagination.total}
          </span>
          {activeTab === 'master' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" style={{ animation: 'slide-up-fade 0.2s ease-out' }} />
          )}
        </button>
        <button
          onClick={() => setActiveTab('inward')}
          className={cn(
            "relative px-5 py-2.5 text-sm font-semibold transition-all",
            activeTab === 'inward'
              ? "text-accent font-bold"
              : "text-text-secondary hover:text-text-primary"
          )}
        >
          Stock Inward Ledger
          {activeTab === 'inward' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" style={{ animation: 'slide-up-fade 0.2s ease-out' }} />
          )}
        </button>
      </div>

      {activeTab === 'inward' ? (
        <InwardLedger />
      ) : (
        <>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card glow-card rounded-2xl p-4 relative overflow-hidden stagger-enter">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-transparent opacity-50" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Total Items</p>
              <p className="text-2xl font-black text-text-primary mt-1 stat-number">{pagination.total}</p>
            </div>
            <Package className="w-5 h-5 text-accent" />
          </div>
        </div>
        <div className="glass-card glow-card rounded-2xl p-4 relative overflow-hidden stagger-enter">
          <div className="absolute inset-0 bg-gradient-to-br from-success/5 via-transparent to-transparent opacity-50" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Total Value</p>
              <p className="text-2xl font-black text-text-primary mt-1 stat-number">{formatCurrency(totalValue)}</p>
            </div>
            <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center">
              <span className="text-success text-xs">₹</span>
            </div>
          </div>
        </div>
        <div className="glass-card glow-card rounded-2xl p-4 relative overflow-hidden stagger-enter">
          <div className="absolute inset-0 bg-gradient-to-br from-warning/5 via-transparent to-transparent opacity-50" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Low Stock</p>
              <p className="text-2xl font-black text-warning mt-1 stat-number">{lowStockCount}</p>
            </div>
            <AlertTriangle className="w-5 h-5 text-warning" />
          </div>
        </div>
        <div className="glass-card glow-card rounded-2xl p-4 relative overflow-hidden stagger-enter">
          <div className="absolute inset-0 bg-gradient-to-br from-error/5 via-transparent to-transparent opacity-50" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">Out of Stock</p>
              <p className="text-2xl font-black text-error mt-1 stat-number">{outOfStockCount}</p>
            </div>
            <XCircle className="w-5 h-5 text-error" />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search products by name or SKU..."
            value={filters.search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-bg-secondary border border-border rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="px-3 py-2.5 bg-bg-secondary border border-border rounded-xl text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={filters.subCategory}
            onChange={(e) => handleFilterChange('subCategory', e.target.value)}
            className="px-3 py-2.5 bg-bg-secondary border border-border rounded-xl text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50"
            disabled={!filters.category}
          >
            <option value="">All Sub-Categories</option>
            {(subCategories[filters.category as keyof typeof subCategories] || []).map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2.5 bg-bg-secondary border border-border rounded-xl text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            <option value="">All Status</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
          <button 
            onClick={clearFilters}
            className="px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-xl transition-colors"
          >
            Clear
          </button>
          <button 
            onClick={() => fetchInventory()}
            className="p-2.5 text-text-secondary hover:text-text-primary hover:bg-bg-hover rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-xl">
          <span className="text-sm text-text-secondary">
            {selectedItems.size} items selected
          </span>
          <button 
            onClick={handleBulkDelete}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-error bg-error/10 hover:bg-error/20 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Selected
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-bg-secondary border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-tertiary/50">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={items.length > 0 && selectedItems.size === items.length}
                    onChange={toggleAllItems}
                    className="rounded bg-bg-tertiary border-border"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Product Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Sub-Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Unit</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">Unit Cost</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">Opening Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-text-tertiary uppercase tracking-wider">Opening Date</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-text-tertiary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-text-secondary">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-text-secondary">
                    No items found
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const status = statusConfig[item.status];
                  const StatusIcon = status.icon;
                  return (
                    <tr 
                      key={item.id}
                      className="border-b border-border/50 hover:bg-bg-hover transition-colors cursor-pointer"
                      onClick={() => openProductDetail(item)}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={() => toggleItemSelection(item.id)}
                          className="rounded bg-bg-tertiary border-border"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary">{item.name}</span>
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
                            status.bg,
                            status.text
                          )}>
                            <StatusIcon className="w-2.5 h-2.5" />
                            {status.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary font-mono">{item.sku}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{item.category}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{item.subCategory || '-'}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary">{item.unit}</td>
                      <td className="px-4 py-3 text-sm text-text-secondary text-right">
                        {formatCurrency(item.unitCost)}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary text-right">
                        <span className={cn(
                          item.quantity === 0 ? 'text-error' : 
                          item.quantity <= item.minStock ? 'text-warning' : 'text-success'
                        )}>
                          {item.openingStock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-secondary">
                        {formatDate(item.openingStockDate)}
                      </td>
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openTransactionModal(item.id)}
                            className="p-1.5 text-text-tertiary hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                            title="Update Stock"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openModal(item)}
                            className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-text-tertiary hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openProductDetail(item)}
                            className="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors"
                            title="View History"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-text-tertiary">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} items
            </p>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1.5 text-sm text-text-secondary bg-bg-tertiary hover:bg-bg-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={pagination.page === 1}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              >
                Previous
              </button>
              <span className="text-sm text-text-secondary px-3">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                className="px-3 py-1.5 text-sm text-text-secondary bg-bg-tertiary hover:bg-bg-hover rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-secondary border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-text-primary">
                {editingItem ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 text-text-tertiary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    SKU *
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, category: e.target.value, subCategory: '' }));
                    }}
                    className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Sub-Category
                  </label>
                  <select
                    value={formData.subCategory}
                    onChange={(e) => setFormData(prev => ({ ...prev, subCategory: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                    disabled={!formData.category}
                  >
                    <option value="">Select Sub-Category</option>
                    {(subCategories[formData.category as keyof typeof subCategories] || []).map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Unit *
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                    required
                  >
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Unit Cost (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.unitCost}
                    onChange={(e) => setFormData(prev => ({ ...prev, unitCost: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Opening Stock *
                  </label>
                  <input
                    type="number"
                    value={formData.openingStock}
                    onChange={(e) => setFormData(prev => ({ ...prev, openingStock: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Opening Stock Date *
                  </label>
                  <input
                    type="date"
                    value={formData.openingStockDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, openingStockDate: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Minimum Stock *
                  </label>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData(prev => ({ ...prev, minStock: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm text-text-secondary bg-bg-tertiary hover:bg-bg-hover rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-accent hover:bg-accent-hover rounded-xl transition-colors"
                >
                  {editingItem ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-secondary border border-border rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">{selectedItem.name}</h2>
                <p className="text-sm text-text-secondary">SKU: {selectedItem.sku}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1 text-text-tertiary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Product Details Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-bg-tertiary rounded-xl p-4">
                  <p className="text-xs text-text-tertiary">Category</p>
                  <p className="text-sm font-medium text-text-primary mt-1">{selectedItem.category}</p>
                </div>
                <div className="bg-bg-tertiary rounded-xl p-4">
                  <p className="text-xs text-text-tertiary">Sub-Category</p>
                  <p className="text-sm font-medium text-text-primary mt-1">{selectedItem.subCategory || '-'}</p>
                </div>
                <div className="bg-bg-tertiary rounded-xl p-4">
                  <p className="text-xs text-text-tertiary">Unit</p>
                  <p className="text-sm font-medium text-text-primary mt-1">{selectedItem.unit}</p>
                </div>
                <div className="bg-bg-tertiary rounded-xl p-4">
                  <p className="text-xs text-text-tertiary">Location</p>
                  <p className="text-sm font-medium text-text-primary mt-1">{selectedItem.location}</p>
                </div>
              </div>

              {/* Stock Information */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-bg-tertiary rounded-xl p-4">
                  <p className="text-xs text-text-tertiary">Unit Cost</p>
                  <p className="text-lg font-semibold text-text-primary mt-1">{formatCurrency(selectedItem.unitCost)}</p>
                </div>
                <div className="bg-bg-tertiary rounded-xl p-4">
                  <p className="text-xs text-text-tertiary">Opening Stock</p>
                  <p className="text-lg font-semibold text-text-primary mt-1">{selectedItem.openingStock}</p>
                  <p className="text-xs text-text-tertiary">{formatDate(selectedItem.openingStockDate)}</p>
                </div>
                <div className="bg-bg-tertiary rounded-xl p-4">
                  <p className="text-xs text-text-tertiary">Current Stock</p>
                  <p className={cn(
                    'text-lg font-semibold mt-1',
                    selectedItem.quantity === 0 ? 'text-error' : 
                    selectedItem.quantity <= selectedItem.minStock ? 'text-warning' : 'text-success'
                  )}>
                    {selectedItem.quantity}
                  </p>
                </div>
                <div className="bg-bg-tertiary rounded-xl p-4">
                  <p className="text-xs text-text-tertiary">Min Stock</p>
                  <p className="text-lg font-semibold text-text-primary mt-1">{selectedItem.minStock}</p>
                </div>
              </div>

              {/* Stock Update Button */}
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  openTransactionModal(selectedItem.id);
                }}
                className="w-full flex items-center justify-center gap-2 p-3 bg-accent/10 hover:bg-accent/20 rounded-xl transition-colors text-accent"
              >
                <RefreshCw className="w-4 h-4" />
                Update Stock
              </button>

              {/* History Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-text-primary">Transaction History</h3>
                  <span className="text-xs text-text-tertiary">{selectedItem.history.length} transactions</span>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedItem.history.length === 0 ? (
                    <p className="text-sm text-text-tertiary text-center py-4">No transactions recorded</p>
                  ) : (
                    [...selectedItem.history].reverse().map((transaction) => {
                      const config = transactionConfig[transaction.type];
                      const Icon = config.icon;
                      return (
                        <div key={transaction.id} className="flex items-start gap-3 p-3 bg-bg-tertiary rounded-xl">
                          <div className={cn('p-2 rounded-lg', config.bg)}>
                            <Icon className={cn('w-4 h-4', config.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-text-primary">
                                {config.label} - {transaction.type === 'adjustment' ? 
                                  `Adjusted to ${transaction.newBalance}` :
                                  `${transaction.quantity} ${selectedItem.unit}`
                                }
                              </p>
                              <span className="text-xs text-text-tertiary">
                                {formatDate(transaction.date)} {formatTime(transaction.date)}
                              </span>
                            </div>
                            {transaction.note && (
                              <p className="text-xs text-text-secondary mt-0.5">{transaction.note}</p>
                            )}
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-text-tertiary">
                                Balance: {transaction.previousBalance} → {transaction.newBalance}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransactionModal && transactionItemId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-bg-secondary border border-border rounded-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-text-primary">Update Stock</h2>
              <button
                onClick={() => {
                  setShowTransactionModal(false);
                  setTransactionItemId(null);
                }}
                className="p-1 text-text-tertiary hover:text-text-primary hover:bg-bg-hover rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransactionSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Transaction Type *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['addition', 'deduction', 'adjustment'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTransactionData(prev => ({ ...prev, type: type as any }))}
                      className={cn(
                        'px-3 py-2 text-sm rounded-xl transition-colors capitalize',
                        transactionData.type === type
                          ? 'bg-accent text-white'
                          : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover'
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  {transactionData.type === 'adjustment' ? 'New Quantity *' : 'Quantity *'}
                </label>
                <input
                  type="number"
                  value={transactionData.quantity}
                  onChange={(e) => setTransactionData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                  min="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  value={transactionData.note}
                  onChange={(e) => setTransactionData(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="e.g., Received from supplier, Damaged items..."
                  className="w-full px-3 py-2.5 bg-bg-tertiary border border-border rounded-xl text-text-primary placeholder-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setShowTransactionModal(false);
                    setTransactionItemId(null);
                  }}
                  className="px-4 py-2 text-sm text-text-secondary bg-bg-tertiary hover:bg-bg-hover rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-accent hover:bg-accent-hover rounded-xl transition-colors"
                >
                  Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}