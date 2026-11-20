// app/dbms/query-performance/page.jsx - EXPLAIN & EXPLAIN ANALYZE Performance Analyzer
'use client';
import { useState } from 'react';
import AppShell from '@/app/components/ui/AppShell';
import {
  Activity, Play, Terminal, ArrowRight, CheckCircle2,
  Clock, Cpu, HardDrive, AlertTriangle, Layers, GitBranch
} from 'lucide-react';

const PRESET_QUERIES = [
  {
    name: 'Indexed Plant Lookup (Index Scan)',
    sql: "SELECT * FROM plants WHERE user_id = '22222222-2222-2222-2222-222222222222' AND is_active = TRUE;",
    note: 'Utilizes idx_plants_user_id B-Tree index scan.'
  },
  {
    name: 'Care History Join & Aggregate',
    sql: "SELECT p.plant_name, COUNT(w.log_id) AS total_waterings, AVG(w.quantity_ml) AS avg_ml\nFROM plants p\nLEFT JOIN watering_logs w ON p.plant_id = w.plant_id\nGROUP BY p.plant_name;",
    note: 'Demonstrates Hash Join and HashAggregate performance nodes.'
  },
  {
    name: 'Date Range Watering Logs Scan',
    sql: "SELECT * FROM watering_logs WHERE watered_at >= NOW() - INTERVAL '14 days' ORDER BY watered_at DESC;",
    note: 'Range predicate utilizing idx_watering_logs_watered_at.'
  },
  {
    name: 'Lateral Join on plant_health_summary View',
    sql: "SELECT * FROM plant_health_summary WHERE health_status = 'healthy';",
    note: 'Analyzes nested loop and LATERAL subquery optimization in the view.'
  }
];

function PlanNodeView({ node, depth = 0 }) {
  if (!node) return null;

  const isIndexScan = node['Node Type']?.includes('Index');
  const isSeqScan = node['Node Type']?.includes('Seq Scan');
  const isJoin = node['Node Type']?.includes('Join');
  const isAgg = node['Node Type']?.includes('Aggregate');

  const badgeColor = isIndexScan ? 'var(--green-primary)' :
                     isSeqScan ? 'var(--amber)' :
                     isJoin ? '#4a9abf' :
                     isAgg ? '#c9933a' : 'var(--text-secondary)';

  return (
    <div style={{ marginLeft: `${depth * 24}px`, marginTop: '10px' }}>
      <div
        style={{
          background: 'rgba(0,0,0,0.3)',
          border: '1px solid var(--border)',
          borderLeft: `4px solid ${badgeColor}`,
          borderRadius: '8px',
          padding: '12px 16px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitBranch size={16} style={{ color: badgeColor }} />
            <strong style={{ fontSize: '14px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              {node['Node Type']}
            </strong>
            {node['Relation Name'] && (
              <span style={{ fontSize: '12px', color: 'var(--sage)', fontFamily: 'var(--font-mono)' }}>
                ON {node['Relation Name']}
              </span>
            )}
            {node['Index Name'] && (
              <span style={{ fontSize: '11px', background: 'rgba(134,188,66,0.15)', color: 'var(--green-primary)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                idx: {node['Index Name']}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '14px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            <span>Est. Cost: <strong style={{ color: 'var(--text-secondary)' }}>{node['Startup Cost']}..{node['Total Cost']}</strong></span>
            <span>Est. Rows: <strong style={{ color: 'var(--text-secondary)' }}>{node['Plan Rows']}</strong></span>
            {node['Actual Total Time'] !== undefined && (
              <span style={{ color: 'var(--green-primary)' }}>
                Time: <strong>{node['Actual Total Time']} ms</strong>
              </span>
            )}
            {node['Actual Rows'] !== undefined && (
              <span style={{ color: '#4a9abf' }}>
                Actual Rows: <strong>{node['Actual Rows']}</strong>
              </span>
            )}
          </div>
        </div>

        {node['Filter'] && (
          <div style={{ fontSize: '11px', color: 'var(--amber)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
            Filter Predicate: {node['Filter']}
          </div>
        )}
      </div>

      {node.Plans && node.Plans.map((child, idx) => (
        <PlanNodeView key={idx} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function QueryPerformancePage() {
  const [sql, setSql] = useState(PRESET_QUERIES[0].sql);
  const [planResult, setPlanResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleExplain(analyze = false) {
    if (!sql.trim()) return;
    setRunning(true);
    setErrorMsg('');
    setPlanResult(null);

    try {
      const res = await fetch('/api/db/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql, analyze })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to explain query');
      } else {
        setPlanResult(data.plan);
      }
    } catch (err) {
      setErrorMsg('Failed to communicate with EXPLAIN endpoint');
    } finally {
      setRunning(false);
    }
  }

  const rootPlanNode = planResult?.[0]?.Plan;

  return (
    <AppShell>
      <div style={{ padding: '28px', maxWidth: '1380px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ background: 'rgba(74, 154, 191, 0.15)', padding: '8px', borderRadius: '10px' }}>
              <Activity size={24} style={{ color: '#4a9abf' }} />
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Query Performance &amp; EXPLAIN ANALYZE
            </h1>
            <span style={{ fontSize: '11px', background: 'rgba(74,154,191,0.15)', color: '#4a9abf', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
              PostgreSQL Cost Optimizer
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '780px', margin: 0 }}>
            Inspect PostgreSQL Cost-Based Optimizer (CBO) query execution plans. Evaluates join strategies (Nested Loop, Hash Join, Merge Join) and verifies index effectiveness with live execution profiling.
          </p>
        </div>

        {/* Query Input Card */}
        <div className="card" style={{ background: 'var(--studio-panel)', borderColor: 'var(--studio-border)', padding: '24px', marginBottom: '24px' }}>
          {/* Preset queries */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Example Queries:</span>
            {PRESET_QUERIES.map((q, idx) => (
              <button
                key={idx}
                onClick={() => setSql(q.sql)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  border: '1px solid var(--border)',
                  background: sql === q.sql ? 'rgba(74, 154, 191, 0.2)' : 'rgba(0,0,0,0.2)',
                  color: sql === q.sql ? '#4a9abf' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {q.name}
              </button>
            ))}
          </div>

          <textarea
            className="input"
            rows={4}
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', marginBottom: '16px', lineHeight: 1.5 }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Note: Queries are checked against SQL injection protection and executed read-only.
            </span>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className="btn btn-ghost"
                onClick={() => handleExplain(false)}
                disabled={running}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
              >
                <Play size={14} />
                <span>EXPLAIN (Estimated)</span>
              </button>

              <button
                className="btn btn-primary"
                onClick={() => handleExplain(true)}
                disabled={running}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700 }}
              >
                <Activity size={14} />
                <span>EXPLAIN ANALYZE (Live Run)</span>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div style={{ marginTop: '16px', background: 'rgba(201, 74, 74, 0.15)', border: '1px solid var(--error)', padding: '12px', borderRadius: '8px', color: 'var(--error)', fontSize: '13px' }}>
              {errorMsg}
            </div>
          )}
        </div>

        {/* Visual Plan Output */}
        {planResult && (
          <div className="card" style={{ background: 'var(--studio-panel)', borderColor: 'var(--studio-border)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--green-primary)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Execution Plan Tree
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: '2px 0 0' }}>
                  Optimizer Execution Graph
                </h3>
              </div>

              {planResult[0]?.['Execution Time'] !== undefined && (
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Planning Time</span>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {planResult[0]['Planning Time']} ms
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Execution Time</span>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--green-primary)', fontFamily: 'var(--font-mono)' }}>
                      {planResult[0]['Execution Time']} ms
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tree */}
            <div style={{ marginBottom: '24px' }}>
              <PlanNodeView node={rootPlanNode} />
            </div>

            {/* Raw JSON Toggle */}
            <details style={{ marginTop: '20px' }}>
              <summary style={{ fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}>
                View Raw PostgreSQL JSON Plan
              </summary>
              <pre className="sql-display" style={{ marginTop: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                {JSON.stringify(planResult, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </AppShell>
  );
}
