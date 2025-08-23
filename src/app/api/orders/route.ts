import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { CreateOrderRequest, Order } from '@/types';

// GET all orders with optional status filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || '';
    
    let query = 'SELECT * FROM orders WHERE status != "served"';
    if (statusFilter) {
      query += ` AND status IN (${statusFilter})`;
    }
    query += ' ORDER BY order_time ASC';

    const rows = await executeQuery(query) as any[];

    const orders = rows.map(row => {
      // Check if items is already an object or needs parsing
      let itemsData = row.items;
      if (typeof row.items === 'string') {
        try {
          itemsData = JSON.parse(row.items);
        } catch (parseError) {
          console.warn('Failed to parse items JSON:', row.items);
          itemsData = [];
        }
      }
      
      return {
        ...row,
        items: itemsData
      };
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();
    const orderId = uuidv4();

    // Set initial status to 'preparing'
    await executeQuery(
      'INSERT INTO orders (id, order_number, items, total, status) VALUES (?, ?, ?, ?, ?)',
      [orderId, body.order_number, JSON.stringify(body.items), body.total, 'preparing']
    );

    return NextResponse.json({ id: orderId, success: true });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
