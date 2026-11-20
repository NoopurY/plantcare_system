// app/species/page.jsx - Species Management & Normalization Showcase
'use client';
import { useState, useEffect } from 'react';
import AppShell from '@/app/components/ui/AppShell';
import {
  Sprout, Search, Plus, Droplets, Sun, Thermometer,
  ShieldAlert, BookOpen, Layers, CheckCircle2, ChevronRight
} from 'lucide-react';

export default function SpeciesPage() {
  const [speciesList, setSpeciesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState(null);
  const [form, setForm] = useState({
    common_name: '',
    scientific_name: '',
    family: '',
    water_requirement: 'moderate',
    sunlight_requirement: 'indirect',
    soil_type: 'Well-draining potting mix',
    min_temp_celsius: 15,
    max_temp_celsius: 30,
    care_difficulty: 'beginner',
    description: '',
    watering_interval_days: 7,
    fertilize_interval_days: 30,
    fertilizer_type: 'Balanced liquid fertilizer (10-10-10)',
    repot_interval_months: 12
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchSpecies();
  }, []);

  async function fetchSpecies() {
    setLoading(true);
    try {
      const res = await fetch('/api/species');
      if (res.ok) {
        const data = await res.json();
        setSpeciesList(data.species || data || []);
      }
    } catch (err) {
      console.error('Failed to fetch species:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSpecies(e) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/species', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to create species');
      } else {
        setShowAddModal(false);
        fetchSpecies();
      }
    } catch (err) {
      setErrorMsg('Network error saving species');
    } finally {
      setSaving(false);
    }
  }

  const filteredSpecies = speciesList.filter(s => {
    const matchesSearch = s.common_name?.toLowerCase().includes(search.toLowerCase()) ||
                          s.scientific_name?.toLowerCase().includes(search.toLowerCase()) ||
                          s.family?.toLowerCase().includes(search.toLowerCase());
    const matchesDiff = selectedDifficulty === 'all' || s.care_difficulty === selectedDifficulty;
    return matchesSearch && matchesDiff;
  });

  return (
    <AppShell>
      <div style={{ padding: '28px', maxWidth: '1280px', margin: '0 auto' }}>
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{ background: 'rgba(134,188,66,0.15)', padding: '8px', borderRadius: '10px' }}>
                <Sprout size={24} style={{ color: 'var(--green-primary)' }} />
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Species Directory
              </h1>
              <span className="badge badge-healthy" style={{ fontSize: '12px' }}>
                Normalized 3NF Entity
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '680px', margin: 0 }}>
              Botanical reference database mapped relationally to individual plants. Separates static taxonomy and care formulas from dynamic plant instances to eliminate update anomalies.
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px' }}
          >
            <Plus size={18} />
            <span>Add Species (Admin)</span>
          </button>
        </div>

        {/* Search & Filters */}
        <div className="card" style={{ padding: '16px 20px', marginBottom: '28px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input"
              placeholder="Search by common, scientific name, or family..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Difficulty:</span>
            {['all', 'beginner', 'intermediate', 'expert'].map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  border: '1px solid',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.15s ease',
                  borderColor: selectedDifficulty === diff ? 'var(--green-primary)' : 'var(--border)',
                  background: selectedDifficulty === diff ? 'rgba(134,188,66,0.18)' : 'transparent',
                  color: selectedDifficulty === diff ? 'var(--green-primary)' : 'var(--text-secondary)'
                }}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Species Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="card skeleton" style={{ height: '240px' }} />
            ))}
          </div>
        ) : filteredSpecies.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <BookOpen size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 16px' }} />
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>No Species Found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              {search ? 'Try adjusting your search criteria.' : 'No species recorded in PostgreSQL yet.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '22px' }}>
            {filteredSpecies.map((sp) => (
              <div
                key={sp.species_id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                onClick={() => setSelectedSpecies(sp)}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      ID #{sp.species_id} &bull; {sp.family || 'Plantae'}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: sp.care_difficulty === 'beginner' ? 'rgba(134,188,66,0.15)' :
                                    sp.care_difficulty === 'intermediate' ? 'rgba(201,147,58,0.15)' : 'rgba(201,74,74,0.15)',
                        color: sp.care_difficulty === 'beginner' ? 'var(--green-primary)' :
                               sp.care_difficulty === 'intermediate' ? 'var(--amber)' : 'var(--error)',
                        fontWeight: 600,
                        textTransform: 'capitalize'
                      }}
                    >
                      {sp.care_difficulty}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                    {sp.common_name}
                  </h3>
                  <div style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--sage)', marginBottom: '14px' }}>
                    {sp.scientific_name}
                  </div>

                  {sp.description && (
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {sp.description}
                    </p>
                  )}

                  {/* Requirements grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: 'rgba(0,0,0,0.25)', padding: '12px', borderRadius: '10px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <Droplets size={15} style={{ color: '#4a9abf' }} />
                      <span>Every {sp.watering_interval_days || 7} days</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <Sun size={15} style={{ color: '#c9933a' }} />
                      <span style={{ textTransform: 'capitalize' }}>{(sp.sunlight_requirement || 'indirect').replace('_', ' ')}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <Thermometer size={15} style={{ color: '#86bc42' }} />
                      <span>{sp.min_temp_celsius || 15}° - {sp.max_temp_celsius || 30}°C</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <Layers size={15} style={{ color: '#7a9a6c' }} />
                      <span style={{ textTransform: 'capitalize' }}>{sp.water_requirement || 'moderate'} water</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-muted)', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span>Used by: <strong style={{ color: 'var(--text-primary)' }}>{sp.plant_count || 0} plants</strong></span>
                  <span style={{ color: 'var(--green-primary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                    Details <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Species Detail Modal */}
        {selectedSpecies && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(6px)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}
            onClick={() => setSelectedSpecies(null)}
          >
            <div
              className="card"
              style={{
                width: '100%',
                maxWidth: '640px',
                maxHeight: '90vh',
                overflowY: 'auto',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-strong)',
                padding: '28px'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--sage)', fontFamily: 'var(--font-mono)' }}>
                    SPECIES RECORD #{selectedSpecies.species_id} &bull; {selectedSpecies.family || 'Botanical'}
                  </span>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 2px' }}>
                    {selectedSpecies.common_name}
                  </h2>
                  <div style={{ fontStyle: 'italic', color: 'var(--sage)', fontSize: '15px' }}>
                    {selectedSpecies.scientific_name}
                  </div>
                </div>
                <button
                  className="btn btn-ghost"
                  onClick={() => setSelectedSpecies(null)}
                  style={{ padding: '6px 12px' }}
                >
                  ✕
                </button>
              </div>

              {selectedSpecies.description && (
                <div style={{ background: 'var(--bg-panel)', padding: '14px', borderRadius: '10px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '20px' }}>
                  {selectedSpecies.description}
                </div>
              )}

              <h4 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Relational Care Profile (`care_profiles` table)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '24px' }}>
                <div className="card" style={{ padding: '14px', background: 'var(--bg-card)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Watering Schedule</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#4a9abf', marginTop: '4px' }}>
                    Every {selectedSpecies.watering_interval_days || 7} days
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {selectedSpecies.water_requirement} requirement
                  </div>
                </div>

                <div className="card" style={{ padding: '14px', background: 'var(--bg-card)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fertilizer Schedule</div>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#c9933a', marginTop: '4px' }}>
                    Every {selectedSpecies.fertilize_interval_days || 30} days
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {selectedSpecies.fertilizer_type || 'Standard fertilizer'}
                  </div>
                </div>

                <div className="card" style={{ padding: '14px', background: 'var(--bg-card)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sunlight & Temperature</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--green-primary)', marginTop: '4px' }}>
                    {(selectedSpecies.sunlight_requirement || 'indirect').replace('_', ' ')}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Range: {selectedSpecies.min_temp_celsius || 15}°C - {selectedSpecies.max_temp_celsius || 30}°C
                  </div>
                </div>

                <div className="card" style={{ padding: '14px', background: 'var(--bg-card)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Soil & Repotting</div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                    Repot: {selectedSpecies.repot_interval_months || 12} mo
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {selectedSpecies.soil_type || 'Standard potting soil'}
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(74, 154, 191, 0.1)', border: '1px solid rgba(74, 154, 191, 0.25)', padding: '14px', borderRadius: '10px', fontSize: '13px', color: '#a0cde0' }}>
                <strong>DBMS Note:</strong> This species is joined dynamically via <code>species_id</code> foreign key across all plant records. Updating this record updates care guidelines for {selectedSpecies.plant_count || 0} plants without any data duplication.
              </div>
            </div>
          </div>
        )}

        {/* Add Species Modal */}
        {showAddModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.8)',
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
                maxWidth: '680px',
                maxHeight: '92vh',
                overflowY: 'auto',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-strong)',
                padding: '28px'
              }}
            >
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Add New Botanical Species
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
                Inserts into both <code>species</code> and <code>care_profiles</code> relational tables in a single transaction.
              </p>

              {errorMsg && (
                <div style={{ background: 'rgba(201, 74, 74, 0.15)', border: '1px solid var(--error)', padding: '12px', borderRadius: '8px', color: 'var(--error)', marginBottom: '18px', fontSize: '14px' }}>
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleAddSpecies} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Common Name *</label>
                    <input
                      type="text"
                      className="input"
                      required
                      placeholder="e.g. Bird of Paradise"
                      value={form.common_name}
                      onChange={e => setForm({ ...form, common_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Scientific Name * (UNIQUE)</label>
                    <input
                      type="text"
                      className="input"
                      required
                      placeholder="e.g. Strelitzia reginae"
                      value={form.scientific_name}
                      onChange={e => setForm({ ...form, scientific_name: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Family</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="e.g. Strelitziaceae"
                      value={form.family}
                      onChange={e => setForm({ ...form, family: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Water Requirement</label>
                    <select
                      className="input"
                      value={form.water_requirement}
                      onChange={e => setForm({ ...form, water_requirement: e.target.value })}
                    >
                      <option value="low">Low</option>
                      <option value="moderate">Moderate</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Difficulty</label>
                    <select
                      className="input"
                      value={form.care_difficulty}
                      onChange={e => setForm({ ...form, care_difficulty: e.target.value })}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="expert">Expert</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Watering Interval (Days)</label>
                    <input
                      type="number"
                      className="input"
                      min="1"
                      max="90"
                      value={form.watering_interval_days}
                      onChange={e => setForm({ ...form, watering_interval_days: parseInt(e.target.value) || 7 })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Sunlight Requirement</label>
                    <select
                      className="input"
                      value={form.sunlight_requirement}
                      onChange={e => setForm({ ...form, sunlight_requirement: e.target.value })}
                    >
                      <option value="full_sun">Full Sun</option>
                      <option value="partial_shade">Partial Shade</option>
                      <option value="indirect">Bright Indirect</option>
                      <option value="low_light">Low Light</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Description & Botanical Notes</label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Care instructions, native habitat, humidity requirements..."
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)} style={{ flex: 1 }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1 }}>
                    {saving ? 'Writing to DB...' : 'Commit Species'}
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
