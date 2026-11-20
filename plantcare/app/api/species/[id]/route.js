import { query } from '@/lib/db/pool';
import { getSession } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

/**
 * GET /api/species/[id]
 * Returns a single species with its care profile.
 * JOINs species with care_profiles on species_id.
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const result = await query(
      `SELECT
         s.species_id, s.common_name, s.scientific_name, s.family,
         s.water_requirement, s.sunlight_requirement, s.soil_type,
         s.min_temp_celsius, s.max_temp_celsius, s.description,
         s.care_difficulty, s.created_at AS species_created_at,
         cp.profile_id, cp.watering_interval_days, cp.fertilize_interval_days,
         cp.fertilizer_type, cp.repot_interval_months, cp.pruning_notes
       FROM species s
       LEFT JOIN care_profiles cp ON s.species_id = cp.species_id
       WHERE s.species_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Species not found' }, { status: 404 });
    }

    return NextResponse.json({ species: result.rows[0] });
  } catch (err) {
    console.error('GET /api/species/[id] error:', err);
    return NextResponse.json({ error: 'Failed to fetch species' }, { status: 500 });
  }
}

/**
 * PUT /api/species/[id]
 * Admin only. Updates species fields (common_name, scientific_name, family,
 * description, native_region, max_height_cm, max_spread_cm).
 */
export async function PUT(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.role_id !== 1) {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      common_name,
      scientific_name,
      family,
      description,
      water_requirement,
      sunlight_requirement,
      soil_type,
      care_difficulty,
    } = body;

    const result = await query(
      `UPDATE species
       SET common_name          = COALESCE($1, common_name),
           scientific_name      = COALESCE($2, scientific_name),
           family               = COALESCE($3, family),
           description          = COALESCE($4, description),
           water_requirement    = COALESCE($5, water_requirement),
           sunlight_requirement = COALESCE($6, sunlight_requirement),
           soil_type            = COALESCE($7, soil_type),
           care_difficulty      = COALESCE($8, care_difficulty),
           updated_at           = NOW()
       WHERE species_id = $9
       RETURNING *`,
      [common_name, scientific_name, family, description, water_requirement, sunlight_requirement, soil_type, care_difficulty, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Species not found' }, { status: 404 });
    }

    return NextResponse.json({ species: result.rows[0] });
  } catch (err) {
    console.error('PUT /api/species/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update species' }, { status: 500 });
  }
}
