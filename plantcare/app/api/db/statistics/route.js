import { query } from '@/lib/db/pool';
import { getSession } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

/**
 * GET /api/db/statistics
 * Admin only. Returns comprehensive database statistics:
 * counts for tables, views, functions, triggers, indexes,
 * overall DB size, and per-table stats via get_database_statistics().
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.role_id !== 1) {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    // Run all count queries and the DB size query in parallel
    const [
      tableCountResult,
      viewCountResult,
      functionCountResult,
      triggerCountResult,
      indexCountResult,
      dbSizeResult,
      tableStatsResult,
    ] = await Promise.all([
      query(
        `SELECT COUNT(*) AS count
         FROM information_schema.tables
         WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
        []
      ),
      query(
        `SELECT COUNT(*) AS count
         FROM information_schema.views
         WHERE table_schema = 'public'`,
        []
      ),
      query(
        `SELECT COUNT(*) AS count
         FROM pg_proc p
         JOIN pg_namespace n ON p.pronamespace = n.oid
         WHERE n.nspname = 'public' AND p.prokind = 'f'`,
        []
      ),
      query(
        `SELECT COUNT(*) AS count
         FROM information_schema.triggers
         WHERE trigger_schema = 'public'`,
        []
      ),
      query(
        `SELECT COUNT(*) AS count
         FROM pg_indexes
         WHERE schemaname = 'public'`,
        []
      ),
      query(
        `SELECT pg_size_pretty(pg_database_size(current_database())) AS db_size`,
        []
      ),
      query(
        `SELECT * FROM get_database_statistics()`,
        []
      ),
    ]);

    return NextResponse.json({
      tableCount: parseInt(tableCountResult.rows[0].count, 10),
      viewCount: parseInt(viewCountResult.rows[0].count, 10),
      functionCount: parseInt(functionCountResult.rows[0].count, 10),
      triggerCount: parseInt(triggerCountResult.rows[0].count, 10),
      indexCount: parseInt(indexCountResult.rows[0].count, 10),
      dbSize: dbSizeResult.rows[0].db_size,
      tables: tableStatsResult.rows,
    });
  } catch (err) {
    console.error('GET /api/db/statistics error:', err);
    return NextResponse.json({ error: 'Failed to fetch database statistics' }, { status: 500 });
  }
}
