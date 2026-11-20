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
      conditions.push(`gl.plant_id = $${params.length}`);
    }

    const whereClause = conditions.join(' AND ');

    params.push(limit);
    params.push(offset);

    const result = await query(
      `SELECT gl.*, p.plant_name
       FROM growth_logs gl
       JOIN plants p ON gl.plant_id = p.plant_id
       WHERE ${whereClause}
       ORDER BY gl.recorded_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countParams = [];
    const countConditions = ['p.is_active = TRUE'];
    if (!isAdmin) {
      countParams.push(userId);
      countConditions.push(`p.user_id = $${countParams.length}`);
    }
    if (plant_id) {
      countParams.push(plant_id);
      countConditions.push(`gl.plant_id = $${countParams.length}`);
    }
    const countResult = await query(
      `SELECT COUNT(*) AS total
       FROM growth_logs gl
       JOIN plants p ON gl.plant_id = p.plant_id
       WHERE ${countConditions.join(' AND ')}`,
      countParams
    );

    return NextResponse.json({
      logs: result.rows,
      total: parseInt(countResult.rows[0].total, 10),
    });
  } catch (error) {
    console.error('[GET /api/growth]', error);
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
    const {
      plant_id,
      height_cm = null,
      spread_cm = null,
      leaf_count = null,
      growth_stage = null,
      recorded_at = null,
      notes = null,
    } = body;

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
      `INSERT INTO growth_logs
         (plant_id, height_cm, spread_cm, leaf_count, growth_stage, recorded_at, notes)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6::timestamptz, NOW()), $7)
       RETURNING *`,
      [plant_id, height_cm, spread_cm, leaf_count, growth_stage, recorded_at, notes]
    );

    return NextResponse.json({ log: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/growth]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
