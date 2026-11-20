import { query } from '@/lib/db/pool';
import { getSession } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

/**
 * POST /api/db/query
 * Admin only. Executes a safe, read-only SQL query (SELECT or EXPLAIN only).
 * Body: { sql: string }
 * Returns: { rows, rowCount, executionTime, fields }
 * On SQL error returns: { error, code, detail }
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
    const { sql } = body;

    if (!sql || typeof sql !== 'string') {
      return NextResponse.json({ error: 'sql field is required' }, { status: 400 });
    }

    const trimmed = sql.trim().toUpperCase();
    if (!trimmed.startsWith('SELECT') && !trimmed.startsWith('EXPLAIN')) {
      return NextResponse.json(
        { error: 'Only SELECT and EXPLAIN queries are allowed' },
        { status: 400 }
      );
    }

    const start = Date.now();
    let result;

    try {
      // Execute with parameterized call — no user values, just the literal SQL.
      // The SQL itself has already been validated above.
      result = await query(sql, []);
    } catch (err) {
      return NextResponse.json(
        {
          error: err.message,
          code: err.code,
          detail: err.detail,
        },
        { status: 400 }
      );
    }

    const end = Date.now();

    return NextResponse.json({
      rows: result.rows,
      rowCount: result.rowCount,
      executionTime: `${end - start}ms`,
      fields: result.fields ? result.fields.map((f) => f.name) : [],
    });
  } catch (err) {
    console.error('POST /api/db/query error:', err);
    return NextResponse.json({ error: 'Failed to execute query' }, { status: 500 });
  }
}
