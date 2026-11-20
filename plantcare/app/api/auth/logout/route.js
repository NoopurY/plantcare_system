import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth/session';

export async function POST() {
  try {
    const response = NextResponse.json({ message: 'Logged out' });
    await clearSession(response);
    return response;
  } catch (error) {
    console.error('[POST /api/auth/logout]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
