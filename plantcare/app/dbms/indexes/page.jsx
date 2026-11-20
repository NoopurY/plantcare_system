// app/dbms/indexes/page.jsx - PostgreSQL Index Management & B-Tree Visualizer
'use client';
import { useState, useEffect } from 'react';
import AppShell from '@/app/components/ui/AppShell';
import {
  Search, Database, Zap, Layers, BarChart2,
  TrendingDown, CheckCircle2, Info, ArrowRight, HardDrive
} from 'lucide-react';

const INDEX_RATIONALES = {
  idx_plants_user_id: 'Eliminates sequential table scans when users view their personal collection. Filters directly on user_id.',
  idx_plants_species_id: 'Accelerates foreign key joins between plants and the normalized species catalog.',
  idx_plants_health_status: 'Powers dashboard aggregates filtering on healthy, needs_attention, and critical plant states.',
  idx_watering_logs_plant_date: 'Composite B-tree index optimizing queries filtering by plant_id and sorting descending by watered_at.',
  idx_fertilization_logs_plant_date: 'Composite index accelerating chronological fertilization history pagination.',
  idx_growth_logs_plant_date: 'Optimizes time-series growth tracking charts for individual plants.',
  idx_health_logs_plant_date: 'Allows rapid lookup of the single latest health record for LATERAL joins in views.',
  idx_disease_records_plant_id: 'Speeds up disease history lookups on plant detail screens.',
  idx_notifications_user_unread: 'Partial filtered index (WHERE is_read = FALSE) making notification bell queries virtually instantaneous.',
  idx_audit_logs_created_at: 'Accelerates system activity monitoring queries sorted in reverse chronological order.'
};

export default function IndexesPage() {
  const [indexes, setIndexes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState('all');

  useEffect(() => {
    async function loadIndexes() {
      try {
        const res = await fetch('/api/db/indexes');
        if (res.ok) {
          const data = await res.json();
          setIndexes(data.indexes || data || []);
        }
      } catch (err) {
        console.error('Failed to load indexes:', err);
      } finally {
        setLoading(false);
      }
    }
    loadIndexes();
  }, []);

  const tables = ['all', ...new Set(indexes.map(i => i.tablename))];

  const filteredIndexes = selectedTable === 'all'
    ? indexes
    : indexes.filter(i => i.tablename === selectedTable);

  return (
    <AppShell>
      <div style={{ padding: '28px', maxWidth: '1380px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ background: 'rgba(74, 154, 191, 0.15)', padding: '8px', borderRadius: '10px' }}>
              <Search size={24} style={{ color: '#4a9abf' }} />
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Index Management &amp; B-Tree Visualizer
            </h1>
            <span style={{ fontSize: '11px', background: 'rgba(74,154,191,0.15)', color: '#4a9abf', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
              PostgreSQL B-Tree Catalog
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '780px', margin: 0 }}>
            Inspect real B-Tree indexes defined in <code>database/indexes.sql</code>. Compares Seq Scan O(N) complexity vs Index Scan O(log N) lookup structures to optimize query latency on high-frequency predicates.
          </p>
        </div>

        {/* Index Performance Comparison Card */}
        <div className="card" style={{ background: 'var(--studio-panel)', borderColor: 'var(--studio-border)', padding: '24px', marginBottom: '28px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingDown size={18} style={{ color: 'var(--green-primary)' }} />
            Algorithmic Performance Comparison: Sequential Scan vs B-Tree Index Scan
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Sequential Scan */}
            <div style={{ background: 'rgba(201, 74, 74, 0.08)', border: '1px solid rgba(201, 74, 74, 0.3)', borderRadius: '12px', padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--error)' }}>
                  WITHOUT INDEX (Sequential Scan)
                </span>
                <span style={{ fontSize: '11px', background: 'rgba(201,74,74,0.2)', color: 'var(--error)', padding: '2px 8px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                  O(N) Complexity
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>
                PostgreSQL must read every disk page and check each tuple against the predicate condition. Cost grows linearly with table size.
              </p>
              <div style={{ height: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '92%', height: '100%', background: 'var(--error)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>Pages Read: 1,000+ pages</span>
                <span>Latency: ~45ms on large tables</span>
              </div>
            </div>

            {/* B-Tree Scan */}
            <div style={{ background: 'rgba(134, 188, 66, 0.08)', border: '1px solid rgba(134, 188, 66, 0.3)', borderRadius: '12px', padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--green-primary)' }}>
                  WITH B-TREE INDEX (Index Scan)
                </span>
                <span style={{ fontSize: '11px', background: 'rgba(134,188,66,0.2)', color: 'var(--green-primary)', padding: '2px 8px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                  O(log N) Complexity
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.5 }}>
                Engine traverses root &rarr; intermediate &rarr; leaf nodes in 3-4 block reads, fetching target row pointers directly.
              </p>
              <div style={{ height: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: '8%', height: '100%', background: 'var(--green-primary)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>Pages Read: 3-4 pages</span>
                <span>Latency: &lt; 0.5ms lookup</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Filter by Relation:</span>
          {tables.map(t => (
            <button
              key={t}
              onClick={() => setSelectedTable(t)}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                border: '1px solid',
                borderColor: selectedTable === t ? '#4a9abf' : 'var(--border)',
                background: selectedTable === t ? 'rgba(74, 154, 191, 0.2)' : 'transparent',
                color: selectedTable === t ? '#4a9abf' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)'
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Index Grid */}
        {loading ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            {[1, 2, 3, 4].map(i => <div key={i} className="card skeleton" style={{ height: '100px' }} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {filteredIndexes.map(idx => {
              const rationale = INDEX_RATIONALES[idx.indexname] || 'Provides indexing over high-frequency lookup columns.';
              return (
                <div
                  key={idx.indexname}
                  className="card"
                  style={{
                    background: 'var(--studio-panel)',
                    borderColor: 'var(--studio-border)',
                    padding: '20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '20px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ flex: '1 1 500px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {idx.indexname}
                      </span>
                      <span style={{ fontSize: '10px', background: 'rgba(74, 154, 191, 0.15)', color: '#4a9abf', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 600 }}>
                        B-Tree
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        ON table: <strong style={{ color: 'var(--sage)' }}>{idx.tablename}</strong>
                      </span>
                    </div>

                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '6px 0 10px', lineHeight: 1.5 }}>
                      <strong>Engineering Rationale:</strong> {rationale}
                    </p>

                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.3)', padding: '6px 10px', borderRadius: '6px' }}>
                      {idx.indexdef}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Index Scans</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--green-primary)', fontFamily: 'var(--font-mono)' }}>
                        {idx.scans || 0}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Storage Size</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {idx.index_size || '16 kB'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
