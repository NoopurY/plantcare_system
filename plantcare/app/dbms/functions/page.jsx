// app/dbms/functions/page.jsx - Stored Functions & Procedural Logic Explorer
'use client';
import { useState, useEffect } from 'react';
import AppShell from '@/app/components/ui/AppShell';
import {
  Code2, Play, Terminal, ArrowRight, CheckCircle2,
  RefreshCw, Cpu, Layers, Database, Sparkles
} from 'lucide-react';

const FUNCTION_DESCRIPTIONS = {
  calculate_plant_health_score: {
    desc: 'Computes a dynamic composite health score (0-100) based on days elapsed since watering relative to species profile, active disease records, and manual check-ins.',
    sampleCall: "SELECT plant_name, health_status, calculate_plant_health_score(plant_id) AS computed_health FROM plants LIMIT 5;"
  },
  calculate_next_watering_date: {
    desc: 'Calculates the next predicted watering requirement timestamp by adding species-recommended interval days to the most recent watering log timestamp.',
    sampleCall: "SELECT plant_name, calculate_next_watering_date(plant_id) AS next_water_due FROM plants LIMIT 5;"
  },
  get_plant_statistics: {
    desc: 'Returns a comprehensive statistical tuple for a single plant (lifetime waterings, fertilizations, growth delta, disease count, predicted care).',
    sampleCall: "SELECT * FROM get_plant_statistics((SELECT plant_id FROM plants LIMIT 1));"
  },
  get_user_care_summary: {
    desc: 'Table-returning analytics function summarizing collection-wide care metrics over a parameterized day window (default 30 days).',
    sampleCall: "SELECT * FROM get_user_care_summary((SELECT user_id FROM users LIMIT 1), 30);"
  },
  get_database_statistics: {
    desc: 'System catalog analysis function returning live row counts, pretty-printed disk space usage, and active B-tree index counts per table.',
    sampleCall: "SELECT * FROM get_database_statistics();"
  }
};

export default function FunctionsPage() {
  const [functions, setFunctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFunc, setSelectedFunc] = useState('calculate_plant_health_score');
  const [testResult, setTestResult] = useState(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    async function loadFunctions() {
      try {
        const res = await fetch('/api/db/functions');
        if (res.ok) {
          const data = await res.json();
          setFunctions(data.functions || data || []);
        }
      } catch (err) {
        console.error('Failed to load functions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFunctions();
  }, []);

  const currentMeta = FUNCTION_DESCRIPTIONS[selectedFunc] || {
    desc: 'PostgreSQL PL/pgSQL function executing business logic directly on the database engine.',
    sampleCall: `SELECT ${selectedFunc}();`
  };

  const currentFuncObj = functions.find(f => f.function_name === selectedFunc) || {};

  async function handleExecuteSample() {
    setRunning(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/db/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: currentMeta.sampleCall })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({ error: err.message });
    } finally {
      setRunning(false);
    }
  }

  return (
    <AppShell>
      <div style={{ padding: '28px', maxWidth: '1380px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ background: 'rgba(74, 154, 191, 0.15)', padding: '8px', borderRadius: '10px' }}>
              <Cpu size={24} style={{ color: '#4a9abf' }} />
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Stored Functions &amp; Procedures
            </h1>
            <span style={{ fontSize: '11px', background: 'rgba(74,154,191,0.15)', color: '#4a9abf', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
              PL/pgSQL Engine Logic
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '780px', margin: 0 }}>
            VerdeBase implements core domain logic directly inside PostgreSQL stored procedures (<code>database/functions.sql</code>). This reduces network roundtrips, enforces algorithmic consistency, and offloads heavy mathematical operations to the DB engine.
          </p>
        </div>

        {/* Master-Detail Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px' }}>
          {/* Left Function Navigator */}
          <div className="card" style={{ background: 'var(--studio-panel)', borderColor: 'var(--studio-border)', padding: '16px' }}>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Core Stored Functions ({Object.keys(FUNCTION_DESCRIPTIONS).length})
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.keys(FUNCTION_DESCRIPTIONS).map((fName) => {
                const isSelected = selectedFunc === fName;
                return (
                  <button
                    key={fName}
                    onClick={() => { setSelectedFunc(fName); setTestResult(null); }}
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
                      flexDirection: 'column',
                      gap: '4px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontWeight: 700, color: isSelected ? 'var(--text-primary)' : 'inherit' }}>
                      {fName}()
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
                      PL/pgSQL Routine
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Function Inspector & Tester */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ background: 'var(--studio-panel)', borderColor: 'var(--studio-border)', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#4a9abf', textTransform: 'uppercase', fontWeight: 700 }}>
                    Stored Procedure Signature
                  </span>
                  <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0', fontFamily: 'var(--font-mono)' }}>
                    {selectedFunc}()
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0' }}>
                    {currentMeta.desc}
                  </p>
                </div>

                <button
                  className="btn btn-primary"
                  onClick={handleExecuteSample}
                  disabled={running}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                >
                  {running ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
                  <span>Test Function Live</span>
                </button>
              </div>

              {/* Sample Invocation Block */}
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Execution Invocation:
                </span>
                <pre className="sql-display" style={{ margin: 0 }}>
                  {currentMeta.sampleCall}
                </pre>
              </div>

              {/* PL/pgSQL Definition */}
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  PostgreSQL Function Definition:
                </span>
                <pre className="sql-display" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                  {currentFuncObj.definition || `-- Function definition retrieved from pg_proc\nCREATE OR REPLACE FUNCTION ${selectedFunc} ...`}
                </pre>
              </div>

              {/* Interactive Execution Output */}
              {testResult && (
                <div style={{ marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                      PostgreSQL Engine Response
                    </span>
                    {testResult.executionTime && (
                      <span style={{ fontSize: '11px', color: 'var(--green-primary)' }}>
                        Execution Time: {testResult.executionTime}
                      </span>
                    )}
                  </div>

                  {testResult.error ? (
                    <div style={{ background: 'rgba(201, 74, 74, 0.15)', border: '1px solid var(--error)', padding: '14px', borderRadius: '8px', color: 'var(--error)', fontSize: '13px' }}>
                      {testResult.error}
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '8px', maxHeight: '260px' }}>
                      <table className="data-table" style={{ fontSize: '12px' }}>
                        <thead>
                          <tr>
                            {testResult.fields?.map(f => (
                              <th key={f} style={{ fontFamily: 'var(--font-mono)' }}>{f}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {testResult.rows?.map((r, idx) => (
                            <tr key={idx}>
                              {Object.values(r).map((val, cIdx) => (
                                <td key={cIdx} style={{ fontFamily: typeof val === 'number' ? 'var(--font-mono)' : 'inherit' }}>
                                  {val === null ? 'NULL' : String(val)}
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
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
