"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { DataTable, type DataTableColumn, type DataTablePagination } from "@/app/components/composite/DataTable";
import { ConfirmDialog } from "@/app/components/composite/ConfirmDialog";
import { ProductModal } from "./components/ProductModal";
import { ImportModal } from "./components/ImportModal";
import {
  Button,
  Badge,
  Card,
  EmptyState,
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
  Dropdown,
} from "@/app/components/ui";
import { PageHeader } from "@/app/components/composite/PageHeader";
import { getInventory, deleteItemAction } from "@/app/actions";
import toast from "react-hot-toast";
import {
  Plus,
  Download,
  Upload,
  Trash2,
  Edit,
  Package,
  TrendingDown,
  Boxes,
  DollarSign,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantityOnHand: number;
  unit: string;
  unitCost: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface BulkActionResult {
  success: number;
  failed: number;
}

const CATEGORY_OPTIONS = [
  { value: "Raw Material", label: "Raw Material" },
  { value: "Component", label: "Component" },
  { value: "Finished Good", label: "Finished Good" },
  { value: "Packaging", label: "Packaging" },
];

export default function ProductsPage() {
  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selection state
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

  // Modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Confirmation dialogs
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    productId: string | null;
    productName: string;
  }>({ isOpen: false, productId: null, productName: "" });

  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkCategoryConfirm, setBulkCategoryConfirm] = useState(false);
  const [bulkCategoryValue, setBulkCategoryValue] = useState("");

  // Fetch products
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getInventory();
      setProducts(data as Product[]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch products";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let result = products;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      );
    }

    if (selectedCategory) {
      result = result.filter((p) => p.category === selectedCategory);
    }

    return result;
  }, [products, searchQuery, selectedCategory]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredProducts.slice(start, end);
  }, [filteredProducts, currentPage, pageSize]);

  // Update pagination when filters change
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  // Stats
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalValue = products.reduce((acc, p) => acc + p.quantityOnHand * p.unitCost, 0);
    const lowStockCount = products.filter((p) => p.quantityOnHand < 5).length;
    const outOfStockCount = products.filter((p) => p.quantityOnHand === 0).length;

    return {
      totalProducts,
      totalValue,
      lowStockCount,
      outOfStockCount,
    };
  }, [products]);

  // Handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsEditMode(true);
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!deleteConfirm.productId) return;

    try {
      await deleteItemAction(deleteConfirm.productId);
      toast.success("Product deleted successfully!");
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete product");
    } finally {
      setDeleteConfirm({ isOpen: false, productId: null, productName: "" });
    }
  };

  const handleBulkDelete = async () => {
    const selectedProducts = selectedRows.map((idx) => filteredProducts[idx]);
    let successCount = 0;
    let failCount = 0;

    for (const product of selectedProducts) {
      try {
        await deleteItemAction(product.id);
        successCount++;
      } catch {
        failCount++;
      }
    }

    toast.success(`Deleted ${successCount} product(s)${failCount > 0 ? `, ${failCount} failed` : ""}`);
    setSelectedRows([]);
    fetchProducts();
    setBulkDeleteConfirm(false);
  };

  const handleBulkCategoryChange = async () => {
    if (!bulkCategoryValue) return;

    const selectedProducts = selectedRows.map((idx) => filteredProducts[idx]);
    let successCount = 0;
    let failCount = 0;

    for (const product of selectedProducts) {
      try {
        // Using updateItemAction to change category
        const { updateItemAction } = await import("@/app/actions");
        await updateItemAction(product.id, {
          name: product.name,
          sku: product.sku,
          category: bulkCategoryValue,
          unit: product.unit,
          unitCost: product.unitCost,
        });
        successCount++;
      } catch {
        failCount++;
      }
    }

    toast.success(`Updated ${successCount} product(s)${failCount > 0 ? `, ${failCount} failed` : ""}`);
    setSelectedRows([]);
    fetchProducts();
    setBulkCategoryConfirm(false);
    setBulkCategoryValue("");
  };

  const handleExportSelected = () => {
    const selectedProducts = selectedRows.map((idx) => filteredProducts[idx]);
    const headers = ["name", "sku", "category", "quantityOnHand", "unit", "unitCost"];
    const csvContent = [
      headers.join(","),
      ...selectedProducts.map((p) =>
        headers.map((h) => JSON.stringify(p[h as keyof Product] ?? "")).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "selected-products.csv";
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${selectedProducts.length} products`);
  };

  const handleProductSuccess = () => {
    fetchProducts();
    setIsProductModalOpen(false);
    setEditingProduct(null);
    setIsEditMode(false);
  };

  // Column definitions
  const columns: DataTableColumn<Product>[] = [
    {
      key: "name",
      header: "Name",
      accessor: (row) => row.name,
      sortable: true,
      searchable: true,
      width: "25%",
    },
    {
      key: "sku",
      header: "SKU",
      accessor: (row) => (
        <span className="font-mono text-[11px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md">
          {row.sku}
        </span>
      ),
      sortable: true,
      searchable: true,
      width: "15%",
    },
    {
      key: "category",
      header: "Category",
      accessor: (row) => (
        <Badge variant="default" size="sm">
          {row.category}
        </Badge>
      ),
      sortable: true,
      searchable: true,
      width: "15%",
    },
    {
      key: "quantityOnHand",
      header: "Stock",
      accessor: (row) => {
        const variant = row.quantityOnHand === 0
          ? "danger"
          : row.quantityOnHand < 5
            ? "warning"
            : "success";
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold">
              {row.quantityOnHand.toLocaleString()}
            </span>
            <Badge variant={variant} size="sm" dot>
              {row.quantityOnHand === 0 ? "Out" : row.quantityOnHand < 5 ? "Low" : "OK"}
            </Badge>
          </div>
        );
      },
      sortable: true,
      width: "15%",
    },
    {
      key: "unitCost",
      header: "Price",
      accessor: (row) => (
        <span className="font-mono text-[11px] font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          ₹{row.unitCost.toFixed(2)}
        </span>
      ),
      sortable: true,
      width: "10%",
    },
    {
      key: "actions",
      header: "Actions",
      accessor: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => handleEditProduct(row)}
            className="p-2 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400 transition-colors"
            title="Edit"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() =>
              setDeleteConfirm({
                isOpen: true,
                productId: row.id,
                productName: row.name,
              })
            }
            className="p-2 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
      align: "right",
      width: "10%",
      hidden: false,
    },
  ];

  const columnVisibilityOptions = [
    { key: "name", label: "Name" },
    { key: "sku", label: "SKU" },
    { key: "category", label: "Category" },
    { key: "quantityOnHand", label: "Stock" },
    { key: "unitCost", label: "Price" },
  ];

  const bulkActions = [
    {
      label: "Delete",
      icon: <Trash2 size={14} />,
      variant: "danger" as const,
      onClick: () => setBulkDeleteConfirm(true),
    },
    {
      label: "Change Category",
      icon: <Boxes size={14} />,
      variant: "secondary" as const,
      onClick: () => setBulkCategoryConfirm(true),
    },
    {
      label: "Export Selected",
      icon: <Download size={14} />,
      variant: "secondary" as const,
      onClick: handleExportSelected,
    },
  ];

  const pagination: DataTablePagination = {
    currentPage,
    totalPages: Math.ceil(filteredProducts.length / pageSize),
    pageSize,
    totalItems: filteredProducts.length,
  };

  // Responsive: Mobile card view detection
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-gray-50 dark:from-zinc-950 dark:via-emerald-950/10 dark:to-zinc-950">
      {/* Emerald mesh pattern overlay */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, emerald-500 1px, transparent 0)`,
        backgroundSize: '24px 24px'
      }} />
      
      <div className="relative">
        <PageHeader
          title="Products"
          description="Manage your product inventory, pricing, and stock levels."
          breadcrumb={[
            { label: "Dashboard", href: "/" },
            { label: "Products" },
          ]}
          size="md"
          actions={[
            {
              label: "Import CSV",
              icon: <Upload size={14} />,
              variant: "secondary",
              onClick: () => setIsImportModalOpen(true),
            },
            {
              label: "Add Product",
              icon: <Plus size={14} />,
              variant: "gradient",
              onClick: () => {
                setEditingProduct(null);
                setIsEditMode(false);
                setIsProductModalOpen(true);
              },
            },
          ]}
        />

        <div className="px-4 md:px-6 pb-8">
          {/* Stats Grid - Emerald Modern */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            <Card 
              variant="glass" 
              padding="md" 
              className="flex items-center gap-3 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl flex items-center justify-center">
                <Package size={18} className="text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  Total Products
                </p>
                <p className="text-lg font-black bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  {stats.totalProducts}
                </p>
              </div>
            </Card>

            <Card 
              variant="glass" 
              padding="md" 
              className="flex items-center gap-3 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 rounded-xl flex items-center justify-center">
                <DollarSign size={18} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  Inventory Value
                </p>
                <p className="text-lg font-black bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                  ₹{stats.totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </Card>

            <Card 
              variant="glass" 
              padding="md" 
              className="flex items-center gap-3 hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-orange-500/10 rounded-xl flex items-center justify-center">
                <TrendingDown size={18} className="text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  Low Stock
                </p>
                <p className="text-lg font-black bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
                  {stats.lowStockCount}
                </p>
              </div>
            </Card>

            <Card 
              variant="glass" 
              padding="md" 
              className="flex items-center gap-3 hover:scale-[1.02] hover:shadow-lg hover:shadow-rose-500/10 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-rose-500/20 to-red-500/10 rounded-xl flex items-center justify-center">
                <Package size={18} className="text-rose-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                  Out of Stock
                </p>
                <p className="text-lg font-black bg-gradient-to-r from-rose-600 to-red-500 bg-clip-text text-transparent">
                  {stats.outOfStockCount}
                </p>
              </div>
            </Card>
          </div>

          {/* Mobile: Card-based layout */}
          {isMobile && !isLoading && filteredProducts.length > 0 && (
            <div className="space-y-3 mb-6">
              {paginatedProducts.map((product) => (
                <Card key={product.id} variant="glass" padding="md" className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[12px] font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent truncate">
                        {product.name}
                      </h3>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">{product.sku}</p>
                    </div>
                    <Badge variant="default" size="sm">
                      {product.category}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                          Stock
                        </p>
                        <p className="text-[11px] font-bold">
                          {product.quantityOnHand.toLocaleString()} {product.unit}
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">
                          Price
                        </p>
                        <p className="text-[11px] font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">₹{product.unitCost.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="p-2 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() =>
                          setDeleteConfirm({
                            isOpen: true,
                            productId: product.id,
                            productName: product.name,
                          })
                        }
                        className="p-2 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Mobile: Pagination */}
          {isMobile && filteredProducts.length > pageSize && (
            <div className="flex items-center justify-center gap-2 mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-[10px] font-black text-emerald-600">
                {currentPage} / {Math.ceil(filteredProducts.length / pageSize)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= Math.ceil(filteredProducts.length / pageSize)}
              >
                Next
              </Button>
            </div>
          )}

          {/* Desktop: DataTable */}
          {!isMobile && (
            <Card variant="glass" padding="lg" className="relative overflow-hidden">
              {/* Emerald accent line at top */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
              <DataTable
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                columns={columns as any}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                data={paginatedProducts as any}
                pagination={pagination}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                searchable
                searchPlaceholder="Search products..."
                searchValue={searchQuery}
                onSearch={handleSearch}
                exportable
                exportOptions={[
                  { label: "Export CSV", format: "csv" as const, icon: <Download size={14} /> },
                  { label: "Export JSON", format: "json" as const, icon: <Download size={14} /> },
                ]}
                onExport={(format) => {
                  const data = filteredProducts as unknown as Record<string, unknown>[];
                  if (format === "csv") {
                    const headers = Object.keys(data[0] || {});
                    const csv = [headers.join(","), ...data.map((r) => headers.map((h) => JSON.stringify(r[h] ?? "")).join(","))].join("\n");
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "products.csv";
                    a.click();
                  } else {
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "products.json";
                    a.click();
                  }
                }}
                columnVisibility
                columnVisibilityOptions={columnVisibilityOptions}
                onColumnVisibilityChange={() => {}}
                bulkActions={bulkActions}
                selectedRows={selectedRows}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onSelectionChange={setSelectedRows as any}
                isLoading={isLoading}
                emptyMessage="No products found"
                compact
              />
            </Card>
          )}

          {/* Loading skeleton for mobile */}
          {isMobile && isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} variant="glass" padding="md" className="animate-pulse">
                  <div className="h-16 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 rounded" />
                </Card>
              ))}
            </div>
          )}

          {/* Empty state for mobile */}
          {isMobile && !isLoading && filteredProducts.length === 0 && (
            <EmptyState
              variant="no-data"
              title="No products found"
              description={searchQuery ? "Try adjusting your search" : "Add your first product to get started"}
              action={
                !searchQuery ? {
                  label: "Add Product",
                  onClick: () => {
                    setEditingProduct(null);
                    setIsEditMode(false);
                    setIsProductModalOpen(true);
                  },
                } : undefined
              }
            />
          )}
        </div>
      </div>

      {/* Product Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
          setIsEditMode(false);
        }}
        onSuccess={handleProductSuccess}
        initialData={editingProduct}
        mode={isEditMode ? "edit" : "create"}
      />

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleProductSuccess}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, productId: null, productName: "" })}
        title="Delete Product?"
        message={`Are you sure you want to delete "${deleteConfirm.productName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteProduct}
      />

      {/* Bulk Delete Confirmation */}
      <ConfirmDialog
        isOpen={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        title="Delete Selected Products?"
        message={`Are you sure you want to delete ${selectedRows.length} products? This action cannot be undone.`}
        confirmText="Delete All"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleBulkDelete}
      />

      {/* Bulk Category Change Modal */}
      <Modal
        isOpen={bulkCategoryConfirm}
        onClose={() => setBulkCategoryConfirm(false)}
        size="sm"
        showCloseButton
      >
        <ModalHeader>
          <ModalTitle>Change Category</ModalTitle>
          <ModalDescription>
            Select a new category for {selectedRows.length} selected products.
          </ModalDescription>
        </ModalHeader>
        <ModalContent className="space-y-4">
          <Dropdown
            options={CATEGORY_OPTIONS}
            value={bulkCategoryValue}
            onChange={(val) => setBulkCategoryValue(Array.isArray(val) ? val[0] : val)}
            placeholder="Select category"
          />
        </ModalContent>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setBulkCategoryConfirm(false)}>
            Cancel
          </Button>
          <Button
            variant="gradient"
            onClick={handleBulkCategoryChange}
            disabled={!bulkCategoryValue}
          >
            Apply to {selectedRows.length} Products
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}