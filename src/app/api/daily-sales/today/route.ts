import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';
import { getTodayDateString } from '@/lib/timezone-dynamic';

export async function GET() {
  try {
    const today = await getTodayDateString();
    const rows = await executeQuery(
      'SELECT total_orders, total_revenue FROM daily_sales WHERE sale_date = ?',
      [today]
    ) as any[];

    if (rows.length === 0) {
      return NextResponse.json({ total_orders: 0, total_revenue: 0 });
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error fetching today\'s sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch today\'s sales' },
      { status: 500 }
    );
  }
}
