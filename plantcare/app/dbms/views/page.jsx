// app/dbms/views/page.jsx - PostgreSQL View Explorer
'use client';
import { useState, useEffect } from 'react';
import AppShell from '@/app/components/ui/AppShell';
import {
  Eye, Database, ArrowRight, Table2, Play, Code2,
  RefreshCw, CheckCircle2, Info, Layers
} from 'lucide-react';

const VIEW_METADATA = {
  plant_health_summary: {
    purpose: 'Aggregated view combining plants, botanical species taxonomy, and the single latest health check score via LATERAL join.',
    sources: ['plants', 'species', 'health_logs', 'watering_logs', 'growth_logs']
  },
  plant_care_summary: {
    purpose: 'Statistical aggregation computing lifetime waterings, fertilizations, average health score, and total height gained per plant.',
    sources: ['plants', 'watering_logs', 'fertilization_logs', 'growth_logs', 'health_logs']
  },
  disease_summary: {
    purpose: 'Active and resolved disease diagnosis records combined with canonical pathological categories and resolution times in days.',
    sources: ['disease_records', 'plants', 'diseases']
  },
  plant_activity_summary: {
    purpose: 'Polymorphic UNION ALL combining watering, fertilization, health check, and growth measurement timelines into a single chronological activity stream.',
    sources: ['watering_logs', 'fertilization_logs', 'health_logs', 'growth_logs', 'plants']
  },
  species_care_overview: {
    purpose: 'Joined view connecting botanical taxonomy directly to default species care profile thresholds and active plant counts.',
    sources: ['species', 'care_profiles', 'plants']
  },
  user_dashboard_stats: {
    purpose: 'High-performance user-level metrics calculating total plants, health status breakdowns, and recent 7-day care tallies.',
    sources: ['users', 'plants', 'watering_logs', 'notifications']
  }
};

export default function ViewsPage() {
  const [views, setViews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('plant_health_summary');
  const [viewData, setViewData] = useState([]);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    async function loadViews() {
      try {
        const res = await fetch('/api/db/views');
        if (res.ok) {
          const data = await res.json();
          setViews(data.views || data || []);
        }
      } catch (err) {
        console.error('Failed to load views:', err);
      } finally {
        setLoading(false);
      }
    }
    loadViews();
  }, []);

  useEffect(() => {
    if (selectedView) {
      loadViewData(selectedView);
    }
  }, [selectedView]);

  async function loadViewData(viewName) {
    setExecuting(true);
    try {
      const res = await fetch('/api/db/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: `SELECT * FROM ${viewName} LIMIT 10;` })
      });
      if (res.ok) {
        const data = await res.json();
        setViewData(data.rows || []);
      }
    } catch (err) {
      console.error('Error querying view data:', err);
    } finally {
      setExecuting(false);
    }
  }

  const currentViewObj = views.find(v => (v.view_name || v.table_name) === selectedView) || {};
  const currentMeta = VIEW_METADATA[selectedView] || {
    purpose: 'Dynamically materialized virtual relation computed over base tables.',
    sources: ['plants', 'species']
  };

  return (
    <AppShell>
      <div style={{ padding: '28px', maxWidth: '1380px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ background: 'rgba(74, 154, 191, 0.15)', padding: '8px', borderRadius: '10px' }}>
              <Eye size={24} style={{ color: '#4a9abf' }} />
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Database Views Explorer
            </h1>
            <span style={{ fontSize: '11px', background: 'rgba(74, 154, 191, 0.15)', color: '#4a9abf', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
              Virtual Relations in PostgreSQL
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '780px', margin: 0 }}>
            Inspect real PostgreSQL views defined in <code>database/views.sql</code>. Views provide security abstraction, encapsulate complex multi-table joins, and present simplified virtual tables without duplicating storage.
          </p>
        </div>

        {/* Master-Detail Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
          {/* Left View List */}
          <div className="card" style={{ background: 'var(--studio-panel)', borderColor: 'var(--studio-border)', padding: '16px' }}>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Registered Views ({views.length || 6})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {Object.keys(VIEW_METADATA).map((vName) => {
                const isSelected = selectedView === vName;
                return (
                  <button
                    key={vName}
                    onClick={() => setSelectedView(vName)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: isSelected ? '#4a9abf' : 'transparent',
                      background: isSelected ? 'rgba(74, 154, 191, 0.15)' : 'rgba(0,0,0,0.2)',
                      color: isSelected ? '#4a9abf' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Eye size={15} style={{ opacity: isSelected ? 1 : 0.6 }} />
                    <span style={{ fontWeight: isSelected ? 700 : 500 }}>{vName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Detail Pane */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* View Overview & Pipeline */}
            <div className="card" style={{ background: 'var(--studio-panel)', borderColor: 'var(--studio-border)', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#4a9abf', textTransform: 'uppercase', fontWeight: 700 }}>
                    Virtual Relation
                  </span>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0', fontFamily: 'var(--font-mono)' }}>
                    {selectedView}
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0' }}>
                    {currentMeta.purpose}
                  </p>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={() => loadViewData(selectedView)}
                  disabled={executing}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                >
                  <RefreshCw size={14} className={executing ? 'animate-spin' : ''} />
                  <span>Refresh Dataset</span>
                </button>
              </div>

              {/* Visual Pipeline Diagram */}
              <div style={{ background: 'rgba(0,0,0,0.35)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-muted)', marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 600 }}>
                  Relational Computation Flow:
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {currentMeta.sources.map(src => (
                      <span key={src} style={{ fontSize: '12px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', padding: '4px 10px', borderRadius: '6px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                        {src}
                      </span>
                    ))}
                  </div>

                  <ArrowRight size={18} style={{ color: '#4a9abf' }} />

                  <span style={{ fontSize: '12px', background: 'rgba(74,154,191,0.2)', border: '1px solid #4a9abf', padding: '6px 14px', borderRadius: '6px', color: '#a0cde0', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    VIEW: {selectedView}
                  </span>

                  <ArrowRight size={18} style={{ color: 'var(--green-primary)' }} />

                  <span style={{ fontSize: '12px', background: 'rgba(134,188,66,0.15)', border: '1px solid var(--green-primary)', padding: '6px 14px', borderRadius: '6px', color: 'var(--green-primary)', fontWeight: 600 }}>
                    Dynamic Result Set
                  </span>
                </div>
              </div>

              {/* View SQL Definition (if present in information_schema or fallback) */}
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  SQL View Definition (from system catalog):
                </span>
                <pre className="sql-display" style={{ maxHeight: '160px', overflowY: 'auto' }}>
                  {currentViewObj.view_definition || `CREATE OR REPLACE VIEW ${selectedView} AS\n-- View query definition loaded from PostgreSQL catalog\nSELECT ...`}
                </pre>
              </div>

              {/* Live Sample Results Table */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    Live PostgreSQL Result (First 10 Rows)
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--green-primary)' }}>
                    {viewData.length} records retrieved
                  </span>
                </div>

                {executing ? (
                  <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Executing query against view in PostgreSQL...
                  </div>
                ) : viewData.length === 0 ? (
                  <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', border: '1px dashed var(--border)', borderRadius: '8px' }}>
                    No rows returned from this view. Ensure database seed data has been applied.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', maxHeight: '360px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <table className="data-table" style={{ fontSize: '12px' }}>
                      <thead>
                        <tr>
                          {Object.keys(viewData[0]).map(k => (
                            <th key={k} style={{ fontFamily: 'var(--font-mono)' }}>{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {viewData.map((row, rIdx) => (
                          <tr key={rIdx}>
                            {Object.values(row).map((v, cIdx) => (
                              <td key={cIdx} style={{ fontFamily: typeof v === 'number' ? 'var(--font-mono)' : 'inherit', whiteSpace: 'nowrap' }}>
                                {v === null ? <span style={{ color: 'var(--text-muted)' }}>NULL</span> : String(v)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
