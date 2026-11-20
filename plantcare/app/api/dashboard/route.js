import { NextResponse } from 'next/server';
import { query } from '@/lib/db/pool';
import { getSession } from '@/lib/auth/session';

export async function GET(request) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user_id || session.sub;
    const isAdmin = session.role_id === 1;

    // 1. Aggregate dashboard stats
    const statsResult = await query(
      `SELECT * FROM user_dashboard_stats WHERE user_id = $1`,
      [userId]
    );
    let stats = statsResult.rows[0] || null;

    if ((!stats || Number(stats.total_plants) === 0) && isAdmin) {
      const sysStats = await query(
        `SELECT
           COUNT(DISTINCT p.plant_id)::int AS total_plants,
           COUNT(DISTINCT p.plant_id) FILTER (WHERE p.health_status = 'healthy')::int AS healthy_plants,
           COUNT(DISTINCT p.plant_id) FILTER (WHERE p.health_status = 'needs_attention')::int AS needs_attention,
           COUNT(DISTINCT p.plant_id) FILTER (WHERE p.health_status = 'critical')::int AS critical_plants,
           COUNT(DISTINCT p.plant_id) FILTER (WHERE p.health_status = 'recovering')::int AS recovering_plants,
           COUNT(DISTINCT wl.log_id)  FILTER (WHERE wl.watered_at >= NOW() - INTERVAL '7 days')::int AS waterings_this_week,
           (SELECT COUNT(*)::int FROM notifications WHERE is_read = FALSE) AS unread_notifications
         FROM plants p
         LEFT JOIN watering_logs wl ON p.plant_id = wl.plant_id
         WHERE p.is_active = TRUE`
      );
      stats = sysStats.rows[0];
    }

    // 2. Recent activity — last 5 entries from plant_activity_summary view
    const activityResult = await query(
      `SELECT *
       FROM plant_activity_summary
       ${isAdmin ? '' : 'WHERE user_id = $1'}
       ORDER BY activity_at DESC
       LIMIT 5`,
      isAdmin ? [] : [userId]
    );
    const recentActivity = activityResult.rows;

    // 3. Species distribution for active plants
    const speciesResult = await query(
      `SELECT
         COALESCE(s.common_name, 'Unknown') AS common_name,
         COUNT(p.plant_id)::int AS count
       FROM plants p
       LEFT JOIN species s ON p.species_id = s.species_id
       WHERE p.is_active = TRUE ${isAdmin ? '' : 'AND p.user_id = $1'}
       GROUP BY s.common_name
       ORDER BY count DESC`,
      isAdmin ? [] : [userId]
    );
    const speciesDistribution = speciesResult.rows;

    // 4. Health trend
    const healthTrendResult = await query(
      `SELECT
         DATE(hl.recorded_at) AS date,
         ROUND(AVG(hl.health_score)::numeric, 2) AS avg_health_score,
         COUNT(*)::int AS entries
       FROM health_logs hl
       JOIN plants p ON hl.plant_id = p.plant_id
       WHERE p.is_active = TRUE ${isAdmin ? '' : 'AND p.user_id = $1'}
         AND hl.recorded_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(hl.recorded_at)
       ORDER BY date ASC`,
      isAdmin ? [] : [userId]
    );
    const healthTrend = healthTrendResult.rows;

    return NextResponse.json({
      stats,
      recentActivity,
      speciesDistribution,
      healthTrend,
    });
  } catch (error) {
    console.error('[GET /api/dashboard]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
