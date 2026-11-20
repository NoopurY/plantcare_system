import { query } from '@/lib/db/pool';
import { getSession } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

/**
 * GET /api/disease-records
 * Returns disease records for the authenticated user's plants via the
 * disease_summary view. Supports optional ?plant_id= filter.
 */
export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const plant_id = searchParams.get('plant_id');

    let sql = `SELECT * FROM disease_summary WHERE user_id = $1`;
    const params = [session.user_id];

    if (plant_id) {
      sql += ` AND plant_id = $2`;
      params.push(plant_id);
    }

    sql += ` ORDER BY detected_at DESC`;

    const result = await query(sql, params);
    return NextResponse.json({ records: result.rows });
  } catch (err) {
    console.error('GET /api/disease-records error:', err);
    return NextResponse.json({ error: 'Failed to fetch disease records' }, { status: 500 });
  }
}

/**
 * POST /api/disease-records
 * Creates a disease record. Verifies that the plant belongs to the authenticated user.
 * Body: { plant_id, disease_id, diagnosed_at, treatment_used, notes }
 */
export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plant_id, disease_id, detected_at, severity = 'moderate', treatment_used, notes } = body;

    if (!plant_id || !disease_id) {
      return NextResponse.json({ error: 'plant_id and disease_id are required' }, { status: 400 });
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
      `INSERT INTO disease_records (plant_id, disease_id, detected_at, severity, treatment_used, notes)
       VALUES ($1, $2, COALESCE($3::timestamptz, NOW()), $4, $5, $6)
       RETURNING *`,
      [plant_id, disease_id, detected_at, severity, treatment_used || null, notes || null]
    );

    return NextResponse.json({ record: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('POST /api/disease-records error:', err);
    return NextResponse.json({ error: 'Failed to create disease record' }, { status: 500 });
  }
}

/**
 * PATCH /api/disease-records
 * Updates an existing disease record (mark as resolved, update treatment).
 * Body: { record_id, resolved_at, treatment_used }
 * Verifies ownership by joining through plants.
 */
export async function PATCH(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { record_id, resolved_at, treatment_used } = body;

    if (!record_id) {
      return NextResponse.json({ error: 'record_id is required' }, { status: 400 });
    }

    // Verify ownership via join through plants
    const ownerCheck = await query(
      `SELECT dr.record_id
       FROM disease_records dr
       JOIN plants p ON dr.plant_id = p.plant_id
       WHERE dr.record_id = $1 AND p.user_id = $2`,
      [record_id, session.user_id]
    );
    if (ownerCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Disease record not found or does not belong to you' },
        { status: 403 }
      );
    }

    const result = await query(
      `UPDATE disease_records
       SET resolved_at    = COALESCE($1, resolved_at),
           treatment_used = COALESCE($2, treatment_used)
       WHERE record_id = $3
       RETURNING *`,
      [resolved_at, treatment_used, record_id]
    );

    return NextResponse.json({ record: result.rows[0] });
  } catch (err) {
    console.error('PATCH /api/disease-records error:', err);
    return NextResponse.json({ error: 'Failed to update disease record' }, { status: 500 });
  }
}
