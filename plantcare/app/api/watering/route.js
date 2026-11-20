import { NextResponse } from 'next/server';
import { query } from '@/lib/db/pool';
import { getSession } from '@/lib/auth/session';

export async function GET(request) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const plant_id = searchParams.get('plant_id') || null;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const isAdmin = session.role_id === 1;
    const userId = session.user_id || session.sub;

    const conditions = ['p.is_active = TRUE'];
    const params = [];

    if (!isAdmin) {
      params.push(userId);
      conditions.push(`p.user_id = $${params.length}`);
    }

    if (plant_id) {
      params.push(plant_id);
      conditions.push(`wl.plant_id = $${params.length}`);
    }

    const whereClause = conditions.join(' AND ');

    params.push(limit);
    params.push(offset);

    const result = await query(
      `SELECT wl.*, p.plant_name
       FROM watering_logs wl
       JOIN plants p ON wl.plant_id = p.plant_id
       WHERE ${whereClause}
       ORDER BY wl.watered_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    // Count for pagination
    const countParams = [];
    const countConditions = ['p.is_active = TRUE'];
    if (!isAdmin) {
      countParams.push(userId);
      countConditions.push(`p.user_id = $${countParams.length}`);
    }
    if (plant_id) {
      countParams.push(plant_id);
      countConditions.push(`wl.plant_id = $${countParams.length}`);
    }
    const countResult = await query(
      `SELECT COUNT(*) AS total
       FROM watering_logs wl
       JOIN plants p ON wl.plant_id = p.plant_id
       WHERE ${countConditions.join(' AND ')}`,
      countParams
    );

    return NextResponse.json({
      logs: result.rows,
      total: parseInt(countResult.rows[0].total, 10),
    });
  } catch (error) {
    console.error('[GET /api/watering]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plant_id, quantity_ml = null, method = null, notes = null, watered_at = null } = body;

    if (!plant_id) {
      return NextResponse.json({ error: 'plant_id is required' }, { status: 400 });
    }

    // Verify plant belongs to current user
    const ownerCheck = await query(
      `SELECT plant_id FROM plants WHERE plant_id = $1 AND user_id = $2 AND is_active = TRUE`,
      [plant_id, session.user_id]
    );
    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Plant not found' }, { status: 404 });
    }

    const result = await query(
      `INSERT INTO watering_logs (plant_id, quantity_ml, method, notes, watered_at)
       VALUES ($1, $2, $3, $4, COALESCE($5::timestamptz, NOW()))
       RETURNING *`,
      [plant_id, quantity_ml, method, notes, watered_at]
    );

    return NextResponse.json({ log: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/watering]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
