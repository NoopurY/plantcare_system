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
    const search = searchParams.get('search') || '';
    const health_status = searchParams.get('health_status') || '';
    const growth_stage = searchParams.get('growth_stage') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build dynamic WHERE clause
    const conditions = ['p.is_active = TRUE'];
    const params = [];

    if (session.role_id !== 1) {
      params.push(session.user_id || session.sub);
      conditions.push(`p.user_id = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(p.plant_name ILIKE $${params.length} OR p.nickname ILIKE $${params.length})`);
    }

    if (health_status) {
      params.push(health_status);
      conditions.push(`p.health_status = $${params.length}`);
    }

    if (growth_stage) {
      params.push(growth_stage);
      conditions.push(`p.growth_stage = $${params.length}`);
    }

    const whereClause = conditions.join(' AND ');

    // Count total matching rows
    const countResult = await query(
      `SELECT COUNT(*) AS total
       FROM plants p
       LEFT JOIN species s ON p.species_id = s.species_id
       WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    // Fetch paginated results
    params.push(limit);
    params.push(offset);
    const dataResult = await query(
      `SELECT p.*, s.common_name AS species_name
       FROM plants p
       LEFT JOIN species s ON p.species_id = s.species_id
       WHERE ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return NextResponse.json({ plants: dataResult.rows, total });
  } catch (error) {
    console.error('[GET /api/plants]', error);
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
      plant_name,
      species_id = null,
      location = null,
      growth_stage = null,
      health_status = null,
      image_url = null,
      notes = null,
      nickname = null,
      date_acquired = null,
    } = body;

    if (!plant_name || plant_name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Plant name is required' },
        { status: 400 }
      );
    }

    // Normalize optional/empty-string values — an empty string from a form
    // select (e.g. "— None —") is not a valid INTEGER or DATE for Postgres.
    const normalizedSpeciesId = species_id === '' || species_id === null || species_id === undefined
      ? null
      : parseInt(species_id, 10);
    const normalizedDateAcquired = date_acquired === '' ? null : date_acquired;
    const normalizedGrowthStage = growth_stage || 'seedling';
    const normalizedHealthStatus = health_status || 'healthy';

    const result = await query(
      `INSERT INTO plants
         (user_id, plant_name, species_id, location, growth_stage, health_status,
          image_url, notes, nickname, date_acquired, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE, NOW(), NOW())
       RETURNING *`,
      [
        session.user_id,
        plant_name.trim(),
        normalizedSpeciesId,
        location || null,
        normalizedGrowthStage,
        normalizedHealthStatus,
        image_url || null,
        notes || null,
        nickname || null,
        normalizedDateAcquired,
      ]
    );

    return NextResponse.json({ plant: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/plants]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
