// app/dbms/transactions/page.jsx - Transaction Simulator & ACID Visualizer
'use client';
import { useState } from 'react';
import AppShell from '@/app/components/ui/AppShell';
import {
  GitCommit, Play, RotateCcw, CheckCircle2, XCircle,
  Shield, Clock, Database, Layers, ArrowDown, Activity, AlertTriangle
} from 'lucide-react';

const ACID_PRINCIPLES = [
  {
    key: 'atomicity',
    title: 'ATOMICITY',
    tagline: 'All or Nothing Execution',
    color: '#86bc42',
    explanation: 'A transaction is an indivisible unit of work. Either every single operation (insert watering log, update plant health, create notification) commits successfully, or all changes are rolled back completely leaving the database in its original state.',
    plantCareExample: 'Logging a watering event: (1) INSERT watering_log, (2) UPDATE plants.health_status, (3) INSERT audit_log. If the health update fails due to a constraint, the watering log is also discarded.'
  },
  {
    key: 'consistency',
    title: 'CONSISTENCY',
    tagline: 'Preserving Relational Invariants',
    color: '#4a9abf',
    explanation: 'A transaction transforms the database from one valid state satisfying all defined integrity constraints (CHECK, FOREIGN KEY, NOT NULL, UNIQUE) to another valid state. Transactions cannot violate database invariants.',
    plantCareExample: 'CHECK (health_score BETWEEN 0 AND 100) prevents recording corrupted readings. The database refuses to commit any state where health_score = 150.'
  },
  {
    key: 'isolation',
    title: 'ISOLATION',
    tagline: 'Concurrency Control & Serializable Views',
    color: '#c9933a',
    explanation: 'Intermediate transaction states are invisible to concurrently running transactions. PostgreSQL uses Multi-Version Concurrency Control (MVCC) to ensure read transactions do not block write transactions.',
    plantCareExample: 'If User A logs watering for Plant X while User B views the analytics dashboard, User B reads consistent snapshot data without encountering dirty reads or lock contention.'
  },
  {
    key: 'durability',
    title: 'DURABILITY',
    tagline: 'Persistent Writes via WAL',
    color: '#a0cde0',
    explanation: 'Once a transaction commits with COMMIT, its modifications survive crashes, power outages, and server restarts. PostgreSQL guarantees this through the Write-Ahead Log (WAL) flushed to non-volatile disk before ACK.',
    plantCareExample: 'When a user adds a rare Monstera plant and receives confirmation, the tuple is safely written to the PostgreSQL WAL on disk. Even if the backend process terminates immediately, the record is fully preserved.'
  }
];

export default function TransactionsPage() {
  const [simulationType, setSimulationType] = useState('commit'); // 'commit' | 'rollback'
  const [simStep, setSimStep] = useState(0);
  const [running, setRunning] = useState(false);

  function startSimulation(type) {
    setSimulationType(type);
    setRunning(true);
    setSimStep(1); // BEGIN

    setTimeout(() => {
      setSimStep(2); // Step 1
      setTimeout(() => {
        setSimStep(3); // Step 2
        setTimeout(() => {
          setSimStep(4); // Step 3
          setTimeout(() => {
            setSimStep(5); // COMMIT or ROLLBACK
            setRunning(false);
          }, 800);
        }, 800);
      }, 800);
    }, 600);
  }

  return (
    <AppShell>
      <div style={{ padding: '28px', maxWidth: '1380px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ background: 'rgba(134, 188, 66, 0.15)', padding: '8px', borderRadius: '10px' }}>
              <GitCommit size={24} style={{ color: 'var(--green-primary)' }} />
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Transaction Simulator &amp; ACID Principles
            </h1>
            <span style={{ fontSize: '11px', background: 'rgba(134,188,66,0.15)', color: 'var(--green-primary)', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
              PostgreSQL MVCC &amp; WAL Engine
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '780px', margin: 0 }}>
            Interactive demonstration of atomic transaction execution (BEGIN &rarr; COMMIT / ROLLBACK) in PostgreSQL, connected to the four fundamental ACID principles governing database reliability.
          </p>
        </div>

        {/* 4 ACID Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', marginBottom: '32px' }}>
          {ACID_PRINCIPLES.map(p => (
            <div key={p.key} className="card" style={{ background: 'var(--studio-panel)', borderColor: 'var(--studio-border)', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: p.color, letterSpacing: '0.08em' }}>
                    {p.title}
                  </span>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.color }} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  {p.tagline}
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
                  {p.explanation}
                </p>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-muted)', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <strong style={{ color: p.color }}>VerdeBase Application:</strong> {p.plantCareExample}
              </div>
            </div>
          ))}
        </div>

        {/* Transaction Simulator Container */}
        <div className="card" style={{ background: 'var(--studio-panel)', borderColor: 'var(--studio-border)', padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#4a9abf', textTransform: 'uppercase', fontWeight: 700 }}>
                Live Execution Timeline
              </span>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 0' }}>
                Multi-Statement Atomic Transaction Simulator
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-primary"
                onClick={() => startSimulation('commit')}
                disabled={running}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
              >
                <CheckCircle2 size={16} />
                <span>Simulate Successful COMMIT</span>
              </button>

              <button
                className="btn btn-danger"
                onClick={() => startSimulation('rollback')}
                disabled={running}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
              >
                <RotateCcw size={16} />
                <span>Simulate Failing ROLLBACK</span>
              </button>
            </div>
          </div>

          {/* Timeline visualization */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '820px', margin: '0 auto' }}>
            {/* Stage 1: BEGIN */}
            <div
              style={{
                padding: '14px 18px',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: simStep >= 1 ? '#4a9abf' : 'var(--border)',
                background: simStep >= 1 ? 'rgba(74, 154, 191, 0.15)' : 'rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#4a9abf' }}>BEGIN;</span>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Allocate transaction ID (xid) &amp; create isolation snapshot</span>
              </div>
              {simStep >= 1 && <CheckCircle2 size={16} style={{ color: '#4a9abf' }} />}
            </div>

            {/* Stage 2: Operation 1 */}
            <div
              style={{
                padding: '14px 18px',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: simStep >= 2 ? 'var(--green-primary)' : 'var(--border)',
                background: simStep >= 2 ? 'rgba(134, 188, 66, 0.12)' : 'rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--green-primary)' }}>
                  INSERT INTO watering_logs (plant_id, quantity_ml) VALUES (&apos;P01&apos;, 350);
                </span>
              </div>
              {simStep >= 2 && <CheckCircle2 size={16} style={{ color: 'var(--green-primary)' }} />}
            </div>

            {/* Stage 3: Operation 2 */}
            <div
              style={{
                padding: '14px 18px',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: simStep >= 3
                  ? (simulationType === 'commit' ? 'var(--green-primary)' : 'var(--error)')
                  : 'var(--border)',
                background: simStep >= 3
                  ? (simulationType === 'commit' ? 'rgba(134, 188, 66, 0.12)' : 'rgba(201, 74, 74, 0.15)')
                  : 'rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: simulationType === 'commit' ? 'var(--green-primary)' : 'var(--error)' }}>
                  {simulationType === 'commit'
                    ? "UPDATE plants SET health_status = 'healthy' WHERE plant_id = 'P01';"
                    : "INSERT INTO health_logs (plant_id, health_score) VALUES ('P01', 150); -- INVALID CHECK"}
                </span>
              </div>
              {simStep >= 3 && (
                simulationType === 'commit'
                  ? <CheckCircle2 size={16} style={{ color: 'var(--green-primary)' }} />
                  : <XCircle size={16} style={{ color: 'var(--error)' }} />
              )}
            </div>

            {/* Stage 4: Operation 3 */}
            <div
              style={{
                padding: '14px 18px',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: simStep >= 4
                  ? (simulationType === 'commit' ? 'var(--green-primary)' : 'rgba(201,74,74,0.3)')
                  : 'var(--border)',
                background: simStep >= 4
                  ? (simulationType === 'commit' ? 'rgba(134, 188, 66, 0.12)' : 'rgba(0,0,0,0.3)')
                  : 'rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                opacity: simulationType === 'rollback' && simStep >= 4 ? 0.5 : 1,
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  INSERT INTO notifications (user_id, title) VALUES (&apos;U01&apos;, &apos;Watering Recorded&apos;);
                </span>
                {simulationType === 'rollback' && simStep >= 4 && (
                  <span style={{ fontSize: '11px', color: 'var(--error)', fontStyle: 'italic' }}>
                    (Skipped due to prior step failure)
                  </span>
                )}
              </div>
              {simStep >= 4 && simulationType === 'commit' && (
                <CheckCircle2 size={16} style={{ color: 'var(--green-primary)' }} />
              )}
            </div>

            {/* Stage 5: Final Result (COMMIT vs ROLLBACK) */}
            <div
              style={{
                padding: '16px 20px',
                borderRadius: '10px',
                border: '2px solid',
                borderColor: simStep >= 5
                  ? (simulationType === 'commit' ? 'var(--green-primary)' : 'var(--error)')
                  : 'var(--border)',
                background: simStep >= 5
                  ? (simulationType === 'commit' ? 'rgba(134, 188, 66, 0.2)' : 'rgba(201, 74, 74, 0.2)')
                  : 'rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '16px', color: simulationType === 'commit' ? 'var(--green-primary)' : 'var(--error)' }}>
                  {simulationType === 'commit' ? 'COMMIT;' : 'ROLLBACK;'}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>
                  {simulationType === 'commit'
                    ? 'All 3 operations permanently flushed to WAL & disk. State transition durable.'
                    : 'Transaction aborted. Operation 1 (watering log) undone. Zero partial mutations.'}
                </span>
              </div>
              {simStep >= 5 && (
                simulationType === 'commit'
                  ? <CheckCircle2 size={20} style={{ color: 'var(--green-primary)' }} />
                  : <XCircle size={20} style={{ color: 'var(--error)' }} />
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
