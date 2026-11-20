import { query } from '@/lib/db/pool';
import { getSession } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

/**
 * GET /api/notifications
 * Returns notifications for the authenticated user, ordered by created_at DESC.
 * Supports optional ?unread_only=true filter.
 */
export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread_only') === 'true';

    let sql = `
      SELECT * FROM notifications
      WHERE user_id = $1
    `;
    const params = [session.user_id];

    if (unreadOnly) {
      sql += ` AND is_read = FALSE`;
    }

    sql += ` ORDER BY created_at DESC`;

    const result = await query(sql, params);
    return NextResponse.json({ notifications: result.rows });
  } catch (err) {
    console.error('GET /api/notifications error:', err);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

/**
 * PATCH /api/notifications
 * Marks a single notification as read.
 * Body: { notification_id }
 */
export async function PATCH(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notification_id } = body;

    if (!notification_id) {
      return NextResponse.json({ error: 'notification_id is required' }, { status: 400 });
    }

    const result = await query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE notification_id = $1 AND user_id = $2
       RETURNING notification_id`,
      [notification_id, session.user_id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Notification not found or does not belong to you' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('PATCH /api/notifications error:', err);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}

/**
 * DELETE /api/notifications?all=true
 * Marks ALL notifications for the authenticated user as read.
 */
export async function DELETE(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all');

    if (all !== 'true') {
      return NextResponse.json(
        { error: 'Use ?all=true to mark all notifications as read' },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE user_id = $1 AND is_read = FALSE
       RETURNING notification_id`,
      [session.user_id]
    );

    return NextResponse.json({ message: `Marked ${result.rowCount} notifications as read` });
  } catch (err) {
    console.error('DELETE /api/notifications error:', err);
    return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 });
  }
}
