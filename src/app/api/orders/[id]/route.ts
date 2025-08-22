import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { UpdateOrderRequest } from '@/types';
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

    await db.execute(
      `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );

    // If status is being updated to "served", update daily sales
    if (body.status === 'served') {
      // Get the order total first
      const [orderRows] = await db.execute(
        'SELECT total FROM orders WHERE id = ?',
        [id]
      );
      
      if (orderRows && (orderRows as any[]).length > 0) {
        const orderTotal = (orderRows as any[])[0].total;
        const today = new Date().toISOString().split('T')[0];
        
        await db.execute(`
          INSERT INTO daily_sales (sale_date, total_orders, total_revenue) 
          VALUES (?, 1, ?) 
          ON DUPLICATE KEY UPDATE 
            total_orders = total_orders + 1,
            total_revenue = total_revenue + ?
        `, [today, orderTotal, orderTotal]);
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

    await db.execute('DELETE FROM orders WHERE id = ?', [id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}