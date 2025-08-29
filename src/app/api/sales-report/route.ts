import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate parameters are required' },
        { status: 400 }
      );
    }

    // Query to get total revenue and total orders for the date range
    const salesSummary = await executeQuery(
      `SELECT 
        SUM(total) as total_revenue,
        COUNT(*) as total_orders
       FROM orders 
       WHERE order_time BETWEEN ? AND ? 
         AND status = 'served'`,
      [startDate, endDate]
    ) as any[];

    // Query to get daily sales breakdown - format date as YYYY-MM-DD string
    const dailySales = await executeQuery(
      `SELECT 
        DATE_FORMAT(order_time, '%Y-%m-%d') as date,
        SUM(total) as revenue,
        COUNT(*) as orders
       FROM orders 
       WHERE order_time BETWEEN ? AND ? 
         AND status = 'served'
       GROUP BY DATE_FORMAT(order_time, '%Y-%m-%d')
       ORDER BY date DESC`,
      [startDate, endDate]
    ) as any[];

    // Query to get top selling items (this will be more complex since items are stored as JSON)
    // For now, let's return an empty array for top items
    const topItems = [] as any[];

    const result = {
      total_revenue: salesSummary[0]?.total_revenue || 0,
      total_orders: salesSummary[0]?.total_orders || 0,
      daily_sales: dailySales || [],
      top_items: topItems || []
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating sales report:', error);
    return NextResponse.json(
      { error: 'Failed to generate sales report' },
      { status: 500 }
    );
  }
}
