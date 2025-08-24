import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const updatedItem = await request.json();
    const { id } = await params;

    if (!db) {
      throw new Error('Database not configured');
    }

    // First, get the current item to preserve existing values
    const [currentItems] = await db.execute(
      'SELECT * FROM menu_items WHERE id = ?',
      [id]
    );
    
    // Type assertion to handle the query result
    const itemsArray = currentItems as any[];
    
    if (!itemsArray || itemsArray.length === 0) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      );
    }

    const currentItem = itemsArray[0];
    
    // Update only the fields that are provided in the request
    const name = updatedItem.name !== undefined ? updatedItem.name : currentItem.name;
    const price = updatedItem.price !== undefined ? updatedItem.price : currentItem.price;
    const category = updatedItem.category !== undefined ? updatedItem.category : currentItem.category;
    const is_available = updatedItem.is_available !== undefined ? updatedItem.is_available : currentItem.is_available;

    await db.execute(
      'UPDATE menu_items SET name = ?, price = ?, category = ?, is_available = ? WHERE id = ?',
      [name, price, category, is_available, id]
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!db) {
      throw new Error('Database not configured');
    }

    await db.execute(
      'DELETE FROM menu_items WHERE id = ?',
      [id]
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
