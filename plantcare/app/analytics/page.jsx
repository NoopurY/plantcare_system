'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Droplets, Heart, Leaf, BarChart3, Bug
} from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import AppShell from '@/app/components/ui/AppShell';
import StatCard from '@/app/components/ui/StatCard';

/* ─── day range toggle ───────────────────────────────────────── */
const DAY_RANGES = [7, 30, 90];

/* ─── shared dark tooltip ────────────────────────────────────── */
function DarkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '8px 14px', fontSize: 13, color: 'var(--text-primary)'
    }}>
      {label && <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--text-primary)' }}>
          <strong>{p.name}:</strong> {p.value}
        </div>
      ))}
    </div>
  );
}

const CHART_GRID = { strokeDasharray: '3 3', stroke: 'rgba(134,188,66,0.1)' };
const AXIS_TICK = { fill: 'var(--text-muted)', fontSize: 11 };

/* ─── main page ──────────────────────────────────────────────── */
export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics?days=${days}`, { credentials: 'include' });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to load analytics');
      setData(d);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* chart data */
  const wateringTrend = data?.wateringTrend ?? [];
  const healthTrend = data?.healthTrend ?? [];
  const speciesDist = data?.speciesDistribution ?? [];
  const diseaseDist = data?.diseaseFrequency ?? [];
  const summary = data?.summary ?? {};

  return (
    <AppShell>
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Header + range toggle ─────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Analytics</h1>
          <div style={{ display: 'flex', gap: 6, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: 4 }}>
            {DAY_RANGES.map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                style={{
                  padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600,
                  background: days === d ? 'var(--green-primary)' : 'transparent',
                  color: days === d ? '#0d1a0c' : 'var(--text-muted)',
                  transition: 'all 0.15s',
                }}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {/* ── Summary stats ─────────────────────────────────────── */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 12 }} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
            <StatCard label="Total Waterings" value={summary.total_waterings ?? 0} icon={Droplets} color="var(--info)" description={`Last ${days}d`} />
            <StatCard label="Avg Health Score" value={summary.avg_health_score != null ? Number(summary.avg_health_score).toFixed(1) : '—'} icon={Heart} color="var(--error)" />
            <StatCard label="Plants Logged" value={summary.plants_with_care ?? 0} icon={Leaf} color="var(--green-primary)" />
            <StatCard label="Disease Events" value={summary.disease_events ?? 0} icon={Bug} color="var(--amber)" />
          </div>
        )}

        {error && <p style={{ color: 'var(--error)', fontSize: 13 }}>Error: {error}</p>}

        {/* ── Charts 2-col ─────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Watering Trend - Area */}
          <div className="card" style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
              Watering Trend
            </h2>
            {loading ? <div className="skeleton" style={{ height: 200 }} /> :
              wateringTrend.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={wateringTrend} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                    <defs>
                      <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4a9abf" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4a9abf" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid {...CHART_GRID} vertical={false} />
                    <XAxis dataKey="date" tick={AXIS_TICK} />
                    <YAxis tick={AXIS_TICK} allowDecimals={false} />
                    <Tooltip content={<DarkTooltip />} />
                    <Area type="monotone" dataKey="count" name="Waterings" stroke="#4a9abf" strokeWidth={2} fill="url(#waterGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
          </div>

          {/* Health Score Trend - Line */}
          <div className="card" style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
              Health Score Trend
            </h2>
            {loading ? <div className="skeleton" style={{ height: 200 }} /> :
              healthTrend.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={healthTrend} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                    <CartesianGrid {...CHART_GRID} vertical={false} />
                    <XAxis dataKey="date" tick={AXIS_TICK} />
                    <YAxis domain={[0, 10]} tick={AXIS_TICK} />
                    <Tooltip content={<DarkTooltip />} />
                    <Line type="monotone" dataKey="avg_score" name="Avg Score" stroke="#86bc42" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
          </div>

          {/* Species Distribution - Bar */}
          <div className="card" style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
              Species Distribution
            </h2>
            {loading ? <div className="skeleton" style={{ height: 200 }} /> :
              speciesDist.length === 0 ? <EmptyChart /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={speciesDist} margin={{ top: 4, right: 8, bottom: 24, left: 0 }}>
                    <CartesianGrid {...CHART_GRID} vertical={false} />
                    <XAxis dataKey="name" tick={AXIS_TICK} angle={-20} textAnchor="end" interval={0} />
                    <YAxis tick={AXIS_TICK} allowDecimals={false} />
                    <Tooltip content={<DarkTooltip />} />
                    <Bar dataKey="count" name="Plants" fill="#86bc42" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
          </div>

          {/* Disease Frequency - Bar */}
          <div className="card" style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
              Disease Frequency
            </h2>
            {loading ? <div className="skeleton" style={{ height: 200 }} /> :
              diseaseDist.length === 0 ? <EmptyChart label="No disease records" /> : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={diseaseDist} margin={{ top: 4, right: 8, bottom: 24, left: 0 }}>
                    <CartesianGrid {...CHART_GRID} vertical={false} />
                    <XAxis dataKey="disease_name" tick={AXIS_TICK} angle={-20} textAnchor="end" interval={0} />
                    <YAxis tick={AXIS_TICK} allowDecimals={false} />
                    <Tooltip content={<DarkTooltip />} />
                    <Bar dataKey="count" name="Occurrences" fill="#c94a4a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function EmptyChart({ label = 'No data for this period' }) {
  return (
    <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{label}</p>
    </div>
  );
}
