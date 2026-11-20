// app/reminders/page.jsx - Care Schedules & Automated Notifications
'use client';
import { useState, useEffect } from 'react';
import AppShell from '@/app/components/ui/AppShell';
import {
  Bell, Clock, Calendar, Mail, Plus, Trash2, CheckCircle2,
  Droplets, FlaskConical, Scissors, RefreshCw, AlertCircle
} from 'lucide-react';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function RemindersPage() {
  const [schedules, setSchedules] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    plant_id: '',
    task_type: 'watering',
    schedule_time: '08:00',
    schedule_days: ['monday', 'wednesday', 'friday'],
    email: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSchedules();
    fetchPlants();
  }, []);

  async function fetchSchedules() {
    setLoading(true);
    try {
      const res = await fetch('/api/reminders');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : (data.schedules || data.reminders || []);
        setSchedules(Array.isArray(list) ? list : []);
      } else {
        setSchedules([]);
      }
    } catch (err) {
      console.error('Error fetching reminders:', err);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPlants() {
    try {
      const res = await fetch('/api/plants');
      if (res.ok) {
        const data = await res.json();
        setPlants(data.plants || []);
      }
    } catch (err) {
      console.error('Error fetching plants:', err);
    }
  }

  const toggleDay = (day) => {
    setForm(prev => {
      const exists = prev.schedule_days.includes(day);
      return {
        ...prev,
        schedule_days: exists
          ? prev.schedule_days.filter(d => d !== day)
          : [...prev.schedule_days, day]
      };
    });
  };

  async function handleAddSchedule(e) {
    e.preventDefault();
    if (form.schedule_days.length === 0) {
      alert('Please select at least one day.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setShowAdd(false);
        fetchSchedules();
        setForm({
          plant_id: '',
          task_type: 'watering',
          schedule_time: '08:00',
          schedule_days: ['monday', 'wednesday', 'friday'],
          email: '',
          notes: ''
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to deactivate this care schedule?')) return;
    try {
      const res = await fetch(`/api/reminders?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchSchedules();
      }
    } catch (err) {
      console.error(err);
    }
  }

  const getTaskIcon = (type) => {
    switch (type) {
      case 'watering': return <Droplets size={16} style={{ color: '#4a9abf' }} />;
      case 'fertilizing': return <FlaskConical size={16} style={{ color: '#c9933a' }} />;
      case 'pruning': return <Scissors size={16} style={{ color: '#86bc42' }} />;
      case 'repotting': return <RefreshCw size={16} style={{ color: '#7a9a6c' }} />;
      default: return <Bell size={16} style={{ color: 'var(--green-primary)' }} />;
    }
  };

  return (
    <AppShell>
      <div style={{ padding: '28px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{ background: 'rgba(134,188,66,0.15)', padding: '8px', borderRadius: '10px' }}>
                <Bell size={24} style={{ color: 'var(--green-primary)' }} />
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Care Schedules & Reminders
              </h1>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '640px', margin: 0 }}>
              Automated care triggers backed by PostgreSQL cron &amp; event triggers. Schedules are mapped in the <code>care_schedules</code> table.
            </p>
          </div>

          <button className="btn btn-primary" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} />
            <span>Create Schedule</span>
          </button>
        </div>

        {/* Schedule List */}
        {loading ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            {[1, 2, 3].map(i => <div key={i} className="card skeleton" style={{ height: '110px' }} />)}
          </div>
        ) : (!Array.isArray(schedules) || schedules.length === 0) ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Clock size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>No Active Schedules</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
              Keep your plant routine consistent by scheduling watering and fertilizing notifications.
            </p>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
              Set Your First Reminder
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {schedules.map((sc) => (
              <div
                key={sc.schedule_id}
                className="card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '20px 24px',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {getTaskIcon(sc.task_type)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <h4 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, textTransform: 'capitalize' }}>
                        {sc.task_type}
                      </h4>
                      <span className="badge badge-healthy" style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                        {sc.plant_name || 'All Plants'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Clock size={14} style={{ color: 'var(--text-muted)' }} />
                        {sc.schedule_time?.slice(0, 5) || '08:00'}
                      </span>
                      {sc.email && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                          {sc.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {DAYS.map(day => {
                      const daysArray = Array.isArray(sc.schedule_days)
                        ? sc.schedule_days
                        : (typeof sc.schedule_days === 'string'
                            ? sc.schedule_days.replace(/[{}"[\]]/g, '').split(',').map(s => s.trim())
                            : []);
                      const active = daysArray.some(d => String(d).toLowerCase() === day);
                      return (
                        <span
                          key={day}
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background: active ? 'rgba(134,188,66,0.2)' : 'rgba(255,255,255,0.04)',
                            color: active ? 'var(--green-primary)' : 'var(--text-muted)',
                            border: active ? '1px solid var(--green-primary)' : '1px solid transparent'
                          }}
                        >
                          {day.slice(0, 2)}
                        </span>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handleDelete(sc.schedule_id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '8px',
                      transition: 'color 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--error)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Modal */}
        {showAdd && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(5px)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
          >
            <div
              className="card"
              style={{
                width: '100%',
                maxWidth: '520px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-strong)',
                padding: '28px'
              }}
            >
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                New Care Routine Schedule
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
                Inserts into <code>care_schedules</code> table and activates database reminder triggers.
              </p>

              <form onSubmit={handleAddSchedule} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Target Plant</label>
                  <select
                    className="input"
                    value={form.plant_id}
                    onChange={e => setForm({ ...form, plant_id: e.target.value })}
                  >
                    <option value="">All Plants (Collection-wide)</option>
                    {plants.map(p => (
                      <option key={p.plant_id} value={p.plant_id}>{p.plant_name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Task Type *</label>
                    <select
                      className="input"
                      value={form.task_type}
                      onChange={e => setForm({ ...form, task_type: e.target.value })}
                    >
                      <option value="watering">Watering</option>
                      <option value="fertilizing">Fertilizing</option>
                      <option value="repotting">Repotting</option>
                      <option value="pruning">Pruning</option>
                      <option value="inspection">Inspection</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Notification Time *</label>
                    <input
                      type="time"
                      className="input"
                      required
                      value={form.schedule_time}
                      onChange={e => setForm({ ...form, schedule_time: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Repeat Days *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                    {DAYS.map(day => {
                      const sel = form.schedule_days.includes(day);
                      return (
                        <button
                          type="button"
                          key={day}
                          onClick={() => toggleDay(day)}
                          style={{
                            padding: '10px 0',
                            borderRadius: '8px',
                            border: '1px solid',
                            borderColor: sel ? 'var(--green-primary)' : 'var(--border)',
                            background: sel ? 'rgba(134,188,66,0.2)' : 'transparent',
                            color: sel ? 'var(--green-primary)' : 'var(--text-secondary)',
                            fontWeight: 700,
                            fontSize: '11px',
                            cursor: 'pointer',
                            textTransform: 'uppercase'
                          }}
                        >
                          {day.slice(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Recipient Email</label>
                  <input
                    type="email"
                    className="input"
                    placeholder="Enter email for alerts"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)} style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1 }}>
                    {saving ? 'Saving...' : 'Save Schedule'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
