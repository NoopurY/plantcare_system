'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import AppShell from '@/app/components/ui/AppShell';
import { Network, X, Key, Link } from 'lucide-react';

/* ── Hardcoded layout positions [x, y, width] ── */
const TABLE_LAYOUT = {
  users:              { x: 40,   y: 40,   w: 180 },
  roles:              { x: 40,   y: 300,  w: 180 },
  species:            { x: 280,  y: 40,   w: 200 },
  care_profiles:      { x: 280,  y: 260,  w: 200 },
  plants:             { x: 280,  y: 490,  w: 200 },
  watering_logs:      { x: 560,  y: 40,   w: 200 },
  fertilization_logs: { x: 560,  y: 230,  w: 200 },
  growth_logs:        { x: 560,  y: 430,  w: 200 },
  health_logs:        { x: 560,  y: 630,  w: 200 },
  diseases:           { x: 840,  y: 40,   w: 200 },
  disease_records:    { x: 840,  y: 240,  w: 200 },
  care_schedules:     { x: 40,   y: 580,  w: 200 },
  notifications:      { x: 280,  y: 740,  w: 200 },
  audit_logs:         { x: 560,  y: 820,  w: 200 },
};

/* ── Relationships: [from, to, label] ── */
const RELATIONSHIPS = [
  ['roles',    'users',              'role_id'],
  ['users',    'plants',             'user_id'],
  ['users',    'care_schedules',     'user_id'],
  ['users',    'notifications',      'user_id'],
  ['users',    'audit_logs',         'user_id'],
  ['species',  'plants',             'species_id'],
  ['species',  'care_profiles',      'species_id'],
  ['plants',   'watering_logs',      'plant_id'],
  ['plants',   'fertilization_logs', 'plant_id'],
  ['plants',   'growth_logs',        'plant_id'],
  ['plants',   'health_logs',        'plant_id'],
  ['plants',   'disease_records',    'plant_id'],
  ['plants',   'care_schedules',     'plant_id'],
  ['plants',   'notifications',      'plant_id'],
  ['diseases', 'disease_records',    'disease_id'],
];

const TABLE_PURPOSES = {
  users: 'Core user accounts with authentication credentials and profile data.',
  roles: 'Role-based access control definitions (admin, user, etc.).',
  plants: 'Individual plant instances owned by users, with health and growth status.',
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

const ROW_H = 22;
const HEADER_H = 30;
const PAD = 8;

function tableHeight(cols) {
  return HEADER_H + PAD + (cols?.length || 0) * ROW_H + PAD;
}

function centerRight(tbl, cols) {
  return { x: tbl.x + tbl.w, y: tbl.y + tableHeight(cols) / 2 };
}

function centerLeft(tbl, cols) {
  return { x: tbl.x, y: tbl.y + tableHeight(cols) / 2 };
}

function getConnectionPoints(from, to, colsMap) {
  const fl = TABLE_LAYOUT[from];
  const tl = TABLE_LAYOUT[to];
  if (!fl || !tl) return null;
  const fc = colsMap[from] || [];
  const tc = colsMap[to]  || [];
  const fromCenter = fl.x + fl.w / 2;
  const toCenter   = tl.x + tl.w / 2;
  if (fromCenter < toCenter) {
    return { x1: centerRight(fl, fc).x, y1: centerRight(fl, fc).y, x2: centerLeft(tl, tc).x, y2: centerLeft(tl, tc).y };
  } else {
    return { x1: centerLeft(fl, fc).x, y1: centerLeft(fl, fc).y, x2: centerRight(tl, tc).x, y2: centerRight(tl, tc).y };
  }
}

export default function ERExplorerPage() {
  const [schema, setSchema]     = useState({});
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const svgRef = useRef(null);
  const [pan, setPan]   = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(0.85);
  const dragRef = useRef({ dragging: false, sx: 0, sy: 0, ox: 0, oy: 0 });

  useEffect(() => {
    fetch('/api/db/schema', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        const map = {};
        const tables = d.tables || {};
        Object.entries(tables).forEach(([tableName, info]) => {
          const constraintsByColumn = {};
          (info.constraints || []).forEach(c => {
            // Prefer PRIMARY KEY over FOREIGN KEY when a column has both
            if (!constraintsByColumn[c.column_name] || c.constraint_type === 'PRIMARY KEY') {
              constraintsByColumn[c.column_name] = c.constraint_type;
            }
          });
          map[tableName] = (info.columns || []).map(col => ({
            ...col,
            constraint_type: constraintsByColumn[col.column_name] || null,
          }));
        });
        setSchema(map);
      })
      .catch(() => setSchema({}))
      .finally(() => setLoading(false));
  }, []);

  /* Drag pan */
  const onMouseDown = useCallback((e) => {
    if (e.target.closest('.er-entity')) return;
    dragRef.current = { dragging: true, sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y };
  }, [pan]);
  const onMouseMove = useCallback((e) => {
    if (!dragRef.current.dragging) return;
    setPan({ x: dragRef.current.ox + (e.clientX - dragRef.current.sx), y: dragRef.current.oy + (e.clientY - dragRef.current.sy) });
  }, []);
  const onMouseUp = useCallback(() => { dragRef.current.dragging = false; }, []);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    setScale(s => Math.max(0.3, Math.min(2, s - e.deltaY * 0.001)));
  }, []);

  /* Compute SVG viewBox bounds */
  const svgW = 1120;
  const svgH = 1060;

  const selCols = selected ? (schema[selected] || []) : [];
  const pks = selCols.filter(c => c.constraint_type === 'PRIMARY KEY');
  const fks = selCols.filter(c => c.constraint_type === 'FOREIGN KEY');

  return (
    <AppShell>
      <div style={{ fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '4px' }}>
          <Network size={28} color="#4a9abf" />
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>ER Explorer</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>Interactive Entity-Relationship Diagram</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => setScale(s => Math.min(2, s + 0.1))} style={{ padding: '5px 11px', background: 'var(--studio-card)', border: '1px solid var(--studio-border)', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '16px' }}>+</button>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '40px', textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.max(0.3, s - 0.1))} style={{ padding: '5px 11px', background: 'var(--studio-card)', border: '1px solid var(--studio-border)', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '16px' }}>−</button>
            <button onClick={() => { setScale(0.85); setPan({ x: 0, y: 0 }); }} style={{ padding: '5px 11px', background: 'var(--studio-card)', border: '1px solid var(--studio-border)', borderRadius: '6px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '12px' }}>Reset</button>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {[
            { color: '#f59e0b', label: 'PK — Primary Key' },
            { color: '#f97316', label: 'FK — Foreign Key' },
            { color: '#4a9abf', label: 'Regular Column' },
            { color: '#4a9abf', label: '— Relationship', dashed: true },
          ].map(({ color, label, dashed }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
              {dashed
                ? <svg width="24" height="2"><line x1="0" y1="1" x2="24" y2="1" stroke={color} strokeWidth="1.5" strokeDasharray="3,2" /></svg>
                : <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: `${color}33`, border: `1px solid ${color}` }} />
              }
              {label}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
          {/* SVG Canvas */}
          <div
            style={{
              flex: 1, background: 'var(--studio-card)', borderRadius: '12px',
              border: '1px solid var(--studio-border)', overflow: 'hidden',
              cursor: 'grab', height: 'calc(100vh - 260px)', minHeight: '500px', position: 'relative',
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onWheel={onWheel}
          >
            {loading && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                Loading schema…
              </div>
            )}
            <svg width="100%" height="100%" style={{ userSelect: 'none' }}>
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L8,3 z" fill="#4a9abf88" />
                </marker>
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(74,154,191,0.06)" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              <g transform={`translate(${pan.x},${pan.y}) scale(${scale})`}>
                {/* Relationship lines */}
                {RELATIONSHIPS.map(([from, to, label]) => {
                  const pts = getConnectionPoints(from, to, schema);
                  if (!pts) return null;
                  const isHighlighted = selected === from || selected === to;
                  const { x1, y1, x2, y2 } = pts;
                  const mx = (x1 + x2) / 2;
                  const my = (y1 + y2) / 2;
                  return (
                    <g key={`${from}-${to}`}>
                      <path
                        d={`M${x1},${y1} C${(x1+x2)/2+30},${y1} ${(x1+x2)/2-30},${y2} ${x2},${y2}`}
                        fill="none"
                        stroke={isHighlighted ? '#4a9abf' : 'rgba(74,154,191,0.35)'}
                        strokeWidth={isHighlighted ? 1.5 : 1}
                        strokeDasharray={isHighlighted ? '5,3' : '4,3'}
                        markerEnd="url(#arrow)"
                      />
                      {isHighlighted && (
                        <text x={mx} y={my - 5} textAnchor="middle" fill="#4a9abf" fontSize="9" fontFamily="monospace">{label}</text>
                      )}
                    </g>
                  );
                })}

                {/* Entity boxes */}
                {Object.entries(TABLE_LAYOUT).map(([tname, pos]) => {
                  const cols  = schema[tname] || [];
                  const h     = tableHeight(cols);
                  const isSel = selected === tname;
                  return (
                    <g key={tname} className="er-entity" onClick={() => setSelected(isSel ? null : tname)} style={{ cursor: 'pointer' }}>
                      {/* Shadow */}
                      <rect x={pos.x + 3} y={pos.y + 3} width={pos.w} height={h} rx={6} fill="rgba(0,0,0,0.3)" />
                      {/* Body */}
                      <rect x={pos.x} y={pos.y} width={pos.w} height={h} rx={6}
                        fill={isSel ? '#122030' : '#0e1c2a'}
                        stroke={isSel ? '#4a9abf' : 'rgba(74,154,191,0.25)'}
                        strokeWidth={isSel ? 2 : 1}
                      />
                      {/* Header */}
                      <rect x={pos.x} y={pos.y} width={pos.w} height={HEADER_H} rx={6} fill={isSel ? 'rgba(74,154,191,0.25)' : 'rgba(74,154,191,0.12)'} />
                      <rect x={pos.x} y={pos.y + HEADER_H - 6} width={pos.w} height={6} fill={isSel ? 'rgba(74,154,191,0.25)' : 'rgba(74,154,191,0.12)'} />
                      <text x={pos.x + pos.w / 2} y={pos.y + 19} textAnchor="middle"
                        fill={isSel ? '#4a9abf' : '#e8f0e2'} fontSize="12" fontWeight="700" fontFamily="monospace">
                        {tname}
                      </text>

                      {/* Column rows */}
                      {cols.slice(0, 12).map((col, ci) => {
                        const cy = pos.y + HEADER_H + PAD + ci * ROW_H + ROW_H / 2 + 4;
                        const isPK = col.constraint_type === 'PRIMARY KEY';
                        const isFK = col.constraint_type === 'FOREIGN KEY';
                        return (
                          <g key={ci}>
                            <text x={pos.x + 8} y={cy} fill={isPK ? '#f59e0b' : isFK ? '#f97316' : 'rgba(232,240,226,0.7)'}
                              fontSize="10" fontFamily="monospace">
                              {col.column_name?.slice(0, 18) || col.column || ''}
                            </text>
                            {isPK && <text x={pos.x + pos.w - 8} y={cy} textAnchor="end" fill="#f59e0b" fontSize="9" fontWeight="700">PK</text>}
                            {isFK && <text x={pos.x + pos.w - 8} y={cy} textAnchor="end" fill="#f97316" fontSize="9" fontWeight="700">FK</text>}
                          </g>
                        );
                      })}
                      {cols.length > 12 && (
                        <text x={pos.x + pos.w / 2} y={pos.y + HEADER_H + PAD + 12 * ROW_H + 10} textAnchor="middle" fill="rgba(74,154,191,0.5)" fontSize="9">
                          +{cols.length - 12} more…
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {/* Info Panel */}
          {selected && (
            <div style={{
              width: '260px', flexShrink: 0, background: 'var(--studio-card)',
              border: '1px solid var(--studio-border)', borderRadius: '12px',
              padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px',
              height: 'calc(100vh - 260px)', overflowY: 'auto',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 800, color: '#4a9abf' }}>{selected}</span>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}><X size={16} /></button>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                {TABLE_PURPOSES[selected] || 'Database entity.'}
              </p>

              {pks.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}><Key size={11} /> PRIMARY KEYS</div>
                  {pks.map(c => <div key={c.column_name} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#f59e0b', padding: '3px 0' }}>{c.column_name}</div>)}
                </div>
              )}
              {fks.length > 0 && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#f97316', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}><Link size={11} /> FOREIGN KEYS</div>
                  {fks.map(c => <div key={c.column_name} style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#f97316', padding: '3px 0' }}>{c.column_name}</div>)}
                </div>
              )}

              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>All Columns</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {selCols.map(c => (
                    <div key={c.column_name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 6px', borderRadius: '4px', background: 'rgba(0,0,0,0.2)' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: c.constraint_type === 'PRIMARY KEY' ? '#f59e0b' : c.constraint_type === 'FOREIGN KEY' ? '#f97316' : 'var(--text-secondary)' }}>
                        {c.column_name}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>{c.data_type?.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Relationships */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Relationships</div>
                {RELATIONSHIPS.filter(([f, t]) => f === selected || t === selected).map(([f, t, lbl]) => (
                  <div key={`${f}-${t}`} style={{ fontSize: '11px', color: 'var(--text-secondary)', padding: '3px 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: '#4a9abf', fontFamily: 'var(--font-mono)' }}>{f}</span>
                    <span>→</span>
                    <span style={{ color: '#4a9abf', fontFamily: 'var(--font-mono)' }}>{t}</span>
                    <span style={{ color: 'var(--text-faint)', fontSize: '10px' }}>({lbl})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
