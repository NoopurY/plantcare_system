import { query } from '@/lib/db/pool';
import { getSession } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

/**
 * GET /api/db/views
 * Admin only. Returns all views in the public schema with their definitions
 * and column information.
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

    // All view definitions
    const viewsResult = await query(
      `SELECT table_name AS view_name, view_definition
       FROM information_schema.views
       WHERE table_schema = 'public'
       ORDER BY table_name`,
      []
    );

    // Columns for all views
    const columnsResult = await query(
      `SELECT table_name AS view_name, column_name, data_type, ordinal_position
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name IN (
           SELECT table_name FROM information_schema.views WHERE table_schema = 'public'
         )
       ORDER BY table_name, ordinal_position`,
      []
    );

    // Group columns by view name
    const columnsByView = {};
    for (const col of columnsResult.rows) {
      if (!columnsByView[col.view_name]) {
        columnsByView[col.view_name] = [];
      }
      columnsByView[col.view_name].push(col);
    }

    const views = viewsResult.rows.map((v) => ({
      ...v,
      columns: columnsByView[v.view_name] || [],
    }));

    return NextResponse.json({ views });
  } catch (err) {
    console.error('GET /api/db/views error:', err);
    return NextResponse.json({ error: 'Failed to fetch views' }, { status: 500 });
  }
}
