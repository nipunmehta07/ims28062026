// src/app/inventory/page.tsx
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

// Sample data - replace with real data
const inventoryData = [
  { id: 1, name: 'Product A', sku: 'SKU-001', quantity: 150, price: 1299, status: 'In Stock' },
  { id: 2, name: 'Product B', sku: 'SKU-002', quantity: 0, price: 899, status: 'Out of Stock' },
  { id: 3, name: 'Product C', sku: 'SKU-003', quantity: 23, price: 2499, status: 'Low Stock' },
];

const columns = [
  { key: 'name' as const, header: 'Product', sortable: true },
  { key: 'sku' as const, header: 'SKU' },
  { key: 'quantity' as const, header: 'Quantity', sortable: true },
  { 
    key: 'price' as const, 
    header: 'Price', 
    render: (value: number) => `₹${value.toLocaleString()}` 
  },
  { 
    key: 'status' as const, 
    header: 'Status',
    render: (value: string) => {
      const variant = value === 'In Stock' ? 'success' : value === 'Low Stock' ? 'warning' : 'error';
      return <Badge variant={variant}>{value}</Badge>;
    }
  },
];

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Inventory</h1>
          <p className="text-text-secondary">Manage your products and stock levels</p>
        </div>
        <Button>
          Add Product
        </Button>
      </div>

      <DataTable 
        data={inventoryData} 
        columns={columns}
        onEdit={(row) => console.log('Edit', row)}
        onDelete={(row) => console.log('Delete', row)}
      />
    </div>
  );
}