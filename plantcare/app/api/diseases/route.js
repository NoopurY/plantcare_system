import { query } from '@/lib/db/pool';
import { getSession } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

/**
 * GET /api/diseases
 * Returns all diseases from the diseases table.
 */
export async function GET() {
  try {
    const result = await query(
      `SELECT * FROM diseases ORDER BY disease_name`,
      []
    );
    return NextResponse.json({ diseases: result.rows });
  } catch (err) {
    console.error('GET /api/diseases error:', err);
    return NextResponse.json({ error: 'Failed to fetch diseases' }, { status: 500 });
  }
}

/**
 * POST /api/diseases
 * Admin only. Creates a new disease record with all fields.
 * Body: { disease_name, description, symptoms, treatment, prevention, severity_level }
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
    const { disease_name, category = null, description = null, symptoms = null, treatment = null, prevention = null, severity = 'moderate' } = body;

    if (!disease_name) {
      return NextResponse.json({ error: 'disease_name is required' }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO diseases (disease_name, category, description, symptoms, treatment, prevention, severity)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [disease_name, category, description, symptoms, treatment, prevention, severity]
    );

    return NextResponse.json({ disease: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('POST /api/diseases error:', err);
    return NextResponse.json({ error: 'Failed to create disease' }, { status: 500 });
  }
}
