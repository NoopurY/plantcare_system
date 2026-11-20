import { query } from '@/lib/db/pool';
import { getSession } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

/**
 * GET /api/db/functions
 * Admin only. Returns all user-defined functions in the public schema
 * with arguments, return type, and full definition.
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
         p.proname                             AS function_name,
         pg_get_function_arguments(p.oid)      AS arguments,
         pg_get_function_result(p.oid)         AS return_type,
         pg_get_functiondef(p.oid)             AS definition
       FROM pg_proc p
       JOIN pg_namespace n ON p.pronamespace = n.oid
       WHERE n.nspname = 'public'
         AND p.prokind = 'f'
       ORDER BY p.proname`,
      []
    );

    return NextResponse.json({ functions: result.rows });
  } catch (err) {
    console.error('GET /api/db/functions error:', err);
    return NextResponse.json({ error: 'Failed to fetch functions' }, { status: 500 });
  }
}
