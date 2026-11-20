import { query } from '@/lib/db/pool';
import { getSession } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

/**
 * GET /api/db/indexes
 * Admin only. Returns all indexes in the public schema with usage stats and size.
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
         i.indexname,
         i.tablename,
         i.indexdef,
         i.schemaname,
         COALESCE(s.idx_scan, 0)                                                        AS scans,
         pg_size_pretty(
           pg_relation_size(
             quote_ident(i.schemaname) || '.' || quote_ident(i.indexname)
           )
         )                                                                               AS index_size
       FROM pg_indexes i
       LEFT JOIN pg_stat_user_indexes s ON i.indexname = s.indexrelname
       WHERE i.schemaname = 'public'
       ORDER BY i.tablename, i.indexname`,
      []
    );

    return NextResponse.json({ indexes: result.rows });
  } catch (err) {
    console.error('GET /api/db/indexes error:', err);
    return NextResponse.json({ error: 'Failed to fetch indexes' }, { status: 500 });
  }
}
