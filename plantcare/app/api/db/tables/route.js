import { query } from '@/lib/db/pool';
import { getSession } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

/**
 * GET /api/db/tables
 * Admin only. Returns table list with stats from pg_stat_user_tables,
 * column count, and index count.
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

    const result = await query(
      `SELECT
         t.table_name,
         s.n_live_tup                                                                    AS row_estimate,
         s.n_dead_tup,
         s.last_vacuum,
         s.last_analyze,
         s.last_autoanalyze,
         (SELECT COUNT(*)
          FROM information_schema.columns c
          WHERE c.table_name = t.table_name
            AND c.table_schema = 'public')                                               AS column_count,
         (SELECT COUNT(*)
          FROM pg_indexes i
          WHERE i.tablename = t.table_name
            AND i.schemaname = 'public')                                                 AS index_count
       FROM information_schema.tables t
       LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name
       WHERE t.table_schema = 'public'
         AND t.table_type = 'BASE TABLE'
       ORDER BY t.table_name`,
      []
    );

    return NextResponse.json({ tables: result.rows });
  } catch (err) {
    console.error('GET /api/db/tables error:', err);
    return NextResponse.json({ error: 'Failed to fetch table list' }, { status: 500 });
  }
}
