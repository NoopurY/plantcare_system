// app/growth/page.jsx - Growth Tracking module
'use client';
import { useState, useEffect } from 'react';
import AppShell from '@/app/components/ui/AppShell';
import { Sprout, TrendingUp, Plus, Ruler, Leaf } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function GrowthPage() {
  const [logs, setLogs] = useState([]);
  const [plants, setPlants] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => { fetchPlants(); }, []);
  useEffect(() => { fetchLogs(); }, [selectedPlant]);

  async function fetchLogs() {
    setLoading(true);
    try {
      const url = '/api/growth' + (selectedPlant ? `?plant_id=${selectedPlant}` : '') + '&limit=50';
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
    const res = await fetch('/api/growth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) { setShowAdd(false); setForm({}); fetchLogs(); }
  }

  const safeLogs = Array.isArray(logs) ? logs : [];
  const chartData = [...safeLogs].reverse().slice(-20).map(l => ({
    date: new Date(l.recorded_at).toLocaleDateString(),
    height: l.height_cm,
    leaves: l.leaf_count,
  }));

  const totalGrowth = safeLogs.length >= 2 ? (safeLogs[0].height_cm - safeLogs[safeLogs.length - 1].height_cm).toFixed(1) : 0;

  return (
    <AppShell>
      <div style={{ padding: '24px', maxWidth: '1100px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ color: 'var(--text-primary)', fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>Growth Tracking</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Monitor plant height, leaf count, and growth stages</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Log Growth
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Growth Records', value: logs.length, icon: Sprout, color: '#86bc42' },
            { label: 'Height Gain (cm)', value: totalGrowth, icon: Ruler, color: '#4a9abf' },
            { label: 'Plants Tracked', value: plants.length, icon: Leaf, color: '#c9933a' },
            { label: 'Avg Height (cm)', value: logs.length ? (logs.reduce((s, l) => s + (l.height_cm || 0), 0) / logs.filter(l => l.height_cm).length).toFixed(1) : '—', icon: TrendingUp, color: '#86bc42' },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ borderColor: s.color + '33' }}>
              <s.icon size={20} style={{ color: s.color, marginBottom: '8px' }} />
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Chart + filter */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600 }}>Height Over Time</h3>
            <select className="input" value={selectedPlant} onChange={e => setSelectedPlant(e.target.value)} style={{ width: '200px', background: 'var(--bg-glass)', color: 'var(--text-primary)' }}>
              <option value="">All Plants</option>
              {plants.map(p => <option key={p.plant_id} value={p.plant_id}>{p.plant_name}</option>)}
            </select>
          </div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="heightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#86bc42" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#86bc42" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(134,188,66,0.1)" />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                <Area type="monotone" dataKey="height" stroke="#86bc42" fill="url(#heightGrad)" strokeWidth={2} name="Height (cm)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No growth data yet</div>
          )}
        </div>

        {/* Logs table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>Loading...</div>
        ) : safeLogs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            No growth records found. Log your first measurement above!
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            <table className="data-table">
              <thead>
                <tr><th>Plant</th><th>Height (cm)</th><th>Spread (cm)</th><th>Leaves</th><th>Stage</th><th>Date</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {safeLogs.map((log, i) => (
                  <tr key={log.log_id || i}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{log.plant_name || log.plant_id?.slice(0, 8)}</td>
                    <td style={{ color: '#86bc42' }}>{log.height_cm ?? '—'}</td>
                    <td>{log.spread_cm ?? '—'}</td>
                    <td>{log.leaf_count ?? '—'}</td>
                    <td>
                      {log.growth_stage && (
                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', background: 'rgba(134,188,66,0.15)', color: 'var(--green-primary)' }}>
                          {log.growth_stage}
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{new Date(log.recorded_at).toLocaleDateString()}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{log.notes || '—'}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>No growth logs yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Modal */}
        {showAdd && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)' }}>
            <div className="card" style={{ width: '460px' }}>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '20px' }}>Log Growth Measurement</h3>
              <form onSubmit={submitLog} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Plant *</label>
                  <select className="input" required value={form.plant_id || ''} onChange={e => setForm({...form, plant_id: e.target.value})} style={{ background: 'var(--bg-glass)', color: 'var(--text-primary)' }}>
                    <option value="">Select plant...</option>
                    {plants.map(p => <option key={p.plant_id} value={p.plant_id}>{p.plant_name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Height (cm)</label>
                    <input className="input" type="number" step="0.1" placeholder="e.g. 35.5" value={form.height_cm || ''} onChange={e => setForm({...form, height_cm: parseFloat(e.target.value)})} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Spread (cm)</label>
                    <input className="input" type="number" step="0.1" placeholder="e.g. 20" value={form.spread_cm || ''} onChange={e => setForm({...form, spread_cm: parseFloat(e.target.value)})} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Leaf Count</label>
                    <input className="input" type="number" placeholder="e.g. 12" value={form.leaf_count || ''} onChange={e => setForm({...form, leaf_count: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Growth Stage</label>
                    <select className="input" value={form.growth_stage || ''} onChange={e => setForm({...form, growth_stage: e.target.value})} style={{ background: 'var(--bg-glass)', color: 'var(--text-primary)' }}>
                      <option value="">Unchanged</option>
                      <option value="seedling">Seedling</option>
                      <option value="juvenile">Juvenile</option>
                      <option value="mature">Mature</option>
                      <option value="flowering">Flowering</option>
                      <option value="dormant">Dormant</option>
                    </select>
                  </div>
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
