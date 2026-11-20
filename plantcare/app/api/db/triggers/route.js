import { query } from '@/lib/db/pool';
import { getSession } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

/**
 * GET /api/db/triggers
 * Admin only. Returns all triggers in the public schema.
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
         trigger_name,
         event_object_table,
         event_manipulation,
         action_timing,
         action_statement,
         action_orientation
       FROM information_schema.triggers
       WHERE trigger_schema = 'public'
       ORDER BY event_object_table, trigger_name`,
      []
    );

    return NextResponse.json({ triggers: result.rows });
  } catch (err) {
    console.error('GET /api/db/triggers error:', err);
    return NextResponse.json({ error: 'Failed to fetch triggers' }, { status: 500 });
  }
}
