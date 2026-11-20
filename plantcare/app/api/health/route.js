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
      conditions.push(`hl.plant_id = $${params.length}`);
    }

    const whereClause = conditions.join(' AND ');

    params.push(limit);
    params.push(offset);

    const result = await query(
      `SELECT hl.*, p.plant_name
       FROM health_logs hl
       JOIN plants p ON hl.plant_id = p.plant_id
       WHERE ${whereClause}
       ORDER BY hl.recorded_at DESC
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
      countConditions.push(`hl.plant_id = $${countParams.length}`);
    }
    const countResult = await query(
      `SELECT COUNT(*) AS total
       FROM health_logs hl
       JOIN plants p ON hl.plant_id = p.plant_id
       WHERE ${countConditions.join(' AND ')}`,
      countParams
    );

    return NextResponse.json({
      logs: result.rows,
      total: parseInt(countResult.rows[0].total, 10),
    });
  } catch (error) {
    console.error('[GET /api/health]', error);
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
      health_status = null,
      health_score = null,
      symptoms = [],
      recorded_at = null,
      notes = null,
    } = body;

    if (!plant_id) {
      return NextResponse.json({ error: 'plant_id is required' }, { status: 400 });
    }

    // Validate health_score range
    if (health_score !== null && health_score !== undefined) {
      const score = Number(health_score);
      if (isNaN(score) || score < 0 || score > 100) {
        return NextResponse.json(
          { error: 'health_score must be between 0 and 100' },
          { status: 400 }
        );
      }
    }

    // Verify plant belongs to current user
    const ownerCheck = await query(
      `SELECT plant_id FROM plants WHERE plant_id = $1 AND user_id = $2 AND is_active = TRUE`,
      [plant_id, session.user_id]
    );
    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Plant not found' }, { status: 404 });
    }

    // symptoms stored as a PostgreSQL array
    const symptomsArray = Array.isArray(symptoms) ? symptoms : [];

    const result = await query(
      `INSERT INTO health_logs
         (plant_id, health_status, health_score, symptoms, recorded_at, notes)
       VALUES ($1, $2, $3, $4, COALESCE($5::timestamptz, NOW()), $6)
       RETURNING *`,
      [plant_id, health_status, health_score, symptomsArray, recorded_at, notes]
    );

    return NextResponse.json({ log: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/health]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
