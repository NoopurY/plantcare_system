import { query } from '@/lib/db/pool';
import { getSession } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

/**
 * GET /api/fertilization
 * Returns fertilization logs for the authenticated user's plants.
 * Supports optional ?plant_id= filter.
 * JOINs fertilization_logs with plants to verify ownership.
 */
export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const plant_id = searchParams.get('plant_id');

    const isAdmin = session.role_id === 1;
    const userId = session.user_id || session.sub;

    const conditions = [];
    const params = [];

    if (!isAdmin) {
      params.push(userId);
      conditions.push(`p.user_id = $${params.length}`);
    }

    if (plant_id) {
      params.push(plant_id);
      conditions.push(`fl.plant_id = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const sql = `
      SELECT fl.*, p.plant_name, p.user_id
      FROM fertilization_logs fl
      JOIN plants p ON fl.plant_id = p.plant_id
      ${whereClause}
      ORDER BY fl.applied_at DESC
    `;

    const result = await query(sql, params);
    return NextResponse.json({ logs: result.rows });
  } catch (err) {
    console.error('GET /api/fertilization error:', err);
    return NextResponse.json({ error: 'Failed to fetch fertilization logs' }, { status: 500 });
  }
}

/**
 * POST /api/fertilization
 * Creates a fertilization log. Verifies plant ownership before insert.
 * Body: { plant_id, fertilizer_type, amount_grams, method, notes, fertilized_at }
 */
export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plant_id, fertilizer_type, quantity_grams, method, notes, applied_at } = body;

    if (!plant_id) {
      return NextResponse.json({ error: 'plant_id is required' }, { status: 400 });
    }

    if (!fertilizer_type || fertilizer_type.trim().length === 0) {
      return NextResponse.json({ error: 'fertilizer_type is required' }, { status: 400 });
    }

    // Verify plant ownership
    const ownerCheck = await query(
      `SELECT plant_id FROM plants WHERE plant_id = $1 AND user_id = $2 AND is_active = TRUE`,
      [plant_id, session.user_id]
    );

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Plant not found or does not belong to you' },
        { status: 403 }
      );
    }

    const result = await query(
      `INSERT INTO fertilization_logs (plant_id, fertilizer_type, quantity_grams, method, notes, applied_at)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6::timestamptz, NOW()))
       RETURNING *`,
      [plant_id, fertilizer_type.trim(), quantity_grams || null, method || null, notes || null, applied_at || null]
    );

    return NextResponse.json({ log: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('POST /api/fertilization error:', err);
    return NextResponse.json({ error: 'Failed to create fertilization log' }, { status: 500 });
  }
}
