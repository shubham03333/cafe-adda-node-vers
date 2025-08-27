import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch all system settings
export async function GET() {
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  try {
    const [settings] = await db.execute('SELECT * FROM system_settings');
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PUT - Update a system setting
export async function PUT(request: NextRequest) {
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  try {
    const body = await request.json();
    const { setting_name, setting_value } = body;
    
    await db.execute('UPDATE system_settings SET setting_value = ? WHERE setting_name = ?', [setting_value, setting_name]);
    return NextResponse.json({ setting_name, setting_value });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
