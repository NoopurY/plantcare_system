// app/dbms/audit/page.jsx - Database Activity & Audit Trail Explorer
'use client';
import { useState, useEffect } from 'react';
import AppShell from '@/app/components/ui/AppShell';
import {
  FileText, Shield, Clock, RefreshCw, Filter,
  ArrowRight, Search, CheckCircle2, User, Database
} from 'lucide-react';

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  async function fetchAuditLogs() {
    setLoading(true);
    try {
      const res = await fetch('/api/db/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql: 'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50;'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.rows || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  }

  const entities = ['ALL', ...new Set(logs.map(l => l.entity).filter(Boolean))];

  const filteredLogs = logs.filter(l => {
    const matchesAction = actionFilter === 'ALL' || l.action === actionFilter;
    const matchesEntity = entityFilter === 'ALL' || l.entity === entityFilter;
    return matchesAction && matchesEntity;
  });

  const getActionBadge = (action) => {
    switch (action) {
      case 'INSERT':
        return <span style={{ background: 'rgba(134,188,66,0.15)', color: 'var(--green-primary)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>INSERT</span>;
      case 'UPDATE':
        return <span style={{ background: 'rgba(201,147,58,0.15)', color: 'var(--amber)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>UPDATE</span>;
      case 'DELETE':
        return <span style={{ background: 'rgba(201,74,74,0.15)', color: 'var(--error)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>DELETE</span>;
      case 'LOGIN':
        return <span style={{ background: 'rgba(74,154,191,0.15)', color: '#4a9abf', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>LOGIN</span>;
      default:
        return <span style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>{action}</span>;
    }
  };

  return (
    <AppShell>
      <div style={{ padding: '28px', maxWidth: '1380px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{ background: 'rgba(74, 154, 191, 0.15)', padding: '8px', borderRadius: '10px' }}>
                <Shield size={24} style={{ color: '#4a9abf' }} />
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Database Audit Log &amp; Security Trail
              </h1>
              <span style={{ fontSize: '11px', background: 'rgba(74,154,191,0.15)', color: '#4a9abf', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
                Enterprise Provenance Engine
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '780px', margin: 0 }}>
              Immutable audit record stored in <code>audit_logs</code> table populated automatically by database triggers. Tracks mutations, entity IDs, timestamps, and JSON snapshots.
            </p>
          </div>

          <button
            className="btn btn-primary"
            onClick={fetchAuditLogs}
            disabled={loading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Audit Trail</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="card" style={{ background: 'var(--studio-panel)', borderColor: 'var(--studio-border)', padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Action:</span>
            {['ALL', 'INSERT', 'UPDATE', 'DELETE', 'LOGIN'].map(act => (
              <button
                key={act}
                onClick={() => setActionFilter(act)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  border: '1px solid',
                  borderColor: actionFilter === act ? '#4a9abf' : 'var(--border)',
                  background: actionFilter === act ? 'rgba(74, 154, 191, 0.2)' : 'transparent',
                  color: actionFilter === act ? '#4a9abf' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                {act}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Entity:</span>
            <select
              className="input"
              value={entityFilter}
              onChange={e => setEntityFilter(e.target.value)}
              style={{ width: '160px', padding: '6px 10px', fontSize: '12px', background: 'rgba(0,0,0,0.3)', color: 'var(--text-primary)' }}
            >
              {entities.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        <div style={{ display: 'grid', gridTemplateColumns: selectedLog ? '1fr 420px' : '1fr', gap: '24px' }}>
          <div className="card" style={{ background: 'var(--studio-panel)', borderColor: 'var(--studio-border)', padding: '20px' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Querying audit_logs table in PostgreSQL...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No audit entries match the current filters.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Entity (Table)</th>
                      <th>Entity ID</th>
                      <th>Timestamp</th>
                      <th>Snapshot Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => {
                      const isSelected = selectedLog?.audit_id === log.audit_id;
                      return (
                        <tr
                          key={log.audit_id}
                          onClick={() => setSelectedLog(log)}
                          style={{
                            cursor: 'pointer',
                            background: isSelected ? 'rgba(74,154,191,0.12)' : 'transparent'
                          }}
                        >
                          <td>{getActionBadge(log.action)}</td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#4a9abf' }}>
                            {log.entity}
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                            {log.entity_id ? `${String(log.entity_id).slice(0, 12)}...` : '—'}
                          </td>
                          <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td>
                            <button
                              className="btn btn-ghost"
                              style={{ padding: '3px 10px', fontSize: '11px' }}
                            >
                              Inspect JSON
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* JSON Inspector Sidebar */}
          {selectedLog && (
            <div className="card" style={{ background: 'var(--studio-panel)', borderColor: 'var(--studio-border)', padding: '20px', height: 'fit-content' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Audit Record Inspector
                </h4>
                <button
                  className="btn btn-ghost"
                  onClick={() => setSelectedLog(null)}
                  style={{ padding: '2px 8px', fontSize: '12px' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', marginBottom: '16px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Audit ID: </span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{selectedLog.audit_id}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Table Affected: </span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#4a9abf' }}>{selectedLog.entity}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Recorded At: </span>
                  <span style={{ color: 'var(--text-secondary)' }}>{new Date(selectedLog.created_at).toLocaleString()}</span>
                </div>
              </div>

              {selectedLog.new_data && (
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    JSONB New Data Payload:
                  </span>
                  <pre className="sql-display" style={{ fontSize: '11px', maxHeight: '220px', overflowY: 'auto' }}>
                    {typeof selectedLog.new_data === 'object'
                      ? JSON.stringify(selectedLog.new_data, null, 2)
                      : String(selectedLog.new_data)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
