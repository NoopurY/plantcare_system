import { query } from '@/lib/db/pool';
import { getSession } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

/**
 * GET /api/species
 * Returns all species with care profiles via species_care_overview view.
 * Supports optional ?search= query param for filtering by name.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let sql = `SELECT * FROM species_care_overview`;
    const params = [];

    if (search) {
      sql += ` WHERE common_name ILIKE $1 OR scientific_name ILIKE $1`;
      params.push(`%${search}%`);
    }

    sql += ` ORDER BY common_name`;

    const result = await query(sql, params);
    return NextResponse.json({ species: result.rows });
  } catch (err) {
    console.error('GET /api/species error:', err);
    return NextResponse.json({ error: 'Failed to fetch species' }, { status: 500 });
  }
}

/**
 * POST /api/species
 * Admin only (role_id === 1). Inserts a new species + care_profile row.
 * Body: { common_name, scientific_name, family, water_requirement, sunlight_requirement,
 *         soil_type, min_temp_celsius, max_temp_celsius, care_difficulty, description,
 *         watering_interval_days, fertilize_interval_days, fertilizer_type, repot_interval_months }
 */
export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.role_id !== 1) {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const {
      common_name,
      scientific_name,
      family = null,
      water_requirement = 'moderate',
      sunlight_requirement = 'indirect',
      soil_type = null,
      min_temp_celsius = null,
      max_temp_celsius = null,
      care_difficulty = 'beginner',
      description = null,
      // care profile fields
      watering_interval_days = 7,
      fertilize_interval_days = 30,
      fertilizer_type = null,
      repot_interval_months = null,
    } = body;

    if (!common_name || !scientific_name) {
      return NextResponse.json(
        { error: 'common_name and scientific_name are required' },
        { status: 400 }
      );
    }

    // Insert species
    let newSpecies;
    try {
      const speciesResult = await query(
        `INSERT INTO species
           (common_name, scientific_name, family, water_requirement, sunlight_requirement,
            soil_type, min_temp_celsius, max_temp_celsius, care_difficulty, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [common_name, scientific_name, family, water_requirement, sunlight_requirement,
         soil_type, min_temp_celsius, max_temp_celsius, care_difficulty, description]
      );
      newSpecies = speciesResult.rows[0];
    } catch (dbError) {
      if (dbError.code === '23505') {
        return NextResponse.json(
          { error: 'A species with this scientific name already exists' },
          { status: 409 }
        );
      }
      throw dbError;
    }

    // Insert care profile linked to the new species
    const careResult = await query(
      `INSERT INTO care_profiles
         (species_id, watering_interval_days, fertilize_interval_days, fertilizer_type, repot_interval_months)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [newSpecies.species_id, watering_interval_days, fertilize_interval_days, fertilizer_type, repot_interval_months]
    );

    return NextResponse.json(
      { species: newSpecies, care_profile: careResult.rows[0] },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/species error:', err);
    return NextResponse.json({ error: 'Failed to create species' }, { status: 500 });
  }
}
