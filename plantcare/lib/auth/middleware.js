// lib/auth/middleware.js
// Helper to protect API routes and read session in server components

import { getSession } from './session';
import { NextResponse } from 'next/server';

/**
 * Wrap an API handler with authentication check.
 * Returns 401 if not authenticated.
 *
 * Usage:
 *   export const GET = withAuth(async (req, session) => { ... });
 */
export function withAuth(handler) {
  return async function(req, context) {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return handler(req, session, context);
  };
}

/**
 * Wrap an API handler with admin-only authentication check.
 * Returns 403 if not admin.
 */
export function withAdmin(handler) {
  return async function(req, context) {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.role_id !== 1) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return handler(req, session, context);
  };
}

/**
 * Standard API error response helper.
 */
export function apiError(message, status = 500, detail = null) {
  const body = { error: message };
  if (detail && process.env.NODE_ENV === 'development') {
    body.detail = String(detail);
  }
  return NextResponse.json(body, { status });
}

/**
 * Standard API success response helper.
 */
export function apiSuccess(data, status = 200) {
  return NextResponse.json(data, { status });
}
