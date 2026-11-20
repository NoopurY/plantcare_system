'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/app/components/ui/AppShell';
import { Table2, X, Columns, Hash, Calendar, Info, ChevronRight, Search } from 'lucide-react';

/* ── Color coding by category ── */
const TABLE_COLORS = {
  users: '#8b5cf6', roles: '#8b5cf6',
  plants: '#22c55e', species: '#22c55e', care_profiles: '#22c55e',
  watering_logs: '#06b6d4', fertilization_logs: '#06b6d4', growth_logs: '#06b6d4', health_logs: '#06b6d4',
  diseases: '#ef4444', disease_records: '#ef4444',
  care_schedules: '#f59e0b', notifications: '#f59e0b',
  audit_logs: '#6b7280',
};

const TABLE_DESCRIPTIONS = {
  users: 'Core user accounts with authentication credentials and profile data.',
  roles: 'Role-based access control definitions (admin, user, etc.).',
  plants: 'Individual plant instances owned by users, with health status.',
  species: 'Botanical species reference data with care requirements.',
  care_profiles: 'Ideal care parameters per species (watering, light, nutrients).',
  watering_logs: 'Historical watering event records per plant.',
  fertilization_logs: 'Fertilization event history with product and dosage.',
  growth_logs: 'Plant growth measurements over time.',
  health_logs: 'Periodic health assessment records per plant.',
  diseases: 'Disease reference library with symptoms and treatments.',
  disease_records: 'Disease diagnosis instances linked to specific plants.',
  care_schedules: 'Scheduled care tasks generated for users and plants.',
  notifications: 'System and trigger-generated notification messages.',
  audit_logs: 'Immutable audit trail for all significant database changes.',
};

function getColor(name) {
  return TABLE_COLORS[name] || '#4a9abf';
}

function TableCard({ table, onClick }) {
  const color = getColor(table.table_name);
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={() => onClick(table)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'var(--studio-card)', borderRadius: '12px', padding: '18px',
        border: `1px solid ${color}44`,
        borderLeft: `4px solid ${color}`,
        cursor: 'pointer',
        transform: hover ? 'translateY(-2px)' : 'none',
        boxShadow: hover ? `0 8px 24px ${color}22` : 'none',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color, fontSize: '14px' }}>
          {table.table_name}
        </span>
        <ChevronRight size={14} color="var(--text-faint)" />
      </div>
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
        {[
          { icon: Hash, label: `${Number(table.row_estimate || 0).toLocaleString()} rows` },
          { icon: Columns, label: `${table.column_count ?? '?'} cols` },
          { icon: Table2, label: `${table.index_count ?? 0} indexes` },
        ].map(({ icon: Icon, label }) => (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <Icon size={11} /> {label}
          </span>
        ))}
      </div>
      {table.last_analyzed && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-faint)', marginTop: '8px' }}>
          <Calendar size={10} /> Last analyzed: {new Date(table.last_analyzed).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

function DetailPanel({ tableName, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setDetail(null);
    fetch(`/api/db/tables/${tableName}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => setDetail(d))
      .catch(() => setDetail({ error: true }))
      .finally(() => setLoading(false));
  }, [tableName]);

  const color = getColor(tableName);
  const desc  = TABLE_DESCRIPTIONS[tableName] || 'Database table.';

  const S = {
    overlay: {
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 50, display: 'flex', justifyContent: 'flex-end',
    },
    panel: {
      width: 'min(580px, 95vw)', height: '100%', background: '#0e1c2a',
      borderLeft: `1px solid ${color}55`, overflowY: 'auto',
      animation: 'slide-in-right 0.25s ease',
      display: 'flex', flexDirection: 'column',
    },
    header: {
      padding: '20px 24px', borderBottom: '1px solid var(--studio-border)',
      background: 'rgba(74,154,191,0.05)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 10,
    },
    body: { padding: '20px 24px', flex: 1 },
    sectionTitle: { fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px', marginTop: '20px' },
    th: { padding: '8px 12px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--studio-border)' },
    td: { padding: '9px 12px', fontSize: '12px', color: 'var(--text-secondary)', borderBottom: '1px solid rgba(74,154,191,0.07)', fontFamily: 'var(--font-mono)' },
  };

  return (
    <div style={S.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <style>{`@keyframes slide-in-right { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
      <div style={S.panel}>
        <div style={S.header}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 800, color }}>
              {tableName}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{desc}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
            <X size={18} />
          </button>
        </div>
        <div style={S.body}>
          {loading ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '20px 0', textAlign: 'center' }}>Loading table details…</div>
          ) : detail?.error ? (
            <div style={{ color: '#c94a4a', fontSize: '13px' }}>Failed to load table details.</div>
          ) : (
            <>
              {/* Columns */}
              <div style={S.sectionTitle}>Columns</div>
              <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--studio-border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Column', 'Type', 'Nullable', 'Default', 'Constraint'].map(h => (
                        <th key={h} style={S.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(detail?.columns || []).map((col, i) => (
                      <tr key={i}>
                        <td style={{ ...S.td, color: col.constraint_type === 'PRIMARY KEY' ? '#f59e0b' : col.constraint_type === 'FOREIGN KEY' ? '#f97316' : '#4a9abf', fontWeight: 600 }}>
                          {col.column_name}
                        </td>
                        <td style={S.td}>{col.data_type}</td>
                        <td style={S.td}>{col.is_nullable === 'YES' ? <span style={{ color: '#22c55e', fontSize: '11px' }}>YES</span> : <span style={{ color: '#ef4444', fontSize: '11px' }}>NO</span>}</td>
                        <td style={{ ...S.td, fontSize: '11px' }}>{col.column_default || '—'}</td>
                        <td style={S.td}>
                          {col.constraint_type && (
                            <span style={{
                              padding: '2px 7px', borderRadius: '999px', fontSize: '10px', fontWeight: 700,
                              background: col.constraint_type === 'PRIMARY KEY' ? 'rgba(245,158,11,0.15)' : 'rgba(249,115,22,0.15)',
                              color: col.constraint_type === 'PRIMARY KEY' ? '#f59e0b' : '#f97316',
                            }}>{col.constraint_type === 'PRIMARY KEY' ? 'PK' : 'FK'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Indexes */}
              {(detail?.indexes || []).length > 0 && (
                <>
                  <div style={S.sectionTitle}>Indexes</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {detail.indexes.map((idx, i) => (
                      <div key={i} style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', border: '1px solid var(--studio-border)' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#4a9abf' }}>{idx.indexname}</span>
                        {idx.indexdef && <div style={{ fontSize: '11px', color: 'var(--text-faint)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>{idx.indexdef}</div>}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Sample Data */}
              {(detail?.sampleData || []).length > 0 && (
                <>
                  <div style={S.sectionTitle}>Sample Data (first 5 rows)</div>
                  <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--studio-border)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
                      <thead>
                        <tr>
                          {Object.keys(detail.sampleData[0]).map(k => (
                            <th key={k} style={S.th}>{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {detail.sampleData.map((row, i) => (
                          <tr key={i}>
                            {Object.values(row).map((v, j) => (
                              <td key={j} style={S.td}>{v === null ? <span style={{ color: 'var(--text-faint)', fontStyle: 'italic' }}>null</span> : String(v).length > 30 ? String(v).slice(0, 30) + '…' : String(v)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TableExplorerPage() {
  const [tables, setTables]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    fetch('/api/db/tables', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setTables(Array.isArray(d) ? d : d.tables || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tables.filter(t =>
    t.table_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div style={{ fontFamily: 'var(--font-sans)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <Table2 size={28} color="#4a9abf" />
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Table Explorer</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              {loading ? 'Loading…' : `${tables.length} tables in the database`}
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: '20px', maxWidth: '320px' }}>
          <Search size={14} color="var(--text-faint)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tables…"
            style={{
              width: '100%', padding: '9px 12px 9px 36px',
              background: 'var(--studio-card)', border: '1px solid var(--studio-border)',
              borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
            }}
          />
        </div>

        {/* Error */}
        {error && <div style={{ padding: '14px', background: 'rgba(201,74,74,0.1)', border: '1px solid rgba(201,74,74,0.25)', borderRadius: '10px', color: '#c94a4a', fontSize: '13px', marginBottom: '20px' }}>⚠ {error}</div>}

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ height: '100px', borderRadius: '12px', background: 'linear-gradient(90deg, var(--studio-card) 25%, rgba(74,154,191,0.05) 50%, var(--studio-card) 75%)', backgroundSize: '200% 100%', animation: 'skeleton-shimmer 1.5s infinite' }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
            {filtered.map(t => (
              <TableCard key={t.table_name} table={t} onClick={setSelected} />
            ))}
            {filtered.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', gridColumn: '1/-1' }}>No tables match "{search}"</p>
            )}
          </div>
        )}

        {/* Detail Panel */}
        {selected && (
          <DetailPanel tableName={selected.table_name} onClose={() => setSelected(null)} />
        )}
      </div>
    </AppShell>
  );
}
