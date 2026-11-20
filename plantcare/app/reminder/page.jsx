// app/reminder/page.jsx - Backward-compatible redirect to /reminders
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReminderRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/reminders');
  }, [router]);

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
      Redirecting to Care Schedules...
    </div>
  );
}
