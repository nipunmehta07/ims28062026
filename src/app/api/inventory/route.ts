// src/app/api/inventory/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

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
  description: z.string().optional(),
});

const transactionSchema = z.object({
  type: z.enum(['addition', 'deduction', 'adjustment']),
  quantity: z.number().int().positive('Quantity must be positive'),
  note: z.string().optional(),
});

// Helper: Map Database Prisma Item model to Frontend expected InventoryItem type
function mapPrismaItemToFrontend(item: any): InventoryItem {
  const transactions = item.transactions || [];
  const firstTx = transactions.find((t: any) => t.reason.startsWith('Opening stock') || t.reason.startsWith('Initial'));
  const openingStock = firstTx ? firstTx.changeQty : 0;
  const openingStockDate = firstTx ? firstTx.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];

  const status: 'In Stock' | 'Low Stock' | 'Out of Stock' = 
    item.quantityOnHand === 0 ? 'Out of Stock' :
    item.quantityOnHand <= (item.minStock || 0) ? 'Low Stock' : 'In Stock';

  const history: Transaction[] = transactions.map((t: any) => {
    let type: 'addition' | 'deduction' | 'adjustment' = 'adjustment';
    if (t.changeQty > 0) {
      type = 'addition';
    } else if (t.changeQty < 0) {
      type = 'deduction';
    }
    return {
      id: t.id,
      type,
      quantity: Math.abs(t.changeQty),
      previousBalance: t.newTotalQty - t.changeQty,
      newBalance: t.newTotalQty,
      note: t.reason,
      date: t.createdAt.toISOString()
    };
  });

  // Sort history newest first
  history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Use oldest transaction date as createdAt fallback, and newest transaction as updatedAt fallback
  const oldestTxDate = transactions.length > 0 ? transactions[transactions.length - 1].createdAt.toISOString() : new Date().toISOString();
  const newestTxDate = transactions.length > 0 ? transactions[0].createdAt.toISOString() : new Date().toISOString();

  return {
    id: item.id,
    name: item.name,
    sku: item.sku,
    category: item.category,
    subCategory: item.subCategory || '',
    unit: item.unit,
    unitCost: item.unitCost,
    openingStock: item.openingStock || openingStock,
    openingStockDate: item.openingStockDate || openingStockDate,
    quantity: item.quantityOnHand,
    minStock: item.minStock || 5,
    price: item.unitCost * 1.4,
    cost: item.unitCost,
    location: item.location || 'Warehouse A',
    status,
    history,
    createdAt: oldestTxDate,
    updatedAt: newestTxDate
  };
}

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
      const item = await prisma.item.findUnique({
        where: { id },
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });
      if (!item) {
        return NextResponse.json(
          { error: 'Item not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ data: mapPrismaItemToFrontend(item) });
    }

    let items: any[] = [];
    let total = 0;

    if (status === 'Out of Stock' || status === 'Low Stock' || status === 'In Stock' || category || search) {
      // Build conditions array for Raw SQL
      const conditions: string[] = [];
      
      if (search) {
        conditions.push(`("name" ILIKE '%${search}%' OR "sku" ILIKE '%${search}%')`);
      }
      if (category) {
        conditions.push(`"category" = '${category}'`);
      }
      if (status === 'Out of Stock') {
        conditions.push(`"quantityOnHand" = 0`);
      } else if (status === 'Low Stock') {
        conditions.push(`"quantityOnHand" > 0 AND "quantityOnHand" <= "minStock" AND "minStock" > 0`);
      } else if (status === 'In Stock') {
        conditions.push(`("quantityOnHand" > "minStock" OR "minStock" = 0) AND "quantityOnHand" > 0`);
      }

      const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

      // Query total counts first
      const countResult: any[] = await prisma.$queryRawUnsafe(`
        SELECT COUNT(*)::int as count FROM "item" ${whereClause}
      `);
      total = countResult[0]?.count || 0;

      // Query paginated data
      items = await prisma.$queryRawUnsafe(`
        SELECT * FROM "item"
        ${whereClause}
        ORDER BY "name" ASC
        LIMIT ${limit} OFFSET ${(page - 1) * limit}
      `);

      // Populate relations (transactions)
      const itemIds = items.map(i => i.id);
      const allTransactions = itemIds.length > 0 
        ? await prisma.inventoryTransaction.findMany({
            where: { itemId: { in: itemIds } },
            orderBy: { createdAt: 'desc' }
          })
        : [];

      items = items.map(item => ({
        ...item,
        transactions: allTransactions.filter(t => t.itemId === item.id)
      }));

    } else {
      // Standard query path (no complex relational status filters)
      const where: any = {};
      total = await prisma.item.count({ where });
      items = await prisma.item.findMany({
        where,
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      });
    }

    const mappedItems = items.map(mapPrismaItemToFrontend);

    // Compute unpaginated total metrics
    const allDbItems = await prisma.item.findMany({
      select: { quantityOnHand: true, unitCost: true, minStock: true }
    });
    const computedTotalValue = allDbItems.reduce((sum, item) => sum + (item.unitCost * item.quantityOnHand), 0);
    const computedLowStock = allDbItems.filter(item => item.quantityOnHand > 0 && item.quantityOnHand <= item.minStock).length;
    const computedOutOfStock = allDbItems.filter(item => item.quantityOnHand === 0).length;

    return NextResponse.json({
      data: mappedItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      metrics: {
        totalValue: computedTotalValue,
        lowStockCount: computedLowStock,
        outOfStockCount: computedOutOfStock
      },
      filters: { search, category, subCategory, status },
    });
  } catch (error) {
    console.error('GET inventory database fetch error:', error);
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

    const newItem = await prisma.$transaction(async (tx) => {
      // Unique SKU validation
      const existing = await tx.item.findUnique({
        where: { sku: validatedData.sku }
      });
      if (existing) {
        throw new Error('An item with this SKU already exists');
      }

      const item = await tx.item.create({
        data: {
          name: validatedData.name,
          sku: validatedData.sku,
          category: validatedData.category,
          subCategory: validatedData.subCategory || '',
          unit: validatedData.unit,
          unitCost: validatedData.unitCost,
          quantityOnHand: validatedData.openingStock,
          minStock: validatedData.minStock || 0,
          location: validatedData.location || '',
          description: validatedData.description || '',
          openingStock: validatedData.openingStock,
          openingStockDate: validatedData.openingStockDate,
        }
      });

      if (validatedData.openingStock > 0) {
        await tx.inventoryTransaction.create({
          data: {
            itemId: item.id,
            changeQty: validatedData.openingStock,
            newTotalQty: validatedData.openingStock,
            reason: 'Opening stock',
            createdAt: new Date(validatedData.openingStockDate)
          }
        });
      }

      return item;
    });

    const fullItem = await prisma.item.findUnique({
      where: { id: newItem.id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return NextResponse.json({
      message: 'Inventory item created successfully',
      data: mapPrismaItemToFrontend(fullItem),
    }, { status: 201 });
  } catch (error: any) {
    console.error('POST inventory database write error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create inventory item' },
      { status: 500 }
    );
  }
}

// PUT - Update inventory item details or adjust stock levels
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const searchId = searchParams.get('id');
    const body = await request.json();
    const { id: bodyId, updateType, ...updateData } = body;
    const id = bodyId || searchId;

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const currentItem = await prisma.item.findUnique({
      where: { id },
      include: { transactions: true }
    });

    if (!currentItem) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    let finalItem;

    if (updateType === 'addition' || updateType === 'deduction' || updateType === 'adjustment') {
      const transactionData = transactionSchema.parse({
        type: updateType,
        quantity: updateData.quantity || updateData.quantityChange || 0,
        note: updateData.note || '',
      });

      const previousBalance = currentItem.quantityOnHand;
      let newQuantity = previousBalance;
      let transactionNote = '';
      let changeQty = 0;

      if (updateType === 'addition') {
        newQuantity = previousBalance + transactionData.quantity;
        transactionNote = transactionData.note || 'Stock addition';
        changeQty = transactionData.quantity;
      } else if (updateType === 'deduction') {
        newQuantity = Math.max(0, previousBalance - transactionData.quantity);
        transactionNote = transactionData.note || 'Stock deduction';
        changeQty = newQuantity - previousBalance;
      } else {
        newQuantity = transactionData.quantity;
        transactionNote = transactionData.note || 'Stock adjustment';
        changeQty = newQuantity - previousBalance;
      }

      finalItem = await prisma.$transaction(async (tx) => {
        const item = await tx.item.update({
          where: { id },
          data: { quantityOnHand: newQuantity }
        });

        await tx.inventoryTransaction.create({
          data: {
            itemId: id,
            changeQty,
            newTotalQty: newQuantity,
            reason: transactionNote,
          }
        });

        return item;
      });
    } else {
      // General field update
      const validatedData = inventorySchema.partial().parse(updateData);
      const updatePayload: any = {
        name: validatedData.name,
        sku: validatedData.sku,
        category: validatedData.category,
        subCategory: validatedData.subCategory,
        unit: validatedData.unit,
        unitCost: validatedData.unitCost,
        minStock: validatedData.minStock,
        location: validatedData.location,
        description: validatedData.description,
        openingStockDate: validatedData.openingStockDate,
      };

      if (validatedData.openingStock !== undefined) {
        updatePayload.quantityOnHand = validatedData.openingStock;
        updatePayload.openingStock = validatedData.openingStock;
      }

      // Clean undefined keys
      Object.keys(updatePayload).forEach(key => updatePayload[key] === undefined && delete updatePayload[key]);

      finalItem = await prisma.$transaction(async (tx) => {
        const item = await tx.item.update({
          where: { id },
          data: updatePayload
        });

        if (validatedData.openingStock !== undefined && validatedData.openingStock !== currentItem.quantityOnHand) {
          await tx.inventoryTransaction.create({
            data: {
              itemId: id,
              changeQty: validatedData.openingStock - currentItem.quantityOnHand,
              newTotalQty: validatedData.openingStock,
              reason: 'Opening stock adjustment',
            }
          });
        }
        return item;
      });
    }

    const fullUpdatedItem = await prisma.item.findUnique({
      where: { id: finalItem.id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return NextResponse.json({
      message: 'Inventory item updated successfully',
      data: mapPrismaItemToFrontend(fullUpdatedItem),
    });
  } catch (error: any) {
    console.error('PUT inventory database write error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to update inventory item' },
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

    const item = await prisma.item.findUnique({
      where: { id },
      include: { transactions: true }
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    await prisma.item.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Inventory item deleted successfully',
      data: mapPrismaItemToFrontend(item),
    });
  } catch (error) {
    console.error('DELETE inventory error:', error);
    return NextResponse.json(
      { error: 'Failed to delete inventory item' },
      { status: 500 }
    );
  }
}