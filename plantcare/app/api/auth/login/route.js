import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db/pool';
import { createSessionToken, setSessionCookie } from '@/lib/auth/session';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Fetch user by email
    const result = await query(
      `SELECT user_id, email, password_hash, full_name, role_id
       FROM users
       WHERE email = $1 AND is_active = TRUE`,
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // Compare password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last_login_at
    await query(
      `UPDATE users SET last_login_at = NOW() WHERE user_id = $1`,
      [user.user_id]
    );

    // Insert audit log
    await query(
      `INSERT INTO audit_logs (user_id, action, entity, entity_id, created_at)
       VALUES ($1, 'LOGIN', 'users', $2, NOW())`,
      [user.user_id, user.user_id]
    );

    // Create session token
    const sessionPayload = {
      user_id: user.user_id,
      email: user.email,
      full_name: user.full_name,
      role_id: user.role_id,
    };
    const token = await createSessionToken(sessionPayload);

    // Build response
    const response = NextResponse.json({
      user: {
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        role_id: user.role_id,
      },
    });

    // Set session cookie on the response
    await setSessionCookie(response, token);

    return response;
  } catch (error) {
    console.error('[POST /api/auth/login]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
