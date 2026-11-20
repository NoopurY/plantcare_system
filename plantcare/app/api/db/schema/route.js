import { query } from '@/lib/db/pool';
import { getSession } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

/**
 * GET /api/db/schema
 * Admin only. Returns full schema grouped by table including columns and constraints.
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

    // Fetch all columns for public schema
    const columnsResult = await query(
      `SELECT
         c.table_name,
         c.column_name,
         c.data_type,
         c.character_maximum_length,
         c.is_nullable,
         c.column_default,
         c.ordinal_position
       FROM information_schema.columns c
       WHERE c.table_schema = 'public'
       ORDER BY c.table_name, c.ordinal_position`,
      []
    );

    // Fetch all constraints for public schema
    const constraintsResult = await query(
      `SELECT
         kcu.table_name,
         kcu.column_name,
         tc.constraint_type,
         tc.constraint_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
       WHERE tc.table_schema = 'public'`,
      []
    );

    // Group columns and constraints by table_name
    const tables = {};

    for (const col of columnsResult.rows) {
      if (!tables[col.table_name]) {
        tables[col.table_name] = { columns: [], constraints: [] };
      }
      tables[col.table_name].columns.push(col);
    }

    for (const con of constraintsResult.rows) {
      if (!tables[con.table_name]) {
        tables[con.table_name] = { columns: [], constraints: [] };
      }
      tables[con.table_name].constraints.push(con);
    }

    return NextResponse.json({ tables });
  } catch (err) {
    console.error('GET /api/db/schema error:', err);
    return NextResponse.json({ error: 'Failed to fetch schema' }, { status: 500 });
  }
}
