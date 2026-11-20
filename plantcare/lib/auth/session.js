// lib/auth/session.js
// JWT-based session management for VerdeBase
// Replaces Supabase Auth with direct PostgreSQL-backed authentication

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'verdebase-dev-secret-change-in-production-min-32-chars'
);
const COOKIE_NAME = 'verdebase_session';
const SESSION_DURATION = '7d';

/**
 * Create a signed JWT session token for a user.
 * @param {Object} user - { user_id, email, role_id, full_name }
 * @returns {Promise<string>} Signed JWT token
 */
export async function createSessionToken(user) {
  const userId = user.user_id || user.id || user.sub;
  return new SignJWT({
    sub:       userId,
    user_id:   userId,
    email:     user.email,
    role_id:   user.role_id,
    full_name: user.full_name,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(SECRET);
}

/**
 * Verify and decode a JWT token.
 * @param {string} token
 * @returns {Promise<Object|null>} Decoded payload or null if invalid
 */
export async function verifySessionToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (payload && !payload.user_id && payload.sub) {
      payload.user_id = payload.sub;
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Set the session cookie.
 * Supports both setSessionCookie(token) and setSessionCookie(response, token).
 * @param {any} arg1 - response OR token
 * @param {string} [arg2] - token if arg1 is response
 */
export async function setSessionCookie(arg1, arg2) {
  let res = null;
  let token = arg1;

  if (arg2) {
    res = arg1;
    token = arg2;
  }

  const cookieOptions = {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 7, // 7 days
    path:     '/',
  };

  // If response object passed, set directly on its cookies
  if (res && res.cookies && typeof res.cookies.set === 'function') {
    res.cookies.set(COOKIE_NAME, token, cookieOptions);
  }

  // Also set via next/headers cookies() store
  try {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, cookieOptions);
  } catch (err) {
    // cookies() can throw in some Next.js edge contexts; safe to ignore if res.cookies was set
  }
}

/**
 * Get the current session from cookie.
 * Supports getSession() or getSession(request).
 * @param {any} [maybeRequest]
 * @returns {Promise<Object|null>} Session payload or null
 */
export async function getSession(maybeRequest) {
  let token = null;

  // Try reading from request if provided
  if (maybeRequest && maybeRequest.cookies) {
    if (typeof maybeRequest.cookies.get === 'function') {
      token = maybeRequest.cookies.get(COOKIE_NAME)?.value;
    }
  }

  // Fallback to next/headers cookies()
  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(COOKIE_NAME)?.value;
    } catch (err) {}
  }

  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Clear the session cookie (logout).
 * Supports clearSession() or clearSession(response).
 * @param {any} [maybeResponse]
 */
export async function clearSession(maybeResponse) {
  if (maybeResponse && maybeResponse.cookies && typeof maybeResponse.cookies.delete === 'function') {
    maybeResponse.cookies.delete(COOKIE_NAME);
  }
  try {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
  } catch (err) {}
}

/**
 * Require authentication — returns session or throws.
 * @returns {Promise<Object>} Session payload
 */
export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}

/**
 * Require admin role — returns session or throws.
 * @returns {Promise<Object>} Session payload
 */
export async function requireAdmin() {
  const session = await requireAuth();
  if (session.role_id !== 1) {
    throw new Error('FORBIDDEN');
  }
  return session;
}
