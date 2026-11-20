// app/health/page.jsx - Health Tracking module
'use client';
import { useState, useEffect } from 'react';
import AppShell from '@/app/components/ui/AppShell';
import HealthBadge from '@/app/components/ui/HealthBadge';
import { Heart, AlertTriangle, CheckCircle, Activity, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>{label}</p>
        <p style={{ color: '#86bc42', fontWeight: 600 }}>Score: {payload[0].value}/100</p>
      </div>
    );
  }
  return null;
};

export default function HealthPage() {
  const [logs, setLogs] = useState([]);
  const [plants, setPlants] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ health_status: 'healthy', health_score: 80 });

  useEffect(() => { fetchLogs(); fetchPlants(); }, []);
  useEffect(() => { fetchLogs(); }, [selectedPlant]);

  async function fetchLogs() {
    setLoading(true);
    try {
      const url = '/api/health' + (selectedPlant ? `?plant_id=${selectedPlant}` : '') + '&limit=50';
      const res = await fetch(url);
      if (res.ok) {
        const d = await res.json();
        const list = Array.isArray(d) ? d : (d.logs || []);
        setLogs(Array.isArray(list) ? list : []);
      } else {
        setLogs([]);
      }
    } catch {
      setLogs([]);
    }
    setLoading(false);
  }

  async function fetchPlants() {
    try {
      const res = await fetch('/api/plants');
      if (res.ok) { const d = await res.json(); setPlants(d.plants || []); }
    } catch {}
  }

  async function submitLog(e) {
    e.preventDefault();
    const res = await fetch('/api/health', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) { setShowAdd(false); setForm({ health_status: 'healthy', health_score: 80 }); fetchLogs(); }
  }

  const safeLogs = Array.isArray(logs) ? logs : [];

  // Build chart data per plant
  const chartData = safeLogs
    .filter(l => l.plant_id === (selectedPlant || l.plant_id))
    .slice(-20)
    .reverse()
    .map(l => ({
      date: new Date(l.recorded_at).toLocaleDateString(),
      score: l.health_score,
    }));

  const stats = {
    total: safeLogs.length,
    avgScore: safeLogs.length ? Math.round(safeLogs.reduce((s, l) => s + (l.health_score || 0), 0) / safeLogs.length) : 0,
    critical: safeLogs.filter(l => (l.health_score || 0) < 30).length,
    healthy: safeLogs.filter(l => (l.health_score || 0) >= 75).length,
  };

  return (
    <AppShell>
      <div style={{ padding: '24px', maxWidth: '1100px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ color: 'var(--text-primary)', fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Health Tracking</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Monitor plant health scores over time</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Log Health Check
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Total Checks', value: stats.total, icon: Activity, color: '#4a9abf' },
            { label: 'Avg Score', value: `${stats.avgScore}/100`, icon: Heart, color: '#86bc42' },
            { label: 'Healthy (≥75)', value: stats.healthy, icon: CheckCircle, color: '#86bc42' },
            { label: 'Critical (<30)', value: stats.critical, icon: AlertTriangle, color: '#c94a4a' },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ borderColor: s.color + '33' }}>
              <s.icon size={20} style={{ color: s.color, marginBottom: '8px' }} />
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter + Chart */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600 }}>Health Score Trend</h3>
              <select className="input" value={selectedPlant} onChange={e => setSelectedPlant(e.target.value)} style={{ width: '180px', background: 'var(--bg-glass)', color: 'var(--text-primary)' }}>
                <option value="">All Plants</option>
                {plants.map(p => <option key={p.plant_id} value={p.plant_id}>{p.plant_name}</option>)}
              </select>
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(134,188,66,0.1)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="score" stroke="#86bc42" strokeWidth={2} dot={{ fill: '#86bc42', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                No health data yet
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Current Plant Status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {plants.slice(0, 6).map(p => (
                <div key={p.plant_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-primary)', fontSize: '14px' }}>{p.plant_name}</span>
                  <HealthBadge status={p.health_status} />
                </div>
              ))}
              {plants.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>No plants yet</p>}
            </div>
          </div>
        </div>

        {/* Logs Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>Loading...</div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Plant</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Symptoms</th>
                  <th>Date</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {safeLogs.map((log, i) => (
                  <tr key={log.log_id || i}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{log.plant_name || log.plant_id?.slice(0, 8)}</td>
                    <td><HealthBadge status={log.health_status} /></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '6px', background: 'var(--bg-glass)', borderRadius: '3px' }}>
                          <div style={{ width: `${log.health_score}%`, height: '100%', borderRadius: '3px', background: log.health_score >= 75 ? '#86bc42' : log.health_score >= 45 ? '#c9933a' : '#c94a4a' }} />
                        </div>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '12px', minWidth: '40px' }}>{log.health_score}/100</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {log.symptoms?.length ? log.symptoms.join(', ') : '—'}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{new Date(log.recorded_at).toLocaleDateString()}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{log.notes || '—'}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>No health logs yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Modal */}
        {showAdd && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}>
            <div className="card" style={{ width: '460px' }}>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '20px' }}>Log Health Check</h3>
              <form onSubmit={submitLog} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Plant *</label>
                  <select className="input" required value={form.plant_id || ''} onChange={e => setForm({...form, plant_id: e.target.value})} style={{ background: 'var(--bg-glass)', color: 'var(--text-primary)' }}>
                    <option value="">Select plant...</option>
                    {plants.map(p => <option key={p.plant_id} value={p.plant_id}>{p.plant_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Health Status *</label>
                  <select className="input" required value={form.health_status} onChange={e => setForm({...form, health_status: e.target.value})} style={{ background: 'var(--bg-glass)', color: 'var(--text-primary)' }}>
                    <option value="healthy">Healthy</option>
                    <option value="needs_attention">Needs Attention</option>
                    <option value="critical">Critical</option>
                    <option value="recovering">Recovering</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Health Score * (0–100): <strong style={{ color: 'var(--green-primary)' }}>{form.health_score}</strong>
                  </label>
                  <input type="range" min="0" max="100" value={form.health_score} onChange={e => setForm({...form, health_score: parseInt(e.target.value)})} style={{ width: '100%', accentColor: 'var(--green-primary)' }} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Notes</label>
                  <textarea className="input" rows={3} placeholder="Observations..." value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} style={{ resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)} style={{ flex: 1 }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
