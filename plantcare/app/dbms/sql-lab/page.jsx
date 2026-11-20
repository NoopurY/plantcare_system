'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import AppShell from '@/app/components/ui/AppShell';
import {
  Play, Trash2, AlignLeft, Clock, ChevronDown, ChevronRight,
  CheckCircle, XCircle, History, Database, Info, BookOpen,
  ChevronUp, Terminal
} from 'lucide-react';

/* ── Example queries ── */
const EXAMPLE_CATEGORIES = [
  {
    label: 'Basic Queries',
    queries: [
      {
        name: 'All Plants',
        sql: `SELECT p.plant_id, p.plant_name, p.location, p.health_status, s.common_name AS species
FROM plants p
LEFT JOIN species s ON p.species_id = s.species_id
ORDER BY p.created_at DESC
LIMIT 20;`,
        explanation: {
          type: 'SELECT',
          tables: ['plants', 'species'],
          description: 'Retrieves all plants with their species name via a LEFT JOIN. Plants without a species still appear.',
          concept: 'JOIN — combines rows from two tables based on a matching column (species_id).',
        },
      },
      {
        name: 'Filter by Health Status',
        sql: `SELECT plant_name, health_status, location
FROM plants
WHERE health_status = 'critical'
ORDER BY plant_name;`,
        explanation: {
          type: 'SELECT + WHERE',
          tables: ['plants'],
          description: 'Filters plants to only show those with critical health status.',
          concept: 'WHERE clause — restricts result rows based on a condition.',
        },
      },
      {
        name: 'Count by Species',
        sql: `SELECT s.common_name, COUNT(p.plant_id) AS plant_count
FROM species s
LEFT JOIN plants p ON s.species_id = p.species_id
GROUP BY s.species_id, s.common_name
ORDER BY plant_count DESC;`,
        explanation: {
          type: 'AGGREGATE',
          tables: ['species', 'plants'],
          description: 'Counts how many plants belong to each species, including species with zero plants.',
          concept: 'GROUP BY + COUNT — aggregate function over grouped rows.',
        },
      },
    ],
  },
  {
    label: 'Aggregation',
    queries: [
      {
        name: 'Health Status Distribution',
        sql: `SELECT health_status, COUNT(*) AS plant_count,
       ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS percentage
FROM plants
GROUP BY health_status
ORDER BY plant_count DESC;`,
        explanation: {
          type: 'AGGREGATE + WINDOW',
          tables: ['plants'],
          description: 'Groups plants by health status and calculates both count and percentage using a window function.',
          concept: 'GROUP BY + Window Function (SUM OVER ()) — computes aggregate relative to entire result set.',
        },
      },
      {
        name: 'HAVING Filter',
        sql: `SELECT s.common_name, COUNT(p.plant_id) AS plant_count
FROM species s
JOIN plants p ON s.species_id = p.species_id
GROUP BY s.common_name
HAVING COUNT(p.plant_id) > 1
ORDER BY plant_count DESC;`,
        explanation: {
          type: 'AGGREGATE + HAVING',
          tables: ['species', 'plants'],
          description: 'Only shows species that have more than 1 plant registered.',
          concept: 'HAVING — filters groups after aggregation (unlike WHERE which filters rows before grouping).',
        },
      },
    ],
  },
  {
    label: 'Views',
    queries: [
      {
        name: 'Plant Health Summary View',
        sql: `SELECT * FROM plant_health_summary LIMIT 20;`,
        explanation: {
          type: 'VIEW',
          tables: ['plant_health_summary (view)'],
          description: 'Queries the pre-built plant_health_summary view that aggregates health data per plant.',
          concept: 'Database View — a named, stored SELECT query that simplifies complex joins.',
        },
      },
      {
        name: 'Plant Activity Summary View',
        sql: `SELECT * FROM plant_activity_summary LIMIT 20;`,
        explanation: {
          type: 'VIEW',
          tables: ['plant_activity_summary (view)'],
          description: 'Queries the plant_activity_summary view showing recent care activity per plant.',
          concept: 'View as an abstraction layer — hides complexity from application queries.',
        },
      },
    ],
  },
  {
    label: 'Functions',
    queries: [
      {
        name: 'Calculate Health Score',
        sql: `SELECT plant_id, plant_name,
       calculate_plant_health_score(plant_id) AS health_score
FROM plants
ORDER BY health_score DESC
LIMIT 10;`,
        explanation: {
          type: 'FUNCTION CALL',
          tables: ['plants'],
          description: 'Calls the stored function calculate_plant_health_score() for each plant and ranks them.',
          concept: 'Stored Function — reusable server-side logic that returns a computed value per row.',
        },
      },
      {
        name: 'Get Plant Statistics',
        sql: `SELECT p.plant_name, gs.*
FROM plants p
CROSS JOIN LATERAL get_plant_statistics(p.plant_id) gs
LIMIT 10;`,
        explanation: {
          type: 'SET-RETURNING FUNCTION',
          tables: ['plants', 'get_plant_statistics() (function)'],
          description: 'Calls the set-returning function get_plant_statistics(plant_id) for each plant via a LATERAL join.',
          concept: 'Set-Returning Function (SRF) — a function that returns a table of rows.',
        },
      },
    ],
  },
  {
    label: 'Subqueries',
    queries: [
      {
        name: 'Plants with Active Diseases',
        sql: `SELECT p.plant_name, p.health_status
FROM plants p
WHERE p.plant_id IN (
  SELECT dr.plant_id
  FROM disease_records dr
  WHERE dr.resolved_at IS NULL
    AND dr.detected_at > NOW() - INTERVAL '30 days'
)
ORDER BY p.health_status;`,
        explanation: {
          type: 'SUBQUERY (IN)',
          tables: ['plants', 'disease_records'],
          description: 'Uses a subquery to find plants that had a disease detected in the last 30 days.',
          concept: 'Correlated Subquery with IN — the outer query filters based on values returned by the inner query.',
        },
      },
      {
        name: 'Users with Critical Plants',
        sql: `SELECT u.email, COUNT(p.plant_id) AS critical_count
FROM users u
JOIN plants p ON u.user_id = p.user_id
WHERE p.health_status = 'critical'
GROUP BY u.user_id, u.email
HAVING COUNT(p.plant_id) > 0
ORDER BY critical_count DESC;`,
        explanation: {
          type: 'AGGREGATE + HAVING',
          tables: ['users', 'plants'],
          description: 'Finds users who have at least one plant in critical health.',
          concept: 'Multi-table JOIN with HAVING — aggregates after joining and filters groups.',
        },
      },
    ],
  },
  {
    label: 'System',
    queries: [
      {
        name: 'Database Statistics',
        sql: `SELECT schemaname, relname AS tablename,
       n_live_tup AS live_rows,
       n_dead_tup AS dead_rows,
       pg_size_pretty(pg_total_relation_size(quote_ident(relname))) AS total_size
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;`,
        explanation: {
          type: 'SYSTEM CATALOG',
          tables: ['pg_stat_user_tables'],
          description: 'Reads PostgreSQL system catalog to get live row counts and sizes for all user tables.',
          concept: 'System Catalog — PostgreSQL internal tables (pg_stat_*) that store metadata about the database.',
        },
      },
      {
        name: 'Index Information',
        sql: `SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;`,
        explanation: {
          type: 'SYSTEM CATALOG',
          tables: ['pg_indexes'],
          description: 'Lists all indexes in the public schema with their definition SQL.',
          concept: 'pg_indexes — a system view exposing index metadata for all tables.',
        },
      },
      {
        name: 'Table Sizes',
        sql: `SELECT table_name,
       pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) AS size,
       pg_total_relation_size(quote_ident(table_name)) AS raw_size
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY raw_size DESC;`,
        explanation: {
          type: 'INFORMATION SCHEMA',
          tables: ['information_schema.tables'],
          description: 'Lists all public tables sorted by their total disk size.',
          concept: 'information_schema — SQL-standard views for database metadata (portable across DBMS).',
        },
      },
    ],
  },
];

const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
  'ON', 'AND', 'OR', 'NOT', 'IN', 'EXISTS', 'LIKE', 'BETWEEN', 'IS', 'NULL',
  'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT', 'OFFSET', 'INSERT', 'UPDATE',
  'DELETE', 'CREATE', 'DROP', 'ALTER', 'TABLE', 'INDEX', 'VIEW', 'FUNCTION',
  'RETURNS', 'AS', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'ROUND',
  'OVER', 'PARTITION', 'WITH', 'UNION', 'ALL', 'CASE', 'WHEN', 'THEN', 'ELSE',
  'END', 'INTERVAL', 'NOW', 'COALESCE', 'CAST', 'ASC', 'DESC', 'FULL',
];

function formatSQL(sql) {
  let result = sql;
  SQL_KEYWORDS.forEach(kw => {
    const re = new RegExp(`\\b${kw}\\b`, 'gi');
    result = result.replace(re, kw);
  });
  return result;
}

const MAX_HISTORY = 10;
const STORAGE_KEY = 'verde_sql_history';

function loadHistory() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

function saveHistory(history) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

/* ── Styles ── */
const S = {
  page: { fontFamily: 'var(--font-sans)', display: 'flex', flexDirection: 'column', gap: '16px', height: 'calc(100vh - 108px)', minHeight: 0 },
  notice: {
    padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 500,
    background: 'rgba(74,154,191,0.1)', border: '1px solid rgba(74,154,191,0.3)',
    color: '#4a9abf', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0,
  },
  mainGrid: { display: 'grid', gridTemplateColumns: '220px 1fr', gap: '14px', flex: 1, minHeight: 0 },
  sidebar: {
    background: '#0e1c2a', border: '1px solid rgba(74,154,191,0.15)',
    borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
  },
  sidebarHeader: {
    padding: '12px 14px', borderBottom: '1px solid rgba(74,154,191,0.1)',
    fontSize: '11px', fontWeight: 700, color: '#4a9abf',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    display: 'flex', alignItems: 'center', gap: '6px',
  },
  sidebarScroll: { overflowY: 'auto', flex: 1 },
  catLabel: {
    padding: '8px 14px 4px', fontSize: '10px', fontWeight: 700,
    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  queryBtn: (active) => ({
    display: 'block', width: '100%', textAlign: 'left',
    padding: '7px 14px', fontSize: '12px', fontWeight: 500,
    color: active ? '#4a9abf' : 'var(--text-secondary)',
    background: active ? 'rgba(74,154,191,0.1)' : 'transparent',
    border: 'none', cursor: 'pointer',
    borderLeft: active ? '2px solid #4a9abf' : '2px solid transparent',
    transition: 'all 0.12s',
  }),
  editorPanel: {
    display: 'flex', flexDirection: 'column', gap: '10px', minHeight: 0,
  },
  toolbar: {
    display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flexShrink: 0,
  },
  btnRun: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '8px 16px', borderRadius: '8px', border: 'none',
    background: 'rgba(34,197,94,0.15)', color: '#22c55e',
    fontSize: '13px', fontWeight: 600, cursor: 'pointer',
    border: '1px solid rgba(34,197,94,0.3)',
  },
  btnSecondary: {
    display: 'flex', alignItems: 'center', gap: '6px',
    padding: '8px 14px', borderRadius: '8px',
    background: 'rgba(74,154,191,0.08)', color: 'var(--text-muted)',
    fontSize: '12px', fontWeight: 500, cursor: 'pointer',
    border: '1px solid rgba(74,154,191,0.15)',
  },
  execInfo: { fontSize: '12px', color: 'var(--text-muted)', marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' },
  editorWrap: {
    flex: 1, minHeight: 0, position: 'relative',
    background: '#060e16', border: '1px solid rgba(74,154,191,0.2)',
    borderRadius: '10px', overflow: 'hidden', display: 'flex',
  },
  lineNums: {
    width: '40px', flexShrink: 0, background: '#080f18',
    borderRight: '1px solid rgba(74,154,191,0.1)',
    padding: '14px 8px', textAlign: 'right',
    color: 'rgba(74,154,191,0.3)', fontSize: '12px',
    fontFamily: 'var(--font-mono)', lineHeight: '20px',
    userSelect: 'none', overflowY: 'hidden',
  },
  textarea: {
    flex: 1, background: 'transparent', border: 'none', outline: 'none',
    color: '#c9dbe8', fontFamily: 'var(--font-mono)',
    fontSize: '13px', lineHeight: '20px', padding: '14px',
    resize: 'none', minHeight: 0,
  },
  card: {
    background: '#0e1c2a', border: '1px solid rgba(74,154,191,0.15)',
    borderRadius: '12px', overflow: 'hidden',
  },
  cardHeader: {
    padding: '10px 16px', borderBottom: '1px solid rgba(74,154,191,0.1)',
    display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between',
  },
  cardTitle: { fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' },
  badge: (color, bg) => ({
    padding: '2px 8px', borderRadius: '999px', fontSize: '10px', fontWeight: 700,
    color, background: bg, border: `1px solid ${color}44`,
  }),
  tableWrap: { overflowX: 'auto', overflowY: 'auto', maxHeight: '240px' },
  th: {
    padding: '8px 12px', background: 'rgba(74,154,191,0.08)',
    borderBottom: '1px solid rgba(74,154,191,0.12)',
    fontSize: '11px', fontWeight: 600, color: '#4a9abf',
    textAlign: 'left', whiteSpace: 'nowrap', position: 'sticky', top: 0,
  },
  td: {
    padding: '8px 12px', fontSize: '12px', color: 'var(--text-secondary)',
    borderBottom: '1px solid rgba(74,154,191,0.05)',
    maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  errorBox: {
    margin: '16px', padding: '14px', borderRadius: '8px',
    background: 'rgba(201,74,74,0.08)', border: '1px solid rgba(201,74,74,0.25)',
    color: '#e05252', fontSize: '13px', fontFamily: 'var(--font-mono)',
  },
  historyItem: (ok) => ({
    padding: '8px 14px', borderBottom: '1px solid rgba(74,154,191,0.06)',
    cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'flex-start',
  }),
  explainCard: {
    background: 'rgba(74,154,191,0.05)', border: '1px solid rgba(74,154,191,0.15)',
    borderRadius: '10px', padding: '14px 16px', marginTop: '10px',
  },
  explainRow: { display: 'flex', gap: '8px', marginBottom: '6px', fontSize: '12px', alignItems: 'flex-start' },
  explainLabel: { color: '#4a9abf', fontWeight: 600, minWidth: '90px', flexShrink: 0 },
  explainValue: { color: 'var(--text-secondary)', flex: 1 },
};

export default function SQLLabPage() {
  const [sql, setSql] = useState(`SELECT p.plant_id, p.plant_name, p.location, p.health_status, s.common_name AS species
FROM plants p
LEFT JOIN species s ON p.species_id = s.species_id
ORDER BY p.created_at DESC
LIMIT 20;`);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [execTime, setExecTime] = useState(null);
  const [rowCount, setRowCount] = useState(null);
  const [selectedExample, setSelectedExample] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => { setHistory(loadHistory()); }, []);

  const lineCount = sql.split('\n').length;

  const runQuery = useCallback(async () => {
    if (!sql.trim()) return;
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch('/api/db/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sql }),
      });
      const data = await res.json();
      setResult(data);
      setExecTime(data.executionTime || null);
      setRowCount(data.rowCount ?? null);

      const entry = {
        sql: sql.trim().slice(0, 120),
        ts: new Date().toLocaleTimeString(),
        ok: !data.error,
      };
      const newHist = [entry, ...history].slice(0, MAX_HISTORY);
      setHistory(newHist);
      saveHistory(newHist);
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setRunning(false);
    }
  }, [sql, history]);

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runQuery(); }
    if (e.key === 'Tab') {
      e.preventDefault();
      const t = e.target;
      const start = t.selectionStart;
      const end = t.selectionEnd;
      const newVal = sql.substring(0, start) + '  ' + sql.substring(end);
      setSql(newVal);
      requestAnimationFrame(() => { t.selectionStart = t.selectionEnd = start + 2; });
    }
  };

  const loadExample = (cat, q) => {
    setSql(q.sql);
    setSelectedExample(q);
    setResult(null);
    setExecTime(null);
    setRowCount(null);
  };

  return (
    <AppShell>
      <div style={S.page}>
        {/* Safety notice */}
        <div style={S.notice}>
          <Terminal size={13} />
          <strong>SQL Lab</strong> — SELECT and EXPLAIN queries only — write operations are restricted for security.
          Press <kbd style={{ background: 'rgba(74,154,191,0.2)', padding: '1px 5px', borderRadius: '4px' }}>Ctrl+Enter</kbd> to run.
        </div>

        {/* Main grid: sidebar + editor+results */}
        <div style={S.mainGrid}>
          {/* Example queries sidebar */}
          <div style={S.sidebar}>
            <div style={S.sidebarHeader}>
              <BookOpen size={12} /> Examples
            </div>
            <div style={S.sidebarScroll}>
              {EXAMPLE_CATEGORIES.map(cat => (
                <div key={cat.label}>
                  <div style={S.catLabel}>{cat.label}</div>
                  {cat.queries.map(q => (
                    <button
                      key={q.name}
                      style={S.queryBtn(selectedExample?.name === q.name)}
                      onClick={() => loadExample(cat, q)}
                    >
                      {q.name}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Editor + results column */}
          <div style={S.editorPanel}>
            {/* Toolbar */}
            <div style={S.toolbar}>
              <button style={S.btnRun} onClick={runQuery} disabled={running}>
                <Play size={14} fill="currentColor" />
                {running ? 'Running…' : 'Run Query'}
              </button>
              <button style={S.btnSecondary} onClick={() => { setSql(''); setResult(null); setSelectedExample(null); setExecTime(null); setRowCount(null); }}>
                <Trash2 size={13} /> Clear
              </button>
              <button style={S.btnSecondary} onClick={() => setSql(formatSQL(sql))}>
                <AlignLeft size={13} /> Format
              </button>
              <div style={S.execInfo}>
                {execTime && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={11} />{execTime}</span>}
                {rowCount !== null && <span style={{ color: '#22c55e', fontWeight: 600 }}>{rowCount} row{rowCount !== 1 ? 's' : ''}</span>}
              </div>
            </div>

            {/* Editor */}
            <div style={S.editorWrap}>
              <div style={S.lineNums} aria-hidden>
                {Array.from({ length: lineCount }, (_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <textarea
                ref={textareaRef}
                style={S.textarea}
                value={sql}
                onChange={e => setSql(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
                placeholder="-- Enter SQL here (SELECT / EXPLAIN only)"
              />
            </div>

            {/* Results */}
            {result && (
              <div style={S.card}>
                <div style={S.cardHeader}>
                  <div style={S.cardTitle}>
                    {result.error
                      ? <><XCircle size={13} color="#e05252" /> Query Error</>
                      : <><CheckCircle size={13} color="#22c55e" /> Results</>}
                  </div>
                  {!result.error && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {execTime && <span style={S.badge('#4a9abf', 'rgba(74,154,191,0.1)')}><Clock size={9} style={{ display: 'inline', marginRight: 3 }} />{execTime}</span>}
                      <span style={S.badge('#22c55e', 'rgba(34,197,94,0.1)')}>{rowCount} rows</span>
                    </div>
                  )}
                </div>
                {result.error ? (
                  <div style={S.errorBox}>
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>PostgreSQL Error {result.code && `[${result.code}]`}</div>
                    <div>{result.error}</div>
                    {result.detail && <div style={{ marginTop: '6px', opacity: 0.7 }}>{result.detail}</div>}
                  </div>
                ) : (
                  <div style={S.tableWrap}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {(result.fields || []).map(f => (
                            <th key={f} style={S.th}>{f}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(result.rows || []).length === 0 ? (
                          <tr><td colSpan={result.fields?.length || 1} style={{ ...S.td, textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No rows returned</td></tr>
                        ) : (result.rows || []).map((row, ri) => (
                          <tr key={ri} onMouseEnter={e => e.currentTarget.querySelectorAll('td').forEach(td => td.style.background = 'rgba(74,154,191,0.04)')}
                            onMouseLeave={e => e.currentTarget.querySelectorAll('td').forEach(td => td.style.background = 'transparent')}>
                            {(result.fields || []).map(f => (
                              <td key={f} style={S.td} title={String(row[f] ?? '')}>
                                {row[f] === null ? <span style={{ color: 'rgba(74,154,191,0.4)', fontStyle: 'italic' }}>NULL</span> : String(row[f])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Query explanation for selected example */}
            {selectedExample?.explanation && (
              <div style={S.card}>
                <div style={S.cardHeader}>
                  <div style={S.cardTitle}><Info size={13} color="#4a9abf" /> Query Explanation</div>
                  <span style={S.badge('#4a9abf', 'rgba(74,154,191,0.1)')}>{selectedExample.explanation.type}</span>
                </div>
                <div style={{ padding: '12px 16px' }}>
                  <div style={S.explainRow}><span style={S.explainLabel}>Tables</span><span style={S.explainValue}>{selectedExample.explanation.tables.join(', ')}</span></div>
                  <div style={S.explainRow}><span style={S.explainLabel}>What it does</span><span style={S.explainValue}>{selectedExample.explanation.description}</span></div>
                  <div style={S.explainRow}><span style={S.explainLabel}>DBMS Concept</span><span style={{ ...S.explainValue, color: '#4a9abf' }}>{selectedExample.explanation.concept}</span></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Query History */}
        <div style={{ ...S.card, flexShrink: 0 }}>
          <button
            style={{ ...S.cardHeader, width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}
            onClick={() => setHistoryOpen(o => !o)}
          >
            <div style={S.cardTitle}><History size={13} color="#4a9abf" /> Query History <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({history.length})</span></div>
            {historyOpen ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
          </button>
          {historyOpen && (
            <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
              {history.length === 0 ? (
                <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '12px', textAlign: 'center' }}>No queries yet</div>
              ) : history.map((h, i) => (
                <div
                  key={i}
                  style={S.historyItem(h.ok)}
                  onClick={() => { setSql(h.sql); setResult(null); setSelectedExample(null); }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(74,154,191,0.04)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {h.ok
                    ? <CheckCircle size={12} color="#22c55e" style={{ flexShrink: 0, marginTop: '2px' }} />
                    : <XCircle size={12} color="#e05252" style={{ flexShrink: 0, marginTop: '2px' }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                      {h.sql}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>{h.ts}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
