// src/app/api/inventory/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Types
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

// Mock database
let inventoryItems: InventoryItem[] = [
  { 
    id: '1', 
    name: 'Brass Faucet - Chrome', 
    sku: 'BF-001', 
    category: 'Faucets',
    subCategory: 'Kitchen Faucets',
    unit: 'Pcs',
    unitCost: 1800,
    openingStock: 100,
    openingStockDate: '2026-06-01',
    quantity: 150, 
    minStock: 20,
    price: 2499, 
    cost: 1800,
    location: 'Warehouse A',
    status: 'In Stock',
    history: [
      { id: 'h1', type: 'addition', quantity: 50, previousBalance: 100, newBalance: 150, note: 'Initial stock', date: '2026-06-20T10:00:00Z' },
    ],
    createdAt: '2026-06-20T10:00:00Z',
    updatedAt: '2026-06-28T14:30:00Z'
  },
  { 
    id: '2', 
    name: 'Shower Head - Rain', 
    sku: 'SH-002', 
    category: 'Showers',
    subCategory: 'Rain Showers',
    unit: 'Pcs',
    unitCost: 550,
    openingStock: 30,
    openingStockDate: '2026-06-15',
    quantity: 0, 
    minStock: 10,
    price: 899, 
    cost: 550,
    location: 'Warehouse B',
    status: 'Out of Stock',
    history: [
      { id: 'h4', type: 'addition', quantity: 30, previousBalance: 0, newBalance: 30, note: 'Initial stock', date: '2026-06-18T09:00:00Z' },
      { id: 'h5', type: 'deduction', quantity: 30, previousBalance: 30, newBalance: 0, note: 'Order #5678', date: '2026-06-25T11:20:00Z' },
    ],
    createdAt: '2026-06-18T09:00:00Z',
    updatedAt: '2026-06-25T11:20:00Z'
  },
  { 
    id: '3', 
    name: 'Bathroom Sink - Modern', 
    sku: 'BS-003', 
    category: 'Sinks',
    subCategory: 'Bathroom Sinks',
    unit: 'Pcs',
    unitCost: 2400,
    openingStock: 40,
    openingStockDate: '2026-06-10',
    quantity: 23, 
    minStock: 15,
    price: 3499, 
    cost: 2400,
    location: 'Warehouse A',
    status: 'Low Stock',
    history: [
      { id: 'h6', type: 'addition', quantity: 40, previousBalance: 0, newBalance: 40, note: 'Initial stock', date: '2026-06-15T08:30:00Z' },
      { id: 'h7', type: 'deduction', quantity: 17, previousBalance: 40, newBalance: 23, note: 'Order #9012', date: '2026-06-28T09:15:00Z' },
    ],
    createdAt: '2026-06-15T08:30:00Z',
    updatedAt: '2026-06-28T09:15:00Z'
  },
  { 
    id: '4', 
    name: 'Toilet - Dual Flush', 
    sku: 'TO-004', 
    category: 'Toilets',
    subCategory: 'Dual Flush',
    unit: 'Pcs',
    unitCost: 3500,
    openingStock: 60,
    openingStockDate: '2026-06-05',
    quantity: 45, 
    minStock: 10,
    price: 4999, 
    cost: 3500,
    location: 'Warehouse C',
    status: 'In Stock',
    history: [
      { id: 'h8', type: 'addition', quantity: 60, previousBalance: 0, newBalance: 60, note: 'Initial stock', date: '2026-06-10T11:00:00Z' },
      { id: 'h9', type: 'deduction', quantity: 15, previousBalance: 60, newBalance: 45, note: 'Order #3456', date: '2026-06-27T16:45:00Z' },
    ],
    createdAt: '2026-06-10T11:00:00Z',
    updatedAt: '2026-06-27T16:45:00Z'
  },
];

// Validation schemas
const inventorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  category: z.string().min(1, 'Category is required'),
  subCategory: z.string().optional(),
  unit: z.string().min(1, 'Unit is required'),
  unitCost: z.number().positive('Unit cost must be positive'),
  openingStock: z.number().int().min(0, 'Opening stock must be 0 or more'),
  openingStockDate: z.string().min(1, 'Opening stock date is required'),
  minStock: z.number().int().min(0, 'Minimum stock must be 0 or more'),
  location: z.string().min(1, 'Location is required'),
});

const transactionSchema = z.object({
  type: z.enum(['addition', 'deduction', 'adjustment']),
  quantity: z.number().int().positive('Quantity must be positive'),
  note: z.string().optional(),
});

// GET - Fetch inventory items
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const subCategory = searchParams.get('subCategory') || '';
    const status = searchParams.get('status') || '';
    const id = searchParams.get('id');

    // Get single item
    if (id) {
      const item = inventoryItems.find(item => item.id === id);
      if (!item) {
        return NextResponse.json(
          { error: 'Item not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ data: item });
    }

    // Filter items
    let filteredItems = [...inventoryItems];

    if (search) {
      const searchLower = search.toLowerCase();
      filteredItems = filteredItems.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        item.sku.toLowerCase().includes(searchLower)
      );
    }

    if (category) {
      filteredItems = filteredItems.filter(item => item.category === category);
    }

    if (subCategory) {
      filteredItems = filteredItems.filter(item => item.subCategory === subCategory);
    }

    if (status) {
      filteredItems = filteredItems.filter(item => item.status === status);
    }

    const total = filteredItems.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedItems = filteredItems.slice(start, end);

    return NextResponse.json({
      data: paginatedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      filters: { search, category, subCategory, status },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

// POST - Create new inventory item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = inventorySchema.parse(body);

    const newItem: InventoryItem = {
      id: Date.now().toString(),
      ...validatedData,
      subCategory: validatedData.subCategory || '',
      quantity: validatedData.openingStock,
      price: validatedData.unitCost * 1.4, // Auto-calculate price (40% markup)
      cost: validatedData.unitCost,
      status: validatedData.openingStock === 0 ? 'Out of Stock' :
              validatedData.openingStock <= validatedData.minStock ? 'Low Stock' : 'In Stock',
      history: [
        {
          id: `h${Date.now()}`,
          type: 'addition',
          quantity: validatedData.openingStock,
          previousBalance: 0,
          newBalance: validatedData.openingStock,
          note: 'Opening stock',
          date: new Date().toISOString(),
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    inventoryItems.push(newItem);

    return NextResponse.json({
      message: 'Inventory item created successfully',
      data: newItem,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create inventory item' },
      { status: 500 }
    );
  }
}

// PUT - Update inventory item
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, updateType, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const itemIndex = inventoryItems.findIndex(item => item.id === id);
    if (itemIndex === -1) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    const currentItem = inventoryItems[itemIndex];
    let newQuantity = currentItem.quantity;
    let transactionNote = '';

    // Handle quantity updates with history tracking
    if (updateType === 'addition' || updateType === 'deduction' || updateType === 'adjustment') {
      const transactionData = transactionSchema.parse({
        type: updateType,
        quantity: updateData.quantityChange || 0,
        note: updateData.note || '',
      });

      const previousBalance = currentItem.quantity;
      
      if (updateType === 'addition') {
        newQuantity = previousBalance + transactionData.quantity;
        transactionNote = transactionData.note || 'Stock addition';
      } else if (updateType === 'deduction') {
        newQuantity = Math.max(0, previousBalance - transactionData.quantity);
        transactionNote = transactionData.note || 'Stock deduction';
      } else {
        newQuantity = transactionData.quantity;
        transactionNote = transactionData.note || 'Stock adjustment';
      }

      // Add to history
      const newTransaction: Transaction = {
        id: `h${Date.now()}`,
        type: updateType,
        quantity: updateType === 'adjustment' ? newQuantity - previousBalance : transactionData.quantity,
        previousBalance,
        newBalance: newQuantity,
        note: transactionNote,
        date: new Date().toISOString(),
      };

      currentItem.history.push(newTransaction);
    } else {
      // Update other fields
      const validatedData = inventorySchema.partial().parse(updateData);
      Object.assign(currentItem, validatedData);
      if (validatedData.openingStock !== undefined) {
        newQuantity = validatedData.openingStock;
      }
    }

    // Update status based on new quantity
    const itemStatus: 'In Stock' | 'Low Stock' | 'Out of Stock' = newQuantity === 0 ? 'Out of Stock' :
                       newQuantity <= currentItem.minStock ? 'Low Stock' : 'In Stock';

    const updatedItem = {
      ...currentItem,
      quantity: newQuantity,
      status: itemStatus,
      updatedAt: new Date().toISOString(),
    };

    inventoryItems[itemIndex] = updatedItem;

    return NextResponse.json({
      message: 'Inventory item updated successfully',
      data: updatedItem,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update inventory item' },
      { status: 500 }
    );
  }
}

// DELETE - Delete inventory item
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const itemIndex = inventoryItems.findIndex(item => item.id === id);
    if (itemIndex === -1) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    const deletedItem = inventoryItems[itemIndex];
    inventoryItems.splice(itemIndex, 1);

    return NextResponse.json({
      message: 'Inventory item deleted successfully',
      data: deletedItem,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete inventory item' },
      { status: 500 }
    );
  }
}