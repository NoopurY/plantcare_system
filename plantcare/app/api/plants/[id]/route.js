import { NextResponse } from 'next/server';
import { query } from '@/lib/db/pool';
import { getSession } from '@/lib/auth/session';

export async function GET(request, { params }) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Fetch plant with species info, ensuring ownership
    const isAdmin = session.role_id === 1;
    const userId = session.user_id || session.sub;
    const plantResult = await query(
      `SELECT p.*, s.common_name AS species_name, s.scientific_name,
              s.sunlight_requirement, s.description AS species_description
       FROM plants p
       LEFT JOIN species s ON p.species_id = s.species_id
       WHERE p.plant_id = $1 AND p.is_active = TRUE ${isAdmin ? '' : 'AND p.user_id = $2'}`,
      isAdmin ? [id] : [id, userId]
    );

    if (plantResult.rows.length === 0) {
      return NextResponse.json({ error: 'Plant not found' }, { status: 404 });
    }

    const plant = plantResult.rows[0];

    // Fetch plant statistics from DB function
    let statistics = null;
    try {
      const statsResult = await query(
        `SELECT * FROM get_plant_statistics($1)`,
        [id]
      );
      statistics = statsResult.rows[0] || null;
    } catch (statsError) {
      // Non-fatal: function may not exist in all DB versions
      console.warn('[GET /api/plants/[id]] get_plant_statistics failed:', statsError.message);
    }

    return NextResponse.json({ plant, statistics });
  } catch (error) {
    console.error('[GET /api/plants/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const ownerCheck = await query(
      `SELECT plant_id FROM plants WHERE plant_id = $1 AND user_id = $2 AND is_active = TRUE`,
      [id, session.user_id]
    );
    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Plant not found' }, { status: 404 });
    }

    const body = await request.json();
    const allowedFields = [
      'plant_name', 'species_id', 'location', 'growth_stage',
      'health_status', 'image_url', 'notes', 'nickname', 'date_acquired',
    ];
    // Fields that are an empty string from a form "None" option but must be
    // NULL (FK) or NULL (date) rather than '' at the database level.
    const nullableOnEmpty = new Set(['species_id', 'date_acquired']);

    const setClauses = [];
    const values = [];

    for (const field of allowedFields) {
      if (field in body) {
        let value = body[field];
        if (nullableOnEmpty.has(field) && value === '') {
          value = null;
        } else if (field === 'species_id' && value !== null && value !== undefined) {
          value = parseInt(value, 10);
        }
        values.push(value);
        setClauses.push(`${field} = $${values.length}`);
      }
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Add updated_at
    setClauses.push(`updated_at = NOW()`);

    // WHERE params
    values.push(id);
    values.push(session.user_id);

    const result = await query(
      `UPDATE plants
       SET ${setClauses.join(', ')}
       WHERE plant_id = $${values.length - 1} AND user_id = $${values.length} AND is_active = TRUE
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Plant not found' }, { status: 404 });
    }

    return NextResponse.json({ plant: result.rows[0] });
  } catch (error) {
    console.error('[PUT /api/plants/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Soft delete — verify ownership in the same statement
    const result = await query(
      `UPDATE plants
       SET is_active = FALSE, updated_at = NOW()
       WHERE plant_id = $1 AND user_id = $2 AND is_active = TRUE
       RETURNING plant_id`,
      [id, session.user_id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Plant not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Plant deleted' });
  } catch (error) {
    console.error('[DELETE /api/plants/[id]]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
