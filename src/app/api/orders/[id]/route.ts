import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { UpdateOrderRequest } from '@/types';
import { getTodayISTDateString } from '@/lib/timezone'; // Import timezone utility
// PUT update order
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body: UpdateOrderRequest = await request.json();
    const { id } = await params;

    const updateFields: string[] = [];
    const values: any[] = [];

    if (body.items) {
      updateFields.push('items = ?');
      values.push(JSON.stringify(body.items));
    }

    if (body.total !== undefined) {
      updateFields.push('total = ?');
      values.push(body.total);
    }

    if (body.status) {
      updateFields.push('status = ?');
      values.push(body.status);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(id);

    await executeQuery(
      `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );

    if (body.status === 'served') {
      console.log(`Updating order status for order ID: ${id} to served`);
      // Get the order total first
      const orderRows = await executeQuery(
        'SELECT total FROM orders WHERE id = ?',
        [id]
      ) as any[];
      
      if (orderRows && orderRows.length > 0) {
        const orderTotal = orderRows[0].total;
        console.log(`Order total for order ID ${id}: ₹${orderTotal}`);
        const today = getTodayISTDateString(); // Use IST date
        
        await executeQuery(`
          INSERT INTO daily_sales (sale_date, total_orders, total_revenue) 
          VALUES (?, 1, ?) 
          ON DUPLICATE KEY UPDATE 
            total_orders = total_orders + 1,
            total_revenue = total_revenue + ?
        `, [today, orderTotal, orderTotal]);
        console.log(`Updated daily sales for ${today}: +1 order, +₹${orderTotal}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}

// DELETE order
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await executeQuery('DELETE FROM orders WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}