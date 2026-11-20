import { query } from '@/lib/db/pool';
import { getSession } from '@/lib/auth/session';
import { NextResponse } from 'next/server';

/**
 * GET /api/reminders
 * Returns active care_schedules for the authenticated user.
 * JOINs with plants to include plant_name.
 */
export async function GET(request) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = session.role_id === 1;
    const userId = session.user_id || session.sub;

    const result = await query(
      `SELECT cs.*, p.plant_name
       FROM care_schedules cs
       LEFT JOIN plants p ON cs.plant_id = p.plant_id
       WHERE cs.is_active = TRUE ${isAdmin ? '' : 'AND cs.user_id = $1'}
       ORDER BY cs.schedule_time ASC`,
      isAdmin ? [] : [userId]
    );

    return NextResponse.json({
      reminders: result.rows,
      schedules: result.rows,
    });
  } catch (err) {
    console.error('GET /api/reminders error:', err);
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
  }
}

/**
 * POST /api/reminders
 * Inserts a new care_schedule for the authenticated user.
 * Body: { plant_id (optional), task_type, schedule_time, schedule_days (array), email, notes }
 */
export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plant_id, task_type, schedule_time, schedule_days, email, notes } = body;

    if (!task_type || !schedule_time) {
      return NextResponse.json(
        { error: 'task_type and schedule_time are required' },
        { status: 400 }
      );
    }

    // If plant_id provided, verify ownership
    if (plant_id) {
      const ownerCheck = await query(
        `SELECT plant_id FROM plants WHERE plant_id = $1 AND user_id = $2 AND is_active = TRUE`,
        [plant_id, session.user_id]
      );
      if (ownerCheck.rows.length === 0) {
        return NextResponse.json(
          { error: 'Plant not found or does not belong to you' },
          { status: 403 }
        );
      }
    }

    const result = await query(
      `INSERT INTO care_schedules (user_id, plant_id, task_type, schedule_time, schedule_days, email, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [session.user_id, plant_id || null, task_type, schedule_time, schedule_days, email, notes]
    );

    return NextResponse.json({ reminder: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('POST /api/reminders error:', err);
    return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 });
  }
}

/**
 * DELETE /api/reminders?id=<schedule_id>
 * Soft-deletes a care_schedule (sets is_active = FALSE).
 * Ensures the schedule belongs to the authenticated user.
 */
export async function DELETE(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id query param is required' }, { status: 400 });
    }

    const result = await query(
      `UPDATE care_schedules
       SET is_active = FALSE
       WHERE schedule_id = $1 AND user_id = $2
       RETURNING schedule_id`,
      [id, session.user_id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Reminder not found or does not belong to you' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Reminder deactivated successfully' });
  } catch (err) {
    console.error('DELETE /api/reminders error:', err);
    return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 });
  }
}
