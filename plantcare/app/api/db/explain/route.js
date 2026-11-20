import { query } from '@/lib/db/pool';
import getPool from '@/lib/db/pool';
import { getSession } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

/**
 * POST /api/db/explain
 * Admin only. Returns the query plan for a SELECT statement.
 * Body: { sql: string, analyze: boolean }
 *
 * - If analyze=true, runs EXPLAIN (ANALYZE, FORMAT JSON) inside a transaction
 *   that is immediately rolled back to prevent any side effects.
 * - Otherwise runs EXPLAIN (FORMAT JSON) with no transaction overhead.
 *
 * Returns: { plan: <JSON plan object>, sql }
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
    const { sql, analyze = false } = body;

    if (!sql || typeof sql !== 'string') {
      return NextResponse.json({ error: 'sql field is required' }, { status: 400 });
    }

    const trimmed = sql.trim().toUpperCase();
    if (!trimmed.startsWith('SELECT')) {
      return NextResponse.json(
        { error: 'Only SELECT queries can be explained' },
        { status: 400 }
      );
    }

    let plan;

    if (analyze) {
      // Wrap in a transaction and rollback so ANALYZE doesn't commit anything.
      // Must use a single client for BEGIN/EXPLAIN/ROLLBACK — the shared
      // query() helper checks out a fresh pooled connection per call, which
      // would run each statement on a different session.
      const client = await getPool().connect();
      try {
        await client.query('BEGIN');
        try {
          const result = await client.query(`EXPLAIN (ANALYZE, FORMAT JSON) ${sql}`);
          plan = result.rows[0]['QUERY PLAN'];
        } finally {
          await client.query('ROLLBACK');
        }
      } finally {
        client.release();
      }
    } else {
      const result = await query(`EXPLAIN (FORMAT JSON) ${sql}`, []);
      plan = result.rows[0]['QUERY PLAN'];
    }

    return NextResponse.json({ plan, sql });
  } catch (err) {
    console.error('POST /api/db/explain error:', err);
    return NextResponse.json({ error: 'Failed to explain query', detail: err.message }, { status: 500 });
  }
}
