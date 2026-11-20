'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Leaf, CheckCircle, AlertCircle, AlertTriangle, CalendarDays,
  Droplets, Activity, Heart, Clock
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import AppShell from '@/app/components/ui/AppShell';
import StatCard from '@/app/components/ui/StatCard';

/* ── helpers ───────────────────────────────────────────────── */
function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function greetingPhrase() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const ACTIVITY_ICONS = {
  watering: Droplets,
  fertilization: Leaf,
  health_check: Heart,
  growth: Activity,
};

const PIE_COLORS = ['#86bc42', '#c9933a', '#c94a4a', '#4a9abf'];

/* ── skeleton ──────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="skeleton" style={{ height: 100, borderRadius: 12 }} />
  );
}

/* ── custom pie tooltip ────────────────────────────────────── */
function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '8px 14px', fontSize: 13, color: 'var(--text-primary)'
    }}>
      <strong>{payload[0].name}</strong>: {payload[0].value}
    </div>
  );
}

/* ── bar tooltip ───────────────────────────────────────────── */
function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '8px 14px', fontSize: 13, color: 'var(--text-primary)'
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
      <strong>{payload[0].value} plants</strong>
    </div>
  );
}

/* ── main page ─────────────────────────────────────────────── */
export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/dashboard', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(e => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, []);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  /* build chart data */
  const pieData = data ? [
    { name: 'Healthy', value: data.stats?.healthy_plants ?? 0 },
    { name: 'Needs Attention', value: data.stats?.needs_attention ?? 0 },
    { name: 'Critical', value: data.stats?.critical ?? 0 },
  ].filter(d => d.value > 0) : [];

  const barData = (data?.speciesDistribution ?? []).map(s => ({
    name: s.common_name || s.scientific_name || 'Unknown',
    count: Number(s.count),
  }));

  return (
    <AppShell>
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Greeting ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              {greetingPhrase()}{data?.user?.name ? `, ${data.user.name}` : ''} 🌿
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '4px 0 0' }}>{today}</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/plants?action=add" className="btn btn-primary">
              <Leaf size={15} /> Add Plant
            </Link>
          </div>
        </div>

        {/* ── Stats Row ────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard label="Total Plants" value={data?.stats?.total_plants ?? 0} icon={Leaf} color="var(--green-primary)" />
              <StatCard label="Healthy" value={data?.stats?.healthy_plants ?? 0} icon={CheckCircle} color="#4caf7d" />
              <StatCard label="Needs Attention" value={data?.stats?.needs_attention ?? 0} icon={AlertCircle} color="var(--amber)" />
              <StatCard label="Critical" value={data?.stats?.critical ?? 0} icon={AlertTriangle} color="var(--error)" />
              <StatCard label="Tasks Today" value={data?.stats?.care_tasks_today ?? 0} icon={CalendarDays} color="var(--info)" />
            </>
          )}
        </div>

        {/* ── Two-column layout ────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>

          {/* LEFT: charts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>

            {/* Pie chart */}
            <div className="card">
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
                Plant Health Distribution
              </h2>
              {loading ? (
                <div className="skeleton" style={{ height: 220 }} />
              ) : pieData.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No plant data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={3}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                    <Legend
                      formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{v}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Bar chart */}
            <div className="card">
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
                Species Distribution
              </h2>
              {loading ? (
                <div className="skeleton" style={{ height: 220 }} />
              ) : barData.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px 0' }}>No species data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barData} margin={{ top: 4, right: 8, bottom: 24, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(134,188,66,0.1)" vertical={false} />
                    <XAxis
                      dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                      angle={-30} textAnchor="end" interval={0}
                    />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} allowDecimals={false} />
                    <Tooltip content={<BarTooltip />} />
                    <Bar dataKey="count" fill="#86bc42" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* RIGHT: activity + notifications */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Recent Activity */}
            <div className="card" style={{ flex: 1 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
                Recent Activity
              </h2>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8 }} />
                  ))}
                </div>
              ) : (data?.recentActivity ?? []).length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0', fontSize: 14 }}>
                  No recent activity
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {(data.recentActivity ?? []).slice(0, 5).map((act, i) => {
                    const Icon = ACTIVITY_ICONS[act.activity_type] || Activity;
                    return (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        padding: '10px 8px', borderRadius: 8,
                        borderBottom: i < 4 ? '1px solid var(--border-muted)' : 'none',
                      }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                          background: 'rgba(134,188,66,0.12)', color: 'var(--green-primary)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Icon size={15} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {act.plant_name || 'Unknown plant'}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {act.activity_note || act.activity_type}
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-faint)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={10} /> {timeAgo(act.activity_date || act.created_at)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Notifications</h2>
                <Link href="/reminders" style={{ fontSize: 12, color: 'var(--green-primary)', textDecoration: 'none' }}>
                  View all →
                </Link>
              </div>
              {loading ? (
                <div className="skeleton" style={{ height: 40 }} />
              ) : (
                <div style={{
                  padding: '10px 14px', background: 'rgba(134,188,66,0.08)', borderRadius: 8,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <span style={{
                    width: 28, height: 28, borderRadius: '50%', background: 'var(--green-primary)',
                    color: '#0d1a0c', fontWeight: 700, fontSize: 13,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {data?.unreadNotifications ?? 0}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>unread notification{(data?.unreadNotifications ?? 0) !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Quick Actions ─────────────────────────────────────── */}
        <div className="card">
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px', color: 'var(--text-primary)' }}>Quick Actions</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/plants?action=add" className="btn btn-primary">
              <Leaf size={15} /> Add Plant
            </Link>
            <Link href="/plants?action=water" className="btn btn-ghost">
              <Droplets size={15} /> Log Watering
            </Link>
            <Link href="/health" className="btn btn-ghost">
              <Heart size={15} /> Log Health Check
            </Link>
          </div>
        </div>

        {error && (
          <p style={{ color: 'var(--error)', fontSize: 13 }}>Error: {error}</p>
        )}
      </div>
    </AppShell>
  );
}
