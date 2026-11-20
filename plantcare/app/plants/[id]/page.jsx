'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Leaf, MapPin, Droplets, Sprout,
  Heart, Activity, Plus, Calendar, FlaskConical, Bug, Pencil
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import AppShell from '@/app/components/ui/AppShell';
import StatCard from '@/app/components/ui/StatCard';
import HealthBadge from '@/app/components/ui/HealthBadge';
import Modal from '@/app/components/ui/Modal';

/* ─── helpers ────────────────────────────────────────────────── */
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const TABS = [
  { id: 'watering', label: 'Watering', icon: Droplets },
  { id: 'fertilization', label: 'Fertilization', icon: FlaskConical },
  { id: 'growth', label: 'Growth', icon: Sprout },
  { id: 'health', label: 'Health', icon: Heart },
  { id: 'diseases', label: 'Diseases', icon: Bug },
];

/* ─── Edit modal (simplified) ────────────────────────────────── */
function EditModal({ isOpen, onClose, plant, onSuccess }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (plant) setForm({
      plant_name: plant.plant_name || '',
      nickname: plant.nickname || '',
      location: plant.location || '',
      growth_stage: plant.growth_stage || '',
      health_status: plant.health_status || '',
      notes: plant.notes || '',
    });
  }, [plant]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setErr('');
    try {
      const res = await fetch(`/api/plants/${plant.plant_id}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update');
      onSuccess(data);
      onClose();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const lbl = (text) => (
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {text}
    </label>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Plant">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>{lbl('Plant Name *')}<input className="input" required value={form.plant_name || ''} onChange={e => setForm(f => ({ ...f, plant_name: e.target.value }))} /></div>
        <div>{lbl('Nickname')}<input className="input" value={form.nickname || ''} onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))} /></div>
        <div>{lbl('Location')}<input className="input" value={form.location || ''} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></div>
        <div>
          {lbl('Health Status')}
          <select className="input" value={form.health_status || ''} onChange={e => setForm(f => ({ ...f, health_status: e.target.value }))} style={{ cursor: 'pointer' }}>
            {['healthy', 'needs_attention', 'critical', 'recovering'].map(h => (
              <option key={h} value={h}>{h.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
            ))}
          </select>
        </div>
        <div>
          {lbl('Growth Stage')}
          <select className="input" value={form.growth_stage || ''} onChange={e => setForm(f => ({ ...f, growth_stage: e.target.value }))} style={{ cursor: 'pointer' }}>
            {['seedling', 'juvenile', 'mature', 'flowering', 'dormant'].map(g => (
              <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>{lbl('Notes')}<textarea className="input" rows={3} value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: 'vertical' }} /></div>
        {err && <p style={{ color: 'var(--error)', fontSize: 13 }}>{err}</p>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </form>
    </Modal>
  );
}

/* ─── Add log modal ─────────────────────────────────────────── */
const ENDPOINT_BY_TYPE = {
  watering: 'watering',
  fertilization: 'fertilization',
  growth: 'growth',
  health: 'health',
  diseases: 'disease-records',
};

function AddLogModal({ isOpen, onClose, plantId, type, onSuccess }) {
  const emptyForm = { date: new Date().toISOString().slice(0, 16), notes: '', amount: '', health_score: '', health_status: 'healthy', fertilizer_type: '', method: 'hand_watering', disease_id: '' };
  const [form, setForm] = useState(emptyForm);
  const [diseases, setDiseases] = useState([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm(emptyForm);
      setErr('');
      if (type === 'diseases') {
        fetch('/api/diseases', { credentials: 'include' })
          .then(r => r.json())
          .then(d => setDiseases(d.diseases || []))
          .catch(() => setDiseases([]));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, type]);

  const buildPayload = () => {
    const isoDate = form.date ? new Date(form.date).toISOString() : null;
    switch (type) {
      case 'watering':
        return { plant_id: plantId, quantity_ml: form.amount ? parseInt(form.amount, 10) : null, method: form.method || 'hand_watering', notes: form.notes || null, watered_at: isoDate };
      case 'fertilization':
        return { plant_id: plantId, fertilizer_type: form.fertilizer_type, quantity_grams: form.amount ? parseFloat(form.amount) : null, notes: form.notes || null, applied_at: isoDate };
      case 'growth':
        return { plant_id: plantId, height_cm: form.amount ? parseFloat(form.amount) : null, notes: form.notes || null, recorded_at: isoDate };
      case 'health':
        return { plant_id: plantId, health_status: form.health_status || 'healthy', health_score: form.health_score ? parseInt(form.health_score, 10) : null, notes: form.notes || null, recorded_at: isoDate };
      case 'diseases':
        return { plant_id: plantId, disease_id: form.disease_id ? parseInt(form.disease_id, 10) : null, treatment_used: form.notes || null, detected_at: isoDate };
      default:
        return { plant_id: plantId, notes: form.notes || null };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (type === 'fertilization' && !form.fertilizer_type.trim()) { setErr('Fertilizer type is required.'); return; }
    if (type === 'health' && !form.health_score) { setErr('Health score is required.'); return; }
    if (type === 'diseases' && !form.disease_id) { setErr('Please select a disease.'); return; }
    setSaving(true); setErr('');
    try {
      const res = await fetch(`/api/${ENDPOINT_BY_TYPE[type]}`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add log');
      onSuccess();
      onClose();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const lbl = (text) => (
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      {text}
    </label>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Log ${type === 'diseases' ? 'Disease' : type.charAt(0).toUpperCase() + type.slice(1)}`} width="420px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {type !== 'diseases' && (
          <div>
            {lbl('Date & Time')}
            <input type="datetime-local" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
        )}
        {type === 'watering' && (
          <div>{lbl('Amount (ml)')}<input type="number" className="input" placeholder="e.g. 250" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
        )}
        {type === 'fertilization' && (
          <>
            <div>{lbl('Fertilizer Type *')}<input type="text" className="input" required placeholder="e.g. NPK 10-10-10" value={form.fertilizer_type} onChange={e => setForm(f => ({ ...f, fertilizer_type: e.target.value }))} /></div>
            <div>{lbl('Amount (g)')}<input type="number" step="0.1" className="input" placeholder="e.g. 5.5" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
          </>
        )}
        {type === 'growth' && (
          <div>{lbl('Height (cm)')}<input type="number" step="0.1" className="input" placeholder="e.g. 35.5" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
        )}
        {type === 'health' && (
          <>
            <div>
              {lbl('Health Status')}
              <select className="input" value={form.health_status} onChange={e => setForm(f => ({ ...f, health_status: e.target.value }))} style={{ cursor: 'pointer' }}>
                {['healthy', 'needs_attention', 'critical', 'recovering'].map(h => (
                  <option key={h} value={h}>{h.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
                ))}
              </select>
            </div>
            <div>{lbl('Health Score (0-100) *')}<input type="number" min={0} max={100} required className="input" placeholder="e.g. 85" value={form.health_score} onChange={e => setForm(f => ({ ...f, health_score: e.target.value }))} /></div>
          </>
        )}
        {type === 'diseases' && (
          <div>
            {lbl('Disease *')}
            <select className="input" required value={form.disease_id} onChange={e => setForm(f => ({ ...f, disease_id: e.target.value }))} style={{ cursor: 'pointer' }}>
              <option value="">— Select a disease —</option>
              {diseases.map(d => (
                <option key={d.disease_id} value={d.disease_id}>{d.disease_name}</option>
              ))}
            </select>
          </div>
        )}
        <div>{lbl(type === 'diseases' ? 'Treatment Notes' : 'Notes')}<textarea className="input" rows={3} placeholder="Any observations…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: 'vertical' }} /></div>
        {err && <p style={{ color: 'var(--error)', fontSize: 13 }}>{err}</p>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add Log'}</button>
        </div>
      </form>
    </Modal>
  );
}

/* ─── Log list ───────────────────────────────────────────────── */
function LogList({ logs, dateKey = 'created_at', noteKey = 'notes', extraKey, extraLabel }) {
  if (!logs || logs.length === 0) {
    return <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No records yet</p>;
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {logs.map((log, i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          padding: '10px 0', borderBottom: i < logs.length - 1 ? '1px solid var(--border-muted)' : 'none',
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
              {fmtDate(log[dateKey])}
            </div>
            {log[noteKey] && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{log[noteKey]}</div>}
          </div>
          {extraKey && log[extraKey] != null && (
            <span className="badge" style={{ background: 'rgba(134,188,66,0.1)', color: 'var(--green-primary)', border: '1px solid rgba(134,188,66,0.2)' }}>
              {extraLabel}: {log[extraKey]}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── health score tooltip ───────────────────────────────────── */
function HealthTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 8, padding: '8px 14px', fontSize: 13, color: 'var(--text-primary)'
    }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 2 }}>{label}</div>
      <strong>Score: {payload[0].value}</strong>
    </div>
  );
}

/* ─── main page ──────────────────────────────────────────────── */
export default function PlantDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [plant, setPlant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('watering');
  const [tabData, setTabData] = useState({});
  const [tabLoading, setTabLoading] = useState(false);

  const [showEdit, setShowEdit] = useState(false);
  const [showAddLog, setShowAddLog] = useState(false);

  const fetchPlant = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/plants/${id}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Plant not found');
      // API returns { plant, statistics } — flatten into one object so the
      // rest of this component can read plant.<field> and plant.stats.<field>
      setPlant({ ...data.plant, stats: data.statistics || {} });
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchPlant(); }, [fetchPlant]);

  const fetchTabData = useCallback(async (tab) => {
    setTabLoading(true);
    try {
      const endpointMap = { watering: 'watering', fertilization: 'fertilization', growth: 'growth', health: 'health', diseases: 'disease-records' };
      const res = await fetch(`/api/${endpointMap[tab]}?plant_id=${id}`, { credentials: 'include' });
      const data = await res.json();
      setTabData(prev => ({ ...prev, [tab]: Array.isArray(data) ? data : (data.logs ?? data.records ?? data.data ?? []) }));
    } catch { setTabData(prev => ({ ...prev, [tab]: [] })); }
    finally { setTabLoading(false); }
  }, [id]);

  useEffect(() => { if (id && activeTab) fetchTabData(activeTab); }, [id, activeTab, fetchTabData]);

  if (loading) {
    return (
      <AppShell>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 12 }} />)}
        </div>
      </AppShell>
    );
  }

  if (error || !plant) {
    return (
      <AppShell>
        <p style={{ color: 'var(--error)' }}>Error: {error || 'Plant not found'}</p>
        <Link href="/plants" className="btn btn-ghost" style={{ marginTop: 12 }}><ArrowLeft size={15} /> Back to Plants</Link>
      </AppShell>
    );
  }

  const stats = plant.stats || {};
  const healthChartData = (tabData['health'] || [])
    .filter(h => h.health_score != null)
    .map(h => ({ date: fmtDate(h.recorded_at), score: Number(h.health_score) }))
    .slice(0, 30).reverse();

  return (
    <AppShell>
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Back + Title ─────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link href="/plants" className="btn btn-ghost" style={{ padding: '7px 12px' }}>
              <ArrowLeft size={15} />
            </Link>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>{plant.plant_name}</h1>
                <HealthBadge status={plant.health_status} />
              </div>
              {plant.nickname && <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '2px 0 0' }}>"{plant.nickname}"</p>}
            </div>
          </div>
          <button className="btn btn-ghost" onClick={() => setShowEdit(true)}>
            <Pencil size={14} /> Edit Plant
          </button>
        </div>

        {/* ── Info Card ────────────────────────────────────────── */}
        <div className="card" style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 24, alignItems: 'start' }}>
          {/* Placeholder image */}
          <div style={{
            height: 180, borderRadius: 10,
            background: 'linear-gradient(135deg, #1a3a18 0%, #2d5a1e 60%, #86bc42 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Leaf size={56} style={{ color: 'rgba(134,188,66,0.5)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['Species', plant.species_name || plant.scientific_name || '—'],
              ['Family', plant.family || '—'],
              ['Location', plant.location || '—'],
              ['Growth Stage', plant.growth_stage || '—'],
              ['Date Acquired', fmtDate(plant.date_acquired)],
              ['Health Status', (plant.health_status || '—').replace('_', ' ')],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{value}</div>
              </div>
            ))}
            {plant.notes && (
              <div style={{ gridColumn: '1/-1' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>Notes</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{plant.notes}</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Stats Bar ────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14 }}>
          <StatCard label="Waterings" value={stats.total_waterings ?? 0} icon={Droplets} color="var(--info)" />
          <StatCard label="Fertilizations" value={stats.total_fertilizations ?? 0} icon={FlaskConical} color="#a0d954" />
          <StatCard label="Health Score" value={stats.computed_health != null ? `${stats.computed_health}/100` : '—'} icon={Heart} color="var(--error)" />
          <StatCard label="Days Since Watered" value={stats.days_since_watered ?? '—'} icon={Calendar} color="var(--amber)" />
          <StatCard label="Next Watering" value={fmtDate(stats.next_watering_date)} icon={Activity} color="var(--green-primary)" />
        </div>

        {/* ── Tabs ─────────────────────────────────────────────── */}
        <div className="card" style={{ padding: 0 }}>
          {/* Tab bar */}
          <div style={{
            display: 'flex', borderBottom: '1px solid var(--border)',
            overflowX: 'auto', scrollbarWidth: 'none',
          }}>
            {TABS.map(({ id: tid, label, icon: Icon }) => (
              <button
                key={tid}
                onClick={() => setActiveTab(tid)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '14px 20px', border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap',
                  color: activeTab === tid ? 'var(--green-primary)' : 'var(--text-muted)',
                  borderBottom: activeTab === tid ? '2px solid var(--green-primary)' : '2px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => setShowAddLog(true)}>
                <Plus size={14} /> Add {activeTab === 'diseases' ? 'Disease' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Log
              </button>
            </div>

            {tabLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8 }} />)}
              </div>
            ) : activeTab === 'health' && healthChartData.length > 1 ? (
              <>
                <div style={{ marginBottom: 20 }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={healthChartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(134,188,66,0.1)" vertical={false} />
                      <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} />
                      <Tooltip content={<HealthTooltip />} />
                      <Line type="monotone" dataKey="score" stroke="#86bc42" strokeWidth={2} dot={{ r: 3, fill: '#86bc42' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <LogList logs={tabData['health'] ?? []} dateKey="recorded_at" noteKey="notes" extraKey="health_score" extraLabel="Score" />
              </>
            ) : activeTab === 'watering' ? (
              <LogList logs={tabData['watering'] ?? []} dateKey="watered_at" noteKey="notes" extraKey="quantity_ml" extraLabel="ml" />
            ) : activeTab === 'fertilization' ? (
              <LogList logs={tabData['fertilization'] ?? []} dateKey="applied_at" noteKey="notes" extraKey="fertilizer_type" extraLabel="Type" />
            ) : activeTab === 'growth' ? (
              <LogList logs={tabData['growth'] ?? []} dateKey="recorded_at" noteKey="notes" extraKey="height_cm" extraLabel="cm" />
            ) : activeTab === 'diseases' ? (
              <LogList logs={tabData['diseases'] ?? []} dateKey="detected_at" noteKey="treatment_used" extraKey="disease_name" extraLabel="Disease" />
            ) : (
              <LogList logs={tabData[activeTab] ?? []} />
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────────────────── */}
      <EditModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        plant={plant}
        onSuccess={(updated) => { setPlant(p => ({ ...p, ...updated.plant })); }}
      />
      <AddLogModal
        isOpen={showAddLog}
        onClose={() => setShowAddLog(false)}
        plantId={id}
        type={activeTab}
        onSuccess={() => { fetchTabData(activeTab); fetchPlant(); }}
      />
    </AppShell>
  );
}
