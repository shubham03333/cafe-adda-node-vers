import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const updatedItem = await request.json();
    const { name, price, category, is_available } = updatedItem;

    if (!db) {
      throw new Error('Database not configured');
    }

    await db.execute(
      'UPDATE menu_items SET name = ?, price = ?, category = ?, is_available = ? WHERE id = ?',
      [name, price, category, is_available, params.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating menu item:', error);
    return NextResponse.json(
      { error: 'Failed to update menu item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!db) {
      throw new Error('Database not configured');
    }

    await db.execute(
      'DELETE FROM menu_items WHERE id = ?',
      [params.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json(
      { error: 'Failed to delete menu item' },
      { status: 500 }
    );
  }
}
