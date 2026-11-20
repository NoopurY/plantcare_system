import { query } from '@/lib/db/pool';
import { getSession } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

/** Whitelisted table names — only these may be inspected. */
const ALLOWED_TABLES = [
  'users',
  'roles',
  'species',
  'plants',
  'care_profiles',
  'watering_logs',
  'fertilization_logs',
  'growth_logs',
  'health_logs',
  'diseases',
  'disease_records',
  'care_schedules',
  'notifications',
  'audit_logs',
];

/**
 * GET /api/db/tables/[name]
 * Admin only. Returns full detail for a single whitelisted table:
 * columns, constraints, indexes, row count, and 10 sample rows.
 */
export async function GET(request, { params }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.role_id !== 1) {
      return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 });
    }

    const { name } = await params;

    // Safety: only allow whitelisted table names
    if (!ALLOWED_TABLES.includes(name)) {
      return NextResponse.json(
        { error: `Table '${name}' is not allowed or does not exist` },
        { status: 400 }
      );
    }

    // Columns
    const columnsResult = await query(
      `SELECT column_name, data_type, character_maximum_length, is_nullable, column_default, ordinal_position
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1
       ORDER BY ordinal_position`,
      [name]
    );

    // Constraints
    const constraintsResult = await query(
      `SELECT kcu.column_name, tc.constraint_type, tc.constraint_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
       WHERE tc.table_schema = 'public' AND tc.table_name = $1`,
      [name]
    );

    // Indexes
    const indexesResult = await query(
      `SELECT indexname, indexdef
       FROM pg_indexes
       WHERE schemaname = 'public' AND tablename = $1
       ORDER BY indexname`,
      [name]
    );

    // Row count
    // Table name is from whitelist — safe to interpolate for identifier use
    const countResult = await query(
      `SELECT COUNT(*) AS row_count FROM "${name}"`,
      []
    );

    // Sample data (10 rows)
    const sampleResult = await query(
      `SELECT * FROM "${name}" LIMIT 10`,
      []
    );

    return NextResponse.json({
      table: name,
      columns: columnsResult.rows,
      constraints: constraintsResult.rows,
      indexes: indexesResult.rows,
      rowCount: parseInt(countResult.rows[0].row_count, 10),
      sampleData: sampleResult.rows,
    });
  } catch (err) {
    console.error('GET /api/db/tables/[name] error:', err);
    return NextResponse.json({ error: 'Failed to fetch table details' }, { status: 500 });
  }
}
