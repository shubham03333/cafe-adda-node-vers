import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/db';

export async function GET() {
  try {
    const rows = await executeQuery(
      'SELECT * FROM menu_items WHERE is_available = TRUE ORDER BY category, name'
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching menu:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu' },
      { status: 500 }
    );
  }
}
