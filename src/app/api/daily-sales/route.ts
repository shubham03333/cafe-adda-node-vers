import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM daily_sales ORDER BY sale_date DESC'
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching daily sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily sales' },
      { status: 500 }
    );
  }
}
