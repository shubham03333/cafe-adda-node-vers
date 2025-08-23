import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    if (!db) {
      throw new Error('Database not configured');
    }

    const [rows] = await db.execute(
      'SELECT * FROM menu_items WHERE is_available = TRUE ORDER BY position IS NULL, position, category, name'
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

export async function POST(request: Request) {
  try {
    const newItem = await request.json();
    
    const { name, price, category, is_available } = newItem;

    if (!db) {
      throw new Error('Database not configured');
    }

    const [result] = await db.execute(
      'INSERT INTO menu_items (name, price, category, is_available) VALUES (?, ?, ?, ?)',
      [name, price, category, is_available]
    );

    // Type assertion for the result to access insertId
    const insertResult = result as any;
    return NextResponse.json({ success: true, id: insertResult.insertId });
  } catch (error) {
    console.error('Error creating menu item:', error);
    return NextResponse.json(
      { error: 'Failed to create menu item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Menu item ID is required' },
        { status: 400 }
      );
    }

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

export async function PUT(request: Request) {
  try {
    const updatedItem = await request.json();

    const { id, name, price, category, is_available } = updatedItem;

    if (!db) {
      throw new Error('Database not configured');
    }

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
