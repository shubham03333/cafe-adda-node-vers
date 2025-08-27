import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { MenuItem } from '@/types';

interface InventoryUpdate {
  id: number;
  stock_quantity?: number;
  low_stock_threshold?: number;
  unit_type?: string;
  ingredients?: Record<string, number>;
  supplier_info?: string;
}

interface StockAdjustment {
  id: number;
  quantity: number;
  action: 'add' | 'subtract';
}

// GET /api/inventory - Get all inventory items with stock information
export async function GET(request: NextRequest) {
  try {
    if (!db) {
      throw new Error('Database connection not initialized');
    }
    
    const connection = await db.getConnection();
    
    // Get all menu items with inventory data and raw materials
    const [items] = await connection.execute(`
      SELECT 
        mi.id, mi.name, mi.price, mi.is_available, mi.category, mi.position,
        mi.stock_quantity, mi.low_stock_threshold, mi.unit_type,
        mi.ingredients, mi.supplier_info, mi.last_restocked,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', drm.id,
            'dish_id', drm.dish_id,
            'raw_material_id', drm.raw_material_id,
            'quantity_required', drm.quantity_required,
            'raw_material', JSON_OBJECT(
              'id', rm.id,
              'name', rm.name,
              'unit_type', rm.unit_type,
              'current_stock', rm.current_stock,
              'min_stock_level', rm.min_stock_level
            )
          )
        ) as raw_materials
      FROM menu_items mi
      LEFT JOIN dish_raw_materials drm ON mi.id = drm.dish_id
      LEFT JOIN raw_materials rm ON drm.raw_material_id = rm.id
      GROUP BY mi.id
      ORDER BY mi.category, mi.position
    `);
    
    connection.release();

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

// POST /api/inventory - Update inventory for multiple items
export async function POST(request: NextRequest) {
  try {
    if (!db) {
      throw new Error('Database connection not initialized');
    }
    
    const updates: InventoryUpdate[] = await request.json();
    const connection = await db.getConnection();
    
    await connection.beginTransaction();

    try {
      for (const update of updates) {
        const {
          id,
          stock_quantity,
          low_stock_threshold,
          unit_type,
          ingredients,
          supplier_info
        } = update;

        // Build update query dynamically based on provided fields
        const updateFields = [];
        const updateValues = [];

        if (stock_quantity !== undefined) {
          updateFields.push('stock_quantity = ?');
          updateValues.push(stock_quantity);
        }

        if (low_stock_threshold !== undefined) {
          updateFields.push('low_stock_threshold = ?');
          updateValues.push(low_stock_threshold);
        }

        if (unit_type !== undefined) {
          updateFields.push('unit_type = ?');
          updateValues.push(unit_type);
        }

        if (ingredients !== undefined) {
          updateFields.push('ingredients = ?');
          updateValues.push(JSON.stringify(ingredients));
        }

        if (supplier_info !== undefined) {
          updateFields.push('supplier_info = ?');
          updateValues.push(supplier_info);
        }

        // Update last_restocked if stock quantity is being updated
        if (stock_quantity !== undefined) {
          updateFields.push('last_restocked = CURRENT_TIMESTAMP');
        }

        if (updateFields.length > 0) {
          updateValues.push(id);
          
          const query = `
            UPDATE menu_items 
            SET ${updateFields.join(', ')}
            WHERE id = ?
          `;
          
          await connection.execute(query, updateValues);
        }
      }

      await connection.commit();
      connection.release();

      return NextResponse.json({ message: 'Inventory updated successfully' });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error updating inventory:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    );
  }
}

// PATCH /api/inventory - Adjust stock levels (for restocking or consumption)
export async function PATCH(request: NextRequest) {
  try {
    if (!db) {
      throw new Error('Database connection not initialized');
    }
    
    const adjustmentsData = await request.json();
    if (!Array.isArray(adjustmentsData)) {
      throw new Error('Invalid request body. Expected an array of adjustments.');
    }
    
    const adjustments: StockAdjustment[] = adjustmentsData as StockAdjustment[];
    const connection = await db.getConnection();
    
    await connection.beginTransaction();

    try {
      for (const adjustment of adjustments) {
        const { id, quantity, action } = adjustment;

        if (!['add', 'subtract'].includes(action)) {
          throw new Error('Invalid action. Must be "add" or "subtract"');
        }

        const operator = action === 'add' ? '+' : '-';
        
        await connection.execute(`
          UPDATE menu_items 
          SET stock_quantity = GREATEST(0, stock_quantity ${operator} ?),
              last_restocked = CASE 
                WHEN ? = 'add' THEN CURRENT_TIMESTAMP 
                ELSE last_restocked 
              END
          WHERE id = ?
        `, [quantity, action, id]);

        // Check if stock went below threshold
        if (action === 'subtract') {
          const [items]: any = await connection.execute(`
            SELECT stock_quantity, low_stock_threshold, name 
            FROM menu_items 
            WHERE id = ?
          `, [id]);

          const item = items[0];
          if (item && item.stock_quantity <= item.low_stock_threshold) {
            console.log(`Low stock alert: ${item.name} (${item.stock_quantity} remaining)`);
            // TODO: Implement notification system for low stock
          }
        }
      }

      await connection.commit();
      connection.release();

      return NextResponse.json({ message: 'Stock levels adjusted successfully' });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    console.error('Error adjusting stock levels:', error);
    return NextResponse.json(
      { error: 'Failed to adjust stock levels' },
      { status: 500 }
    );
  }
}
