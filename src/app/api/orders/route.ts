import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { CreateOrderRequest, Order } from '@/types';

// GET all orders
export async function GET() {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM orders WHERE status != "served" ORDER BY order_time ASC'
    );

    const orders = (rows as any[]).map(row => {
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

// POST new order
export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();
    const orderId = uuidv4();

    await db.execute(
      'INSERT INTO orders (id, order_number, items, total) VALUES (?, ?, ?, ?)',
      [orderId, body.order_number, JSON.stringify(body.items), body.total]
    );

    // Update daily sales
    const today = new Date().toISOString().split('T')[0];
    await db.execute(`
      INSERT INTO daily_sales (sale_date, total_orders, total_revenue) 
      VALUES (?, 1, ?) 
      ON DUPLICATE KEY UPDATE 
        total_orders = total_orders + 1,
        total_revenue = total_revenue + ?
    `, [today, body.total, body.total]);

    return NextResponse.json({ id: orderId, success: true });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}