// app/care/page.jsx - Care Management Hub
'use client';
import { useState, useEffect } from 'react';
import AppShell from '@/app/components/ui/AppShell';
import { Droplets, Sprout, Heart, FlaskConical, Plus, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

const CARE_TYPES = [
  { key: 'watering',      label: 'Watering',       icon: Droplets,   color: '#4a9abf', api: '/api/watering'      },
  { key: 'fertilization', label: 'Fertilization',   icon: FlaskConical, color: '#c9933a', api: '/api/fertilization' },
  { key: 'growth',        label: 'Growth',          icon: Sprout,     color: '#86bc42', api: '/api/growth'        },
  { key: 'health',        label: 'Health Checks',   icon: Heart,      color: '#c94a4a', api: '/api/health'        },
];

export default function CarePage() {
  const [activeTab, setActiveTab] = useState('watering');
  const [logs, setLogs] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({});
  const router = useRouter();

  const current = CARE_TYPES.find(t => t.key === activeTab);

  useEffect(() => {
    fetchLogs();
    fetchPlants();
  }, [activeTab]);

  async function fetchLogs() {
    setLoading(true);
    try {
      const res = await fetch(current.api + '?limit=20');
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
    const res = await fetch(current.api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowAdd(false);
      setForm({});
      fetchLogs();
    }
  }

  return (
    <AppShell>
      <div style={{ padding: '24px', maxWidth: '1100px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>
            Care Management
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            Log and track all care activities for your plants
          </p>
        </div>

        {/* Tab Bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
          {CARE_TYPES.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 18px',
                border: 'none', cursor: 'pointer',
                background: 'transparent',
                color: activeTab === t.key ? t.color : 'var(--text-muted)',
                borderBottom: activeTab === t.key ? `2px solid ${t.color}` : '2px solid transparent',
                fontWeight: activeTab === t.key ? 600 : 400,
                fontSize: '14px',
                transition: 'all 0.15s',
                marginBottom: '-1px',
              }}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Add Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button className="btn btn-primary" onClick={() => { setShowAdd(true); setForm(activeTab === 'watering' ? { method: 'hand_watering' } : activeTab === 'health' ? { health_status: 'healthy' } : {}); }}>
            <Plus size={16} /> Log {current.label}
          </button>
        </div>

        {/* Logs Table */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>Loading...</div>
        ) : (!Array.isArray(logs) || logs.length === 0) ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
            <current.icon size={48} style={{ color: current.color, marginBottom: '16px' }} />
            <p style={{ color: 'var(--text-muted)' }}>No {current.label.toLowerCase()} logs yet. Add your first one!</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Plant</th>
                  <th>Date</th>
                  {activeTab === 'watering' && <><th>Quantity</th><th>Method</th></>}
                  {activeTab === 'fertilization' && <><th>Fertilizer</th><th>Quantity</th></>}
                  {activeTab === 'growth' && <><th>Height (cm)</th><th>Leaf Count</th><th>Stage</th></>}
                  {activeTab === 'health' && <><th>Status</th><th>Score</th></>}
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={log.log_id || i}>
                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{log.plant_name || log.plant_id?.slice(0, 8)}</td>
                    <td>{new Date(log.watered_at || log.applied_at || log.recorded_at).toLocaleDateString()}</td>
                    {activeTab === 'watering' && (
                      <><td>{log.quantity_ml ? `${log.quantity_ml} ml` : '—'}</td><td>{log.method || '—'}</td></>
                    )}
                    {activeTab === 'fertilization' && (
                      <><td>{log.fertilizer_type}</td><td>{log.quantity_grams ? `${log.quantity_grams}g` : '—'}</td></>
                    )}
                    {activeTab === 'growth' && (
                      <><td>{log.height_cm ?? '—'}</td><td>{log.leaf_count ?? '—'}</td><td>{log.growth_stage || '—'}</td></>
                    )}
                    {activeTab === 'health' && (
                      <><td>{log.health_status}</td><td style={{ color: log.health_score >= 75 ? 'var(--green-primary)' : log.health_score >= 45 ? 'var(--amber)' : 'var(--error)' }}>{log.health_score}/100</td></>
                    )}
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{log.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add Log Modal */}
        {showAdd && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 50, backdropFilter: 'blur(4px)'
          }}>
            <div className="card" style={{ width: '480px', maxHeight: '90vh', overflow: 'auto' }}>
              <h3 style={{ color: 'var(--text-primary)', marginBottom: '20px' }}>Log {current.label}</h3>
              <form onSubmit={submitLog} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Plant *</label>
                  <select className="input" value={form.plant_id || ''} onChange={e => setForm({...form, plant_id: e.target.value})} required
                    style={{ background: 'var(--bg-glass)', color: 'var(--text-primary)' }}>
                    <option value="">Select plant...</option>
                    {plants.map(p => <option key={p.plant_id} value={p.plant_id}>{p.plant_name}</option>)}
                  </select>
                </div>

                {activeTab === 'watering' && (
                  <>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Quantity (ml)</label>
                      <input className="input" type="number" placeholder="e.g. 250" value={form.quantity_ml || ''} onChange={e => setForm({...form, quantity_ml: parseInt(e.target.value)})} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Method</label>
                      <select className="input" value={form.method || 'hand_watering'} onChange={e => setForm({...form, method: e.target.value})} style={{ background: 'var(--bg-glass)', color: 'var(--text-primary)' }}>
                        <option value="hand_watering">Hand Watering</option>
                        <option value="drip">Drip</option>
                        <option value="spray">Spray</option>
                        <option value="bottom_watering">Bottom Watering</option>
                        <option value="self_watering">Self Watering</option>
                      </select>
                    </div>
                  </>
                )}

                {activeTab === 'fertilization' && (
                  <>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Fertilizer Type *</label>
                      <input className="input" type="text" placeholder="e.g. NPK 10-10-10" required value={form.fertilizer_type || ''} onChange={e => setForm({...form, fertilizer_type: e.target.value})} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Quantity (grams)</label>
                      <input className="input" type="number" step="0.1" placeholder="e.g. 5.5" value={form.quantity_grams || ''} onChange={e => setForm({...form, quantity_grams: parseFloat(e.target.value)})} />
                    </div>
                  </>
                )}

                {activeTab === 'growth' && (
                  <>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Height (cm)</label>
                      <input className="input" type="number" step="0.1" placeholder="e.g. 35.5" value={form.height_cm || ''} onChange={e => setForm({...form, height_cm: parseFloat(e.target.value)})} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Leaf Count</label>
                      <input className="input" type="number" placeholder="e.g. 12" value={form.leaf_count || ''} onChange={e => setForm({...form, leaf_count: parseInt(e.target.value)})} />
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Growth Stage</label>
                      <select className="input" value={form.growth_stage || ''} onChange={e => setForm({...form, growth_stage: e.target.value})} style={{ background: 'var(--bg-glass)', color: 'var(--text-primary)' }}>
                        <option value="">Not changed</option>
                        <option value="seedling">Seedling</option>
                        <option value="juvenile">Juvenile</option>
                        <option value="mature">Mature</option>
                        <option value="flowering">Flowering</option>
                        <option value="dormant">Dormant</option>
                      </select>
                    </div>
                  </>
                )}

                {activeTab === 'health' && (
                  <>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Health Status *</label>
                      <select className="input" required value={form.health_status || 'healthy'} onChange={e => setForm({...form, health_status: e.target.value})} style={{ background: 'var(--bg-glass)', color: 'var(--text-primary)' }}>
                        <option value="healthy">Healthy</option>
                        <option value="needs_attention">Needs Attention</option>
                        <option value="critical">Critical</option>
                        <option value="recovering">Recovering</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Health Score * (0-100)</label>
                      <input className="input" type="number" min="0" max="100" required placeholder="e.g. 85" value={form.health_score || ''} onChange={e => setForm({...form, health_score: parseInt(e.target.value)})} />
                    </div>
                  </>
                )}

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Notes</label>
                  <textarea className="input" rows={3} placeholder="Optional notes..." value={form.notes || ''} onChange={e => setForm({...form, notes: e.target.value})} style={{ resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Log</button>
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
