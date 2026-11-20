'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Search, Plus, Leaf, MapPin, Droplets,
  Eye, Pencil, Trash2, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import AppShell from '@/app/components/ui/AppShell';
import Modal from '@/app/components/ui/Modal';
import HealthBadge from '@/app/components/ui/HealthBadge';

/* ─── constants ──────────────────────────────────────────────── */
const HEALTH_STATUSES = ['healthy', 'needs_attention', 'critical', 'recovering'];
const GROWTH_STAGES = ['seedling', 'juvenile', 'mature', 'flowering', 'dormant'];

/* ─── PlantImage placeholder ─────────────────────────────────── */
function PlantImagePlaceholder() {
  return (
    <div style={{
      width: '100%', height: 160,
      background: 'linear-gradient(135deg, #1a3a18 0%, #2d5a1e 60%, #86bc42 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: '12px 12px 0 0',
    }}>
      <Leaf size={48} style={{ color: 'rgba(134,188,66,0.5)' }} />
    </div>
  );
}

/* ─── Confirmation modal ─────────────────────────────────────── */
function ConfirmModal({ isOpen, onClose, onConfirm, plantName, deleting }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Plant" width="400px">
      <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
        Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{plantName}</strong>?
        This action cannot be undone.
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-danger" onClick={onConfirm} disabled={deleting}>
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </Modal>
  );
}

/* ─── Add / Edit Plant modal ─────────────────────────────────── */
function PlantFormModal({ isOpen, onClose, onSuccess, editData, species }) {
  const isEdit = !!editData;
  const [form, setForm] = useState({
    plant_name: '', nickname: '', species_id: '', location: '',
    growth_stage: 'seedling', health_status: 'healthy', notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (isEdit && editData) {
      setForm({
        plant_name: editData.plant_name || '',
        nickname: editData.nickname || '',
        species_id: editData.species_id || '',
        location: editData.location || '',
        growth_stage: editData.growth_stage || 'seedling',
        health_status: editData.health_status || 'healthy',
        notes: editData.notes || '',
      });
    } else {
      setForm({ plant_name: '', nickname: '', species_id: '', location: '', growth_stage: 'seedling', health_status: 'healthy', notes: '' });
    }
    setErr('');
  }, [isEdit, editData, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.plant_name.trim()) { setErr('Plant name is required.'); return; }
    setSubmitting(true);
    setErr('');
    try {
      const url = isEdit ? `/api/plants/${editData.plant_id}` : '/api/plants';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save plant');
      onSuccess(data);
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const field = (label, key, type = 'text', opts = {}) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </label>
      <input
        type={type}
        className="input"
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        {...opts}
      />
    </div>
  );

  const selectField = (label, key, options) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </label>
      <select
        className="input"
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        style={{ cursor: 'pointer' }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Plant' : 'Add New Plant'}>
      <form onSubmit={handleSubmit}>
        {field('Plant Name *', 'plant_name', 'text', { required: true, placeholder: 'e.g. My Monstera' })}
        {field('Nickname', 'nickname', 'text', { placeholder: 'e.g. Big Green' })}

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Species
          </label>
          <select className="input" value={form.species_id} onChange={e => setForm(f => ({ ...f, species_id: e.target.value }))} style={{ cursor: 'pointer' }}>
            <option value="">— None —</option>
            {(species || []).map(s => (
              <option key={s.species_id} value={s.species_id}>
                {s.common_name || s.scientific_name}
              </option>
            ))}
          </select>
        </div>

        {field('Location', 'location', 'text', { placeholder: 'e.g. Living Room' })}

        {selectField('Growth Stage', 'growth_stage', GROWTH_STAGES.map(g => ({ value: g, label: g.charAt(0).toUpperCase() + g.slice(1) })))}
        {selectField('Health Status', 'health_status', HEALTH_STATUSES.map(h => ({ value: h, label: h.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) })))}

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Notes
          </label>
          <textarea
            className="input"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={3}
            placeholder="Any notes about this plant…"
            style={{ resize: 'vertical' }}
          />
        </div>

        {err && <p style={{ color: 'var(--error)', fontSize: 13, marginBottom: 12 }}>{err}</p>}

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Plant'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ─── main page ──────────────────────────────────────────────── */
export default function PlantsPage() {
  const [plants, setPlants] = useState([]);
  const [species, setSpecies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [healthFilter, setHealthFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [showAdd, setShowAdd] = useState(false);
  const [editPlant, setEditPlant] = useState(null);
  const [deletePlant, setDeletePlant] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const PER_PAGE = 12;

  const fetchPlants = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: PER_PAGE });
      if (search) params.set('search', search);
      if (healthFilter) params.set('health_status', healthFilter);
      if (stageFilter) params.set('growth_stage', stageFilter);
      const res = await fetch(`/api/plants?${params}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load plants');
      setPlants(Array.isArray(data) ? data : (data.plants ?? data.data ?? []));
      setTotalPages(data.totalPages ?? data.total_pages ?? 1);
      setTotalCount(data.total ?? data.count ?? (Array.isArray(data) ? data.length : 0));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, healthFilter, stageFilter, page]);

  useEffect(() => { fetchPlants(); }, [fetchPlants]);

  useEffect(() => {
    fetch('/api/species', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setSpecies(Array.isArray(d) ? d : (d.species ?? [])))
      .catch(() => {});
  }, []);

  /* search debounce */
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleDelete = async () => {
    if (!deletePlant) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/plants/${deletePlant.plant_id}`, {
        method: 'DELETE', credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to delete');
      setDeletePlant(null);
      fetchPlants();
    } catch (e) {
      alert(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleFormSuccess = () => fetchPlants();

  return (
    <AppShell>
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Header ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>My Plants</h1>
            <span className="badge" style={{ background: 'rgba(134,188,66,0.15)', color: 'var(--green-primary)', border: '1px solid rgba(134,188,66,0.2)' }}>
              {totalCount} total
            </span>
          </div>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={15} /> Add Plant
          </button>
        </div>

        {/* ── Filters ────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input"
              style={{ paddingLeft: 36 }}
              placeholder="Search plants…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button onClick={() => setSearchInput('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={14} />
              </button>
            )}
          </div>
          <select className="input" style={{ width: 180, cursor: 'pointer' }} value={healthFilter} onChange={e => { setHealthFilter(e.target.value); setPage(1); }}>
            <option value="">All Health Statuses</option>
            {HEALTH_STATUSES.map(h => <option key={h} value={h}>{h.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
          </select>
          <select className="input" style={{ width: 160, cursor: 'pointer' }} value={stageFilter} onChange={e => { setStageFilter(e.target.value); setPage(1); }}>
            <option value="">All Stages</option>
            {GROWTH_STAGES.map(g => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}
          </select>
        </div>

        {/* ── Plant Grid ─────────────────────────────────────────── */}
        {error ? (
          <p style={{ color: 'var(--error)' }}>Error: {error}</p>
        ) : loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 280, borderRadius: 16 }} />
            ))}
          </div>
        ) : plants.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: 'var(--bg-card)', borderRadius: 16, border: '2px dashed var(--border)',
          }}>
            <Leaf size={48} style={{ color: 'var(--green-muted)', marginBottom: 16 }} />
            <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 18, marginBottom: 8 }}>No plants found</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>
              {search || healthFilter || stageFilter ? 'Try adjusting your filters' : 'Add your first plant to get started!'}
            </p>
            <button className="btn btn-primary" onClick={() => setShowAdd(true)}><Plus size={15} /> Add Plant</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {plants.map(plant => (
              <div key={plant.plant_id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <PlantImagePlaceholder />
                <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{plant.plant_name}</div>
                      {plant.nickname && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>"{plant.nickname}"</div>}
                    </div>
                    <HealthBadge status={plant.health_status} />
                  </div>
                  {plant.species_name && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic' }}>{plant.species_name}</div>
                  )}
                  {plant.location && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
                      <MapPin size={11} /> {plant.location}
                    </div>
                  )}
                  {plant.last_watered && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
                      <Droplets size={11} /> Last watered: {new Date(plant.last_watered).toLocaleDateString()}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <Link href={`/plants/${plant.plant_id}`} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', padding: '6px 10px', fontSize: 12 }}>
                      <Eye size={13} /> View
                    </Link>
                    <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center', padding: '6px 10px', fontSize: 12 }} onClick={() => setEditPlant(plant)}>
                      <Pencil size={13} /> Edit
                    </button>
                    <button className="btn btn-danger" style={{ padding: '6px 10px' }} onClick={() => setDeletePlant(plant)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Pagination ─────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <button className="btn btn-ghost" style={{ padding: '6px 12px' }} disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Page {page} of {totalPages}</span>
            <button className="btn btn-ghost" style={{ padding: '6px 12px' }} disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────────── */}
      <PlantFormModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onSuccess={handleFormSuccess}
        species={species}
      />
      <PlantFormModal
        isOpen={!!editPlant}
        onClose={() => setEditPlant(null)}
        onSuccess={handleFormSuccess}
        editData={editPlant}
        species={species}
      />
      <ConfirmModal
        isOpen={!!deletePlant}
        onClose={() => setDeletePlant(null)}
        onConfirm={handleDelete}
        plantName={deletePlant?.plant_name}
        deleting={deleting}
      />
    </AppShell>
  );
}
