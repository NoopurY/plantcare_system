import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db/pool';
import { createSessionToken, setSessionCookie } from '@/lib/auth/session';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, full_name } = body;

    // Validation
    if (!full_name || full_name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Full name is required' },
        { status: 400 }
      );
    }

    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { error: 'A valid email address is required' },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user (role_id = 2 = regular user by default)
    let newUser;
    try {
      const result = await query(
        `INSERT INTO users (email, password_hash, full_name, role_id, is_active, created_at)
         VALUES ($1, $2, $3, 2, TRUE, NOW())
         RETURNING user_id, email, full_name, role_id`,
        [email.toLowerCase().trim(), password_hash, full_name.trim()]
      );
      newUser = result.rows[0];
    } catch (dbError) {
      // PostgreSQL unique violation error code
      if (dbError.code === '23505') {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }
      throw dbError;
    }

    // Create session token
    const sessionPayload = {
      user_id: newUser.user_id,
      email: newUser.email,
      full_name: newUser.full_name,
      role_id: newUser.role_id,
    };
    const token = await createSessionToken(sessionPayload);

    // Build response
    const response = NextResponse.json(
      {
        user: {
          user_id: newUser.user_id,
          email: newUser.email,
          full_name: newUser.full_name,
          role_id: newUser.role_id,
        },
      },
      { status: 201 }
    );

    // Set session cookie on the response
    await setSessionCookie(response, token);

    return response;
  } catch (error) {
    console.error('[POST /api/auth/register]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
