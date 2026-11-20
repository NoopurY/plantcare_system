import { query } from '@/lib/db/pool';
import { getSession } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

/**
 * GET /api/analytics
 * Returns aggregated analytics for the authenticated user.
 * Supports ?days=30 query param (defaults to 30).
 *
 * Returns:
 *   - summary: result of get_user_care_summary(user_id, days)
 *   - wateringTrend: daily watering count for the period
 *   - healthTrend: daily average health score for the period
 *   - speciesDistribution: plant count per species
 */
export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);

    if (isNaN(days) || days <= 0 || days > 365) {
      return NextResponse.json(
        { error: 'days must be a positive integer up to 365' },
        { status: 400 }
      );
    }

    // 1. Summary stats via stored function
    const summaryResult = await query(
      `SELECT * FROM get_user_care_summary($1, $2)`,
      [session.user_id, days]
    );

    // 2. Watering trend — daily count over the period
    const wateringResult = await query(
      `SELECT
         DATE_TRUNC('day', wl.watered_at)::date AS date,
         COUNT(*) AS count
       FROM watering_logs wl
       JOIN plants p ON wl.plant_id = p.plant_id
       WHERE p.user_id = $1
         AND wl.watered_at >= NOW() - ($2 || ' days')::interval
       GROUP BY 1
       ORDER BY 1`,
      [session.user_id, days]
    );

    // 3. Health trend — daily average health score
    const healthResult = await query(
      `SELECT
         DATE_TRUNC('day', hl.recorded_at)::date AS date,
         AVG(hl.health_score)::numeric(5,2) AS avg_health_score
       FROM health_logs hl
       JOIN plants p ON hl.plant_id = p.plant_id
       WHERE p.user_id = $1
         AND hl.recorded_at >= NOW() - ($2 || ' days')::interval
       GROUP BY 1
       ORDER BY 1`,
      [session.user_id, days]
    );

    // 4. Species distribution — active plants grouped by species
    const speciesResult = await query(
      `SELECT
         COALESCE(s.common_name, 'Unknown') AS common_name,
         COUNT(p.plant_id) AS count
       FROM plants p
       LEFT JOIN species s ON p.species_id = s.species_id
       WHERE p.user_id = $1 AND p.is_active = TRUE
       GROUP BY s.common_name
       ORDER BY count DESC`,
      [session.user_id]
    );

    return NextResponse.json({
      summary: summaryResult.rows,
      wateringTrend: wateringResult.rows,
      healthTrend: healthResult.rows,
      speciesDistribution: speciesResult.rows,
    });
  } catch (err) {
    console.error('GET /api/analytics error:', err);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
