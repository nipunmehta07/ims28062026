"use server"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { startOfDay, subDays, format } from "date-fns";
// ==========================================
// 1. MASTER INVENTORY
// ==========================================

export async function getInventory() {
  return await prisma.item.findMany({
    // Remove category filters here to ensure raw materials are available for the BOM check
    include: {
      boms: {
        include: {
          components: {
            include: { componentItem: true }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  });
}
export async function getItemHistory(itemId: string) {
  const logs = await prisma.inventoryTransaction.findMany({
    where: { itemId },
    orderBy: { createdAt: 'desc' }
  });
  return logs.map(l => ({ ...l, createdAt: l.createdAt.toISOString() }));
}
export async function stockInwardAction(data: { 
  itemId: string, 
  quantity: number, 
  reference: string, 
  date: string,
  notes?: string // Add this optional field
}) {
  const result = await prisma.$transaction(async (tx) => {
    const updatedItem = await tx.item.update({
      where: { id: data.itemId },
      data: { quantityOnHand: { increment: data.quantity } }
    });

    await tx.inventoryTransaction.create({
      data: {
        itemId: data.itemId,
        changeQty: data.quantity,
        newTotalQty: updatedItem.quantityOnHand,
        // We can append the notes to the reason or store it if your schema has a notes field
        reason: `Inward: ${data.reference}${data.notes ? ` (${data.notes})` : ''}`,
        createdAt: new Date(data.date)
      }
    });

    return updatedItem;
  });

  return result;
}
export async function addItemAction(data: { 
  name: string, sku: string, category: string, unit: string, unitCost: number, initialQty: number, openingStockDate: string
}) {
  try {
    const newItem = await prisma.$transaction(async (tx) => {
      const item = await tx.item.create({
        data: {
          name: data.name,
          sku: data.sku,
          category: data.category,
          unit: data.unit,
          unitCost: data.unitCost,
          quantityOnHand: data.initialQty,
        },
      });

      if (data.initialQty !== 0) {
        await tx.inventoryTransaction.create({
          data: {
            itemId: item.id,
            changeQty: data.initialQty,
            newTotalQty: data.initialQty,
            reason: "Initial Stock Entry",
			createdAt: new Date(data.openingStockDate) // <-- THIS INSERTS YOUR CUSTOM DATE
          },
        });
      }
      return item;
    });
    
    return newItem;
  } catch (error) {
    console.error("PRISMA ERROR:", error);
    throw new Error("Failed to register SKU. Check if SKU already exists.");
  }
}
export async function updateItemAction(itemId: string, data: { 
  name: string, sku: string, category: string, unit: string, unitCost: number 
}) {
  const updatedItem = await prisma.item.update({
    where: { id: itemId },
    data: {
      name: data.name,
      sku: data.sku,
      category: data.category,
      unit: data.unit,
      unitCost: data.unitCost,
      // Note: We intentionally do not update quantityOnHand here. 
      // Inventory levels should only change via production or sales transactions!
    }
  });

  return updatedItem;
}
export async function bulkAddItemsAction(items: any[]) {
  // Increase timeout to 30 seconds for larger CSV imports
  const result = await prisma.$transaction(async (tx) => {
    let addedCount = 0;
    
    for (const data of items) {
      const existing = await tx.item.findUnique({ where: { sku: data.sku } });
      if (!existing) {
        const item = await tx.item.create({
          data: {
            name: data.name,
            sku: data.sku,
            category: data.category,
            unit: data.unit,
            unitCost: data.unitCost,
            quantityOnHand: data.initialQty,
          },
        });

        if (data.initialQty !== 0) {
          await tx.inventoryTransaction.create({
            data: {
              itemId: item.id,
              changeQty: data.initialQty,
              newTotalQty: data.initialQty,
              reason: "Bulk CSV Import",
              // Directly use the ISO string passed from the frontend
              createdAt: new Date(data.openingStockDate),
            },
          });
        }
        addedCount++;
      }
    }
    return addedCount;
  }, {
    // CRITICAL: This is the missing piece. 
    // It gives the process 30 seconds instead of 5.
    timeout: 60000 
  });
}
export async function deleteItemAction(itemId: string) {
  // 1. SAFETY CHECK: Is this item used in any Assemblies or Orders?
  const isTargetBom = await prisma.bom.findFirst({ where: { itemId } });
  const isBomComponent = await prisma.bomComponent.findFirst({ where: { componentItemId: itemId } });
  const isInSalesOrder = await prisma.salesOrderItem.findFirst({ where: { itemId } });

  if (isTargetBom || isBomComponent) {
    throw new Error("Cannot delete: This item is currently used in an Assembly Recipe.");
  }
  if (isInSalesOrder) {
    throw new Error("Cannot delete: This item is part of an active Sales Order.");
  }

  // 2. Safe to delete. We must wipe its transaction history first to prevent orphan logs.
  await prisma.$transaction(async (tx) => {
    await tx.inventoryTransaction.deleteMany({ where: { itemId } });
    await tx.item.delete({ where: { id: itemId } });
  });

  
  return true;
}
export async function getInwardHistory() {
  const logs = await prisma.inventoryTransaction.findMany({
    where: {
      reason: { startsWith: 'Inward:' }
    },
    include: {
      item: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  return logs;
}
export async function updateInwardAction(transactionId: string, data: { 
  itemId: string, 
  quantity: number, 
  reference: string, 
  date: string,
  notes?: string 
}) {
  const result = await prisma.$transaction(async (tx) => {
    // 1. Get the old transaction to see what the previous quantity was
    const oldTx = await tx.inventoryTransaction.findUnique({ where: { id: transactionId } });
    if (!oldTx) throw new Error("Transaction not found");

    const itemIdChanged = oldTx.itemId !== data.itemId;
    let updatedItem;

    if (itemIdChanged) {
      // Item was changed: revert old item stock, add to new item stock
      await tx.item.update({
        where: { id: oldTx.itemId },
        data: { quantityOnHand: { decrement: oldTx.changeQty } }
      });
      updatedItem = await tx.item.update({
        where: { id: data.itemId },
        data: { quantityOnHand: { increment: data.quantity } }
      });
    } else {
      // Same item: adjust by difference
      const qtyDifference = data.quantity - oldTx.changeQty;
      updatedItem = await tx.item.update({
        where: { id: data.itemId },
        data: { quantityOnHand: { increment: qtyDifference } }
      });
    }

    // 3. Update the transaction record (including itemId if changed)
    return await tx.inventoryTransaction.update({
      where: { id: transactionId },
      data: {
        itemId: data.itemId,
        changeQty: data.quantity,
        newTotalQty: updatedItem.quantityOnHand,
        reason: `Inward: ${data.reference}${data.notes ? ` (${data.notes})` : ''}`,
        createdAt: new Date(data.date)
      }
    });
  });

  
  return result;
}

export async function deleteInwardAction(transactionId: string) {
  await prisma.$transaction(async (tx) => {
    // 1. Fetch the old transaction details
    const oldTx = await tx.inventoryTransaction.findUnique({ 
      where: { id: transactionId } 
    });
    
    if (!oldTx) throw new Error("Transaction record not found.");

    // 2. Revert the stock level (Decrease by the amount previously inwarded)
    await tx.item.update({
      where: { id: oldTx.itemId },
      data: { quantityOnHand: { decrement: oldTx.changeQty } }
    });

    // 3. Delete the specific transaction log from history
    await tx.inventoryTransaction.delete({ 
      where: { id: transactionId } 
    });
  });

  return true;
}
// ==========================================
// 2. BOM & PRODUCTION
// ==========================================

export async function getBoms() {
  return await prisma.bom.findMany({
    include: { item: true, components: { include: { componentItem: true } } },
    orderBy: { name: 'asc' }
  });
}

export async function createBomAction(data: { name: string, itemId: string, components: { itemId: string, quantity: number }[] }) {
  const newBom = await prisma.$transaction(async (tx) => {
    return await tx.bom.create({
      data: {
        name: data.name,
        itemId: data.itemId,
        revision: "v1.0",
        components: {
          create: data.components.map(c => ({
            componentItemId: c.itemId,
            quantity: c.quantity
          }))
        }
      }
    });
  });

  return newBom;
}

// NEW: Update an existing Assembly
export async function updateBomAction(bomId: string, data: { name: string, itemId: string, components: { itemId: string, quantity: number }[] }) {
  const result = await prisma.$transaction(async (tx) => {
    return await tx.bom.update({
      where: { id: bomId },
      data: {
        name: data.name,
        itemId: data.itemId,
        components: {
          deleteMany: {}, // Wipes the old recipe ingredients
          create: data.components.map(c => ({
            componentItemId: c.itemId,
            quantity: c.quantity
          }))
        }
      }
    });
  });
  
  return result;
}

// NEW: Delete an Assembly
export async function deleteBomAction(bomId: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Wipe out Production Logs 
    await tx.productionLog.deleteMany({
      where: { bomId: bomId }
    });

    // 2. Wipe out the components [cite: 4]
    await tx.bomComponent.deleteMany({
      where: { bomId: bomId }
    });

    // 3. Now delete the main BOM record [cite: 3]
    return await tx.bom.delete({
      where: { id: bomId }
    });
  }, { timeout: 30000 });
}
export async function produceBomAction(data: { 
  bomId: string, 
  quantityToBuild: number, 
  buildDate: string, 
  notes?: string 
}) {
  return await prisma.$transaction(async (tx) => {
    const bom = await tx.bom.findUnique({
      where: { id: data.bomId },
      include: { components: { include: { componentItem: true } } }
    });

    if (!bom) throw new Error("Assembly Recipe (BOM) not found.");

    // --- STEP 1: PRE-FLIGHT VALIDATION (Prevents Negative Stock) ---
    for (const component of bom.components) {
      const requiredQty = component.quantity * data.quantityToBuild;
      const currentStock = component.componentItem.quantityOnHand;

      if (currentStock < requiredQty) {
        // This error triggers a ROLLBACK, so no stock is changed
        throw new Error(
          `INSUFFICIENT STOCK: ${component.componentItem.name} needs ${requiredQty.toFixed(3)}, but only ${currentStock.toFixed(3)} is available.`
        );
      }
    }

    const customDate = new Date(data.buildDate);

    // --- STEP 2: DEDUCT COMPONENTS ---
    for (const component of bom.components) {
      const requiredQty = component.quantity * data.quantityToBuild;
      const updatedComponent = await tx.item.update({
        where: { id: component.componentItemId },
        data: { quantityOnHand: { decrement: requiredQty } }
      });

      await tx.inventoryTransaction.create({
        data: {
          itemId: component.componentItemId,
          changeQty: -requiredQty,
          newTotalQty: updatedComponent.quantityOnHand,
          reason: `Production: ${bom.name} (Build x${data.quantityToBuild})`,
          createdAt: customDate
        }
      });
    }

    // --- STEP 3: ADD FINISHED GOOD ---
    const updatedFG = await tx.item.update({
      where: { id: bom.itemId },
      data: { quantityOnHand: { increment: data.quantityToBuild } }
    });

    await tx.inventoryTransaction.create({
      data: {
        itemId: bom.itemId,
        changeQty: data.quantityToBuild,
        newTotalQty: updatedFG.quantityOnHand,
        reason: `Finished Production: ${bom.name}`,
        createdAt: customDate
      }
    });

    // --- STEP 4: CREATE HISTORY LOG ---
    await tx.productionLog.create({
      data: {
        bomId: bom.id,
        bomName: bom.name,
        finishedItemId: bom.itemId,
        quantityBuilt: data.quantityToBuild,
        notes: data.notes,
        createdAt: customDate
      }
    });

    return updatedFG;
  }, { timeout: 30000 }); // Handing potential Delhi network latency
}
export async function bulkAddBomsAction(boms: {
  name: string;
  targetSku: string;
  components: { sku: string; quantity: number }[];
}[]) {
  const result = await prisma.$transaction(async (tx) => {
    let addedCount = 0;

    for (const bomData of boms) {
      // 1. Find the finished product item in the database
      const targetItem = await tx.item.findUnique({ where: { sku: bomData.targetSku } });
      if (!targetItem) continue; // Skip if target SKU doesn't exist in inventory

      // 2. Prevent duplicate recipes for the same product
      const existingBom = await tx.bom.findFirst({ where: { itemId: targetItem.id } });
      if (existingBom) continue; 

      // 3. Find all component items and attach their IDs
      const resolvedComponents = [];
      for (const comp of bomData.components) {
        const compItem = await tx.item.findUnique({ where: { sku: comp.sku } });
        if (compItem) {
          resolvedComponents.push({
            componentItemId: compItem.id,
            quantity: comp.quantity
          });
        }
      }

      // 4. Create the BOM if valid components were found
      if (resolvedComponents.length > 0) {
        await tx.bom.create({
          data: {
            name: bomData.name,
            itemId: targetItem.id,
            revision: "v1.0",
            components: {
              create: resolvedComponents
            }
          }
        });
        addedCount++;
      }
    }
    return addedCount;
  });


  return result;
}

// ==========================================
// 3. DASHBOARD STATS
// ==========================================

export async function getDashboardStats() {
  const [activeOrdersCount, lowStockCount, revenueAggregate, inventoryItems] = await Promise.all([
    // 1. Get Active Orders count [cite: 7]
    prisma.salesOrder.count({ where: { status: "PENDING" } }),
    
    // 2. Get Low Stock count [cite: 2, 6]
    prisma.item.count({ where: { quantityOnHand: { lt: 5 } } }),
    
    // 3. Get Total Revenue sum [cite: 7]
    prisma.salesOrder.aggregate({ _sum: { totalAmount: true } }),
    
    // 4. Get the actual list of items to calculate value [cite: 2]
    prisma.item.findMany({ select: { quantityOnHand: true, unitCost: true } })
  ]);

  // FIX: Use 'inventoryItems' (the array) instead of 'items' (the count)
  const inventoryValue = inventoryItems.reduce(
    (acc, item) => acc + (item.quantityOnHand * item.unitCost), 0
  );

  return {
    activeOrders: activeOrdersCount,
    lowStock: lowStockCount,
    totalRevenue: revenueAggregate._sum.totalAmount || 0,
    inventoryValue: inventoryValue
  };
}
// ==========================================
// 4. SALES ORDER PIPELINE
// ==========================================

// src/app/actions.ts

export async function getSalesOrders() {
  return await prisma.salesOrder.findMany({
    include: { 
      items: { 
        include: { 
          item: { 
            include: { 
              // This is the critical part your UI needs
              boms: { 
                include: { 
                  components: { 
                    include: { componentItem: true } 
                  } 
                } 
              } 
            } 
          } 
        } 
      } 
    },
    orderBy: {
      orderDate: 'desc',
    },
  });
}

export async function createSalesOrderAction(data: { 
  customerName: string, 
  orderDate: string, 
  discountPercent: number,
  items: { itemId: string, quantity: number, salePrice: number }[] 
}) {
  const subtotal = data.items.reduce((sum, item) => sum + (item.quantity * item.salePrice), 0);
  const finalAmount = subtotal - ((subtotal * data.discountPercent) / 100);

  // LOGGING FOR DELHI DEBUGGING: Check your VS Code terminal for this output
  console.log(`NEW ORDER: Subtotal ₹${subtotal}, Final ₹${finalAmount}`);

  return await prisma.salesOrder.create({
    data: {
      customerName: data.customerName,
      orderDate: new Date(data.orderDate),
      totalAmount: finalAmount, // MUST populate this field
      discountPercent: data.discountPercent,
      items: {
        create: data.items.map(item => ({
          itemId: item.itemId,
          quantity: item.quantity,
          salePrice: item.salePrice
        }))
      }
    }
  });
}

export async function deleteOrderAction(orderId: string) {
  const order = await prisma.salesOrder.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");
  if (order.status === "FULFILLED") throw new Error("Cannot delete a fulfilled order.");

  await prisma.salesOrder.delete({ where: { id: orderId } });

  return true;
}

export async function updateSalesOrderAction(orderId: string, payload: any) {
  const { customerName, orderDate, totalAmount, discountPercent, items } = payload;

  return await prisma.salesOrder.update({
    where: { id: orderId },
    data: {
      customerName,
      orderDate: new Date(orderDate),
      totalAmount,       // Ensure this matches your schema 
      discountPercent,   // Ensure this matches your schema 
      
      // THE FIX: Clear old items and insert new ones
      items: {
        deleteMany: {}, // This wipes the old SalesOrderItems for this order 
        create: items.map((i: any) => ({
          itemId: i.itemId,
          quantity: i.quantity,
          salePrice: i.salePrice,
        })),
      },
    },
  });
}

// src/app/actions.ts

export async function fulfillOrderAction(
  orderId: string, 
  updatedQuantities: { orderItemId: string, newQuantity: number }[],
  fulfillmentDate: string // New parameter for custom dispatch date
) {
  const customDate = new Date(fulfillmentDate);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Fetch Order with deeply included BOM data
    const order = await tx.salesOrder.findUnique({ 
      where: { id: orderId }, 
      include: { 
        items: { 
          include: { 
            item: { 
              include: { 
                boms: { 
                  include: { components: { include: { componentItem: true } } } 
                } 
              } 
            } 
          } 
        } 
      } 
    });

    if (!order) throw new Error("Order not found");
    if (order.status === "FULFILLED") throw new Error("Order is already fulfilled");

    // 2. Handle quantity overrides if provided
    if (updatedQuantities && updatedQuantities.length > 0) {
      for (const uq of updatedQuantities) {
        await tx.salesOrderItem.update({ 
          where: { id: uq.orderItemId }, 
          data: { quantity: uq.newQuantity } 
        });
      }
    }

    // 3. Re-fetch final order state for processing
    const finalOrder = await tx.salesOrder.findUnique({
      where: { id: orderId },
      include: { items: { include: { item: { include: { boms: { include: { components: { include: { componentItem: true } } } } } } } } }
    });

    if (!finalOrder) throw new Error("Sync Error");

    // 4. Validate and Deduct
    for (const orderItem of finalOrder.items) {
      const requested = orderItem.quantity;
      const onHand = orderItem.item.quantityOnHand;

      // Tier 1: Fulfill from Finished Goods
      if (onHand >= requested) {
        const updatedItem = await tx.item.update({
          where: { id: orderItem.itemId },
          data: { quantityOnHand: { decrement: requested } }
        });
        // PASS CUSTOM DATE TO LOG
        await createLog(tx, orderItem.itemId, -requested, updatedItem.quantityOnHand, `Sale: ${finalOrder.customerName}`, customDate);
      } 
      
      // Tier 2: Build-to-Order using BOM
      else {
        const gap = requested - onHand;
        const activeBom = orderItem.item.boms[0]; 

        if (!activeBom) {
          throw new Error(`Insufficient Finished Stock for ${orderItem.item.name} and no Assembly Recipe found to build the remaining ${gap}.`);
        }

        for (const comp of activeBom.components) {
          const totalNeeded = comp.quantity * gap;
          if (comp.componentItem.quantityOnHand < totalNeeded) {
            throw new Error(`Short on Components: Need ${totalNeeded} ${comp.componentItem.unit} of ${comp.componentItem.name} to build ${gap} ${orderItem.item.name}.`);
          }

          const updatedComp = await tx.item.update({
            where: { id: comp.componentItemId },
            data: { quantityOnHand: { decrement: totalNeeded } }
          });
          // PASS CUSTOM DATE TO LOG
          await createLog(tx, comp.componentItemId, -totalNeeded, updatedComp.quantityOnHand, `Built ${gap} ${orderItem.item.name} for ${finalOrder.customerName}`, customDate);
        }

        if (onHand > 0) {
          await tx.item.update({ where: { id: orderItem.itemId }, data: { quantityOnHand: 0 } });
          // PASS CUSTOM DATE TO LOG
          await createLog(tx, orderItem.itemId, -onHand, 0, `Sale: ${finalOrder.customerName} (Stock cleared)`, customDate);
        }
      }
    }

    // 5. Final Status Update with Custom Date
    return await tx.salesOrder.update({
      where: { id: orderId },
      data: { 
        status: "FULFILLED",
        updatedAt: customDate // Syncs record to the dispatch date
      }
    });
  }, { timeout: 30000 }); // Increased timeout for heavy Delhi BOM calculations

  return result;
} 
// Helper for consistent transaction logging
async function createLog(
  tx: any, 
  itemId: string, 
  change: number, 
  total: number, 
  reason: string, 
  customDate?: Date
) {
  return await tx.inventoryTransaction.create({
    data: {
      itemId: itemId,
      changeQty: change,
      newTotalQty: total, // Map the 'total' parameter to the schema field
      reason: reason,
      // Only include createdAt if a custom dispatch date was provided
      ...(customDate && { createdAt: customDate }) 
    }
  });
}

export async function generateBackupData() {
  try {
    const [inventory, history, boms, bomComponents, salesOrders, salesOrderItems, productionLogs] = await Promise.all([
      prisma.item.findMany(),
      prisma.inventoryTransaction.findMany(),
      prisma.bom.findMany(),
      prisma.bomComponent.findMany(),
      prisma.salesOrder.findMany(),
      prisma.salesOrderItem.findMany(),
      prisma.productionLog.findMany() // ADD THIS LINE
    ]);

    const backupPayload = {
      timestamp: new Date().toISOString(),
      data: { 
        inventory, 
        history,
        boms,
        bomComponents,
        salesOrders,
        salesOrderItems,
        productionLogs // INCLUDE IN PAYLOAD
      }
    };

    return { success: true, payload: JSON.stringify(backupPayload, null, 2) };
  } catch (error: any) {
    return { success: false, error: "Backup failed: " + error.message };
  }
}
export async function factoryResetInstance() {
  try {
    // 1. Try Prisma's safe deletion first (This handles mapping automatically)
    // We execute these in a specific order to avoid Foreign Key conflicts
    await prisma.$transaction([
      prisma.inventoryTransaction.deleteMany(),
      prisma.item.deleteMany(),
    ]);

    return { success: true };
  } catch (error: any) {
    console.error("Standard Reset Failed, trying Force Wipe:", error.message);

    // 2. Fallback: If Prisma fails, use a "Nuclear" Raw SQL approach
    try {
      // This identifies tables regardless of Case Sensitivity (item vs Item)
      const tables: any[] = await prisma.$queryRaw`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename ILIKE ANY (ARRAY['item%', 'inward%', 'inventory%']);
      `;

      if (tables.length > 0) {
        const tableList = tables.map(t => `"${t.tablename}"`).join(", ");
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`);
        return { success: true };
      }
      
      throw new Error("No tables found to reset.");
    } catch (rawError: any) {
      return { 
        success: false, 
        error: `Sync Error: ${rawError.message || "Database is locked."}` 
      };
    }
  }
}
export async function restoreBackupData(backupJson: string) {
  try {
    const parsed = JSON.parse(backupJson);
    const { inventory, history, boms, bomComponents, salesOrders, salesOrderItems, productionLogs } = parsed.data;

    await prisma.$transaction(async (tx) => {
      // STEP 1: WIPE (Children first, Parents last)
      await tx.salesOrderItem.deleteMany();
      await tx.salesOrder.deleteMany();
      await tx.inventoryTransaction.deleteMany();
      await tx.productionLog.deleteMany(); // CLEAR EXISTING LOGS
      await tx.bomComponent.deleteMany();
      await tx.bom.deleteMany();
      await tx.item.deleteMany();

      // STEP 2: RESTORE PARENTS
      if (inventory?.length > 0) await tx.item.createMany({ data: inventory });
      if (boms?.length > 0) await tx.bom.createMany({ data: boms });

      // STEP 3: RESTORE CHILDREN
      if (bomComponents?.length > 0) await tx.bomComponent.createMany({ data: bomComponents });
      
      // RESTORE THE MISSING HISTORY
      if (productionLogs?.length > 0) {
        await tx.productionLog.createMany({ 
          data: productionLogs.map((log: any) => ({
            ...log,
            createdAt: new Date(log.createdAt) // Ensure date is parsed correctly
          })) 
        });
      }

      if (salesOrders?.length > 0) await tx.salesOrder.createMany({ data: salesOrders });
      if (salesOrderItems?.length > 0) await tx.salesOrderItem.createMany({ data: salesOrderItems });
      
      if (history?.length > 0) {
        await tx.inventoryTransaction.createMany({ 
          data: history.map((h: any) => ({ ...h, createdAt: new Date(h.createdAt) })) 
        });
      }
    }, { timeout: 90000 }); // High timeout for large datasets

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
export async function getWeeklyRevenue() {
  const sevenDaysAgo = startOfDay(subDays(new Date(), 7));

  // Fetch only FULFILLED orders from the last 7 days
  const orders = await prisma.salesOrder.findMany({
    where: {
      status: "FULFILLED",
      orderDate: { gte: sevenDaysAgo },
    },
    select: {
      orderDate: true,
      totalAmount: true,
    },
  });

  // Group by day of the week
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dayLabel = format(date, "eee");
    
    const dailyTotal = orders
      .filter(order => format(order.orderDate, "eee") === dayLabel)
      .reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    return { name: dayLabel, revenue: dailyTotal };
  });

  return chartData;
}

export async function getRevenueData(days?: number, startDate?: string, endDate?: string) {
  let whereClause: any = { status: "FULFILLED" }; // Only count completed sales

  if (startDate && endDate) {
    whereClause.orderDate = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  } else if (days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    whereClause.orderDate = { gte: cutoff };
  }

  const orders = await prisma.salesOrder.findMany({
    where: whereClause,
    select: { orderDate: true, totalAmount: true },
    orderBy: { orderDate: 'asc' },
  });

  // Group by date for the chart
  const grouped = orders.reduce((acc: any, order) => {
    const date = order.orderDate.toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + order.totalAmount;
    return acc;
  }, {});

  return Object.keys(grouped).map(date => ({
    date: new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    amount: grouped[date]
  }));
}
export async function getTopSellingStats(days?: number, startDate?: string, endDate?: string) {
  let whereClause: any = {};

  // Define the date filter based on preset or custom range
  if (startDate && endDate) {
    whereClause.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  } else if (days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    whereClause.createdAt = { gte: cutoff };
  }

  // 1. Group SalesOrderItems by itemId within the date range
  const topSellers = await prisma.salesOrderItem.groupBy({
    by: ['itemId'],
    where: {
      order: whereClause // Filters items based on the Parent Order's date
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 5,
  });

  const itemDetails = await prisma.item.findMany({
    where: { id: { in: topSellers.map(s => s.itemId) } },
    select: { id: true, name: true, sku: true, quantityOnHand: true, unit: true }
  });

  const topSellingSKUs = topSellers.map(seller => {
    const detail = itemDetails.find(d => d.id === seller.itemId);
    return { ...detail, totalSold: seller._sum.quantity };
  });

  // Keep the low stock alert logic consistent
  const highPriorityAlerts = topSellingSKUs.filter(item => (item.quantityOnHand || 0) < 10);

  return { topSellingSKUs, highPriorityAlerts };
}
// ==========================================
// 5. PURCHASE ORDERS (INBOUND)
// ==========================================

// Fetch the history of builds
export async function getProductionLogs() {
  return await prisma.productionLog.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      bom: {
        select: { name: true }
      }
    }
  });
}

// Reverse a build and restore original stock levels

export async function deleteProductionLogAction(logId: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Find the log and its recipe
    const log = await tx.productionLog.findUnique({
      where: { id: logId },
      include: { 
        bom: { 
          include: { components: true } 
        } 
      }
    });

    if (!log) throw new Error("Build record not found.");

    // 2. Reverse Stock: Subtract Finished Good
    await tx.item.update({
      where: { id: log.finishedItemId },
      data: { quantityOnHand: { decrement: log.quantityBuilt } }
    });

    // 3. Reverse Stock: Add back Components
    for (const comp of log.bom.components) {
      const amountToRestore = comp.quantity * log.quantityBuilt;
      await tx.item.update({
        where: { id: comp.componentItemId },
        data: { quantityOnHand: { increment: amountToRestore } }
      });
    }

    // 4. CLEANUP HISTORY: Delete the ledger transactions
    // This removes the "Production: Name" and "Finished Production" lines from history
    await tx.inventoryTransaction.deleteMany({
      where: {
        createdAt: log.createdAt, // Matches the exact timestamp of the build
        OR: [
          { reason: `Production: ${log.bomName}` },
          { reason: `Finished Production: ${log.bomName}` },
          { reason: { startsWith: `Production: ${log.bomName}` } }
        ]
      }
    });

    // 5. Delete the history log itself
    return await tx.productionLog.delete({ where: { id: logId } });
  }, { timeout: 30000 });
}
// returns
export async function processReturnAction(data: { 
  orderId: string, 
  itemId: string, 
  quantity: number, 
  reason: string,
  returnDate: string,
  disassemble: boolean // New flag for disassembly
}) {
  return await prisma.$transaction(async (tx) => {
    const customDate = new Date(data.returnDate);

    // Option A: Return and Disassemble
    if (data.disassemble) {
      const bom = await tx.bom.findFirst({
        where: { itemId: data.itemId },
        include: { components: true }
      });

      if (!bom) throw new Error("No Assembly Recipe found for this item to disassemble.");

      for (const comp of bom.components) {
        const amountToRestore = comp.quantity * data.quantity;
        const updatedComp = await tx.item.update({
          where: { id: comp.componentItemId },
          data: { quantityOnHand: { increment: amountToRestore } }
        });

        await tx.inventoryTransaction.create({
          data: {
            itemId: comp.componentItemId,
            changeQty: amountToRestore,
            newTotalQty: updatedComp.quantityOnHand,
            reason: `Disassembly Return: ${bom.name} (Ref Order: ${data.orderId})`,
            createdAt: customDate
          }
        });
      }
    } 
    // Option B: Standard Return (Add to Finished Goods)
    else {
      const updatedItem = await tx.item.update({
        where: { id: data.itemId },
        data: { quantityOnHand: { increment: data.quantity } }
      });

      await tx.inventoryTransaction.create({
        data: {
          itemId: data.itemId,
          changeQty: data.quantity,
          newTotalQty: updatedItem.quantityOnHand,
          reason: `Return: ${data.reason} (Ref Order: ${data.orderId})`,
          createdAt: customDate
        }
      });
    }

    return { success: true };
  }, { timeout: 30000 });
}
export async function getOrderReturnLogs(orderId: string) {
  return await prisma.inventoryTransaction.findMany({
    where: {
      reason: {
        contains: `Ref Order: ${orderId}` // Matches the reason string created in processReturnAction
      }
    },
    include: {
      item: true // Include item details like Name and SKU
    },
    orderBy: { createdAt: 'desc' }
  });
}
export async function getAdjustedInvoiceValue(orderId: string) {
  // 1. Fetch the original order details
  const order = await prisma.salesOrder.findUnique({
    where: { id: orderId },
    include: { items: true }
  });

  if (!order) throw new Error("Order not found");

  // 2. Fetch all return logs for this order
  const returnLogs = await prisma.inventoryTransaction.findMany({
    where: { reason: { contains: `Ref Order: ${orderId}` } }
  });

  // 3. Calculate the total value of returns
  const totalReturnedValue = returnLogs.reduce((acc, log) => {
    // Find the original sale price from the order items
    const originalItem = order.items.find(oi => oi.itemId === log.itemId);
    const price = originalItem?.salePrice || 0;
    return acc + (log.changeQty * price);
  }, 0);

  // 4. Return the adjusted value
  return {
    originalTotal: order.totalAmount,
    returnedValue: totalReturnedValue,
    netValue: order.totalAmount - totalReturnedValue
  };
}