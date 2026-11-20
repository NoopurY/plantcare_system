// app/dbms/relational-model/page.jsx - Relational Model & Schema Explorer
'use client';
import { useState, useEffect } from 'react';
import AppShell from '@/app/components/ui/AppShell';
import {
  Layers, Key, Link2, ShieldCheck, Database, Table2,
  ChevronRight, ArrowRight, Info, Check, Search
} from 'lucide-react';

export default function RelationalModelPage() {
  const [schemaData, setSchemaData] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState('plants');
  const [filterText, setFilterText] = useState('');

  useEffect(() => {
    async function loadSchema() {
      try {
        const res = await fetch('/api/db/schema');
        if (res.ok) {
          const data = await res.json();
          setSchemaData(data.tables || {});
          const tableNames = Object.keys(data.tables || {});
          if (tableNames.length > 0 && !tableNames.includes('plants')) {
            setSelectedTable(tableNames[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load relational schema:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSchema();
  }, []);

  const tableNames = Object.keys(schemaData).filter(t =>
    t.toLowerCase().includes(filterText.toLowerCase())
  );

  const activeTableInfo = schemaData[selectedTable] || { columns: [], constraints: [] };

  return (
    <AppShell>
      <div style={{ padding: '28px', maxWidth: '1380px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ background: 'rgba(74, 154, 191, 0.15)', padding: '8px', borderRadius: '10px' }}>
              <Layers size={24} style={{ color: '#4a9abf' }} />
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Relational Schema Model
            </h1>
            <span style={{ fontSize: '11px', background: 'rgba(74, 154, 191, 0.15)', color: '#4a9abf', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
              PostgreSQL Catalog Inspector
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '780px', margin: 0 }}>
            Formal relational notation of entities, attributes, primary key signatures, and foreign referential constraints discovered live from <code>information_schema</code>.
          </p>
        </div>

        {/* Legend */}
        <div className="card" style={{ padding: '12px 20px', marginBottom: '24px', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center', background: 'var(--studio-panel)', borderColor: 'var(--studio-border)' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Notation Key:</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#f2ea7e' }}>
            <Key size={14} /> Primary Key (PK)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#c9933a' }}>
            <Link2 size={14} /> Foreign Key (FK)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#86bc42' }}>
            <ShieldCheck size={14} /> UNIQUE Constraint
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
            * NOT NULL
          </span>
        </div>

        {/* Layout: Master Table List + Detail View */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
          {/* Left: Table Navigator */}
          <div className="card" style={{ padding: '16px', background: 'var(--studio-panel)', borderColor: 'var(--studio-border)', height: 'fit-content' }}>
            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input"
                placeholder="Filter relations..."
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
                style={{ paddingLeft: '34px', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '580px', overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: '20px', color: 'var(--text-muted)', textAlign: 'center', fontSize: '13px' }}>
                  Scanning catalogs...
                </div>
              ) : tableNames.map(tbl => {
                const isSelected = selectedTable === tbl;
                const colCount = schemaData[tbl]?.columns?.length || 0;
                return (
                  <button
                    key={tbl}
                    onClick={() => setSelectedTable(tbl)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: isSelected ? '#4a9abf' : 'transparent',
                      background: isSelected ? 'rgba(74, 154, 191, 0.15)' : 'transparent',
                      color: isSelected ? '#4a9abf' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '13px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Table2 size={15} style={{ opacity: isSelected ? 1 : 0.6 }} />
                      <strong>{tbl}</strong>
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
                      {colCount} cols
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Relation Schema Detail */}
          <div className="card" style={{ background: 'var(--studio-panel)', borderColor: 'var(--studio-border)', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#4a9abf', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
                  Relation Schema
                </span>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 0', fontFamily: 'var(--font-mono)' }}>
                  {selectedTable.toUpperCase()}
                </h2>
              </div>

              {/* Mathematical notation banner */}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-muted)', fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                R({selectedTable}) = ({activeTableInfo.columns?.map(c => c.column_name).join(', ')})
              </div>
            </div>

            {/* Columns Table */}
            <h3 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Attributes &amp; Constraints
            </h3>

            <div style={{ overflowX: 'auto', marginBottom: '28px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>Key</th>
                    <th>Column Name</th>
                    <th>PostgreSQL Type</th>
                    <th>Nullable</th>
                    <th>Default</th>
                    <th>Constraint References</th>
                  </tr>
                </thead>
                <tbody>
                  {activeTableInfo.columns?.map((col) => {
                    const isPK = activeTableInfo.constraints?.some(
                      c => c.column_name === col.column_name && c.constraint_type === 'PRIMARY KEY'
                    );
                    const fkObj = activeTableInfo.constraints?.find(
                      c => c.column_name === col.column_name && c.constraint_type === 'FOREIGN KEY'
                    );
                    const isUnique = activeTableInfo.constraints?.some(
                      c => c.column_name === col.column_name && c.constraint_type === 'UNIQUE'
                    );

                    return (
                      <tr key={col.column_name}>
                        <td>
                          {isPK && <Key size={15} style={{ color: '#f2ea7e' }} title="PRIMARY KEY" />}
                          {fkObj && <Link2 size={15} style={{ color: '#c9933a' }} title="FOREIGN KEY" />}
                          {isUnique && !isPK && <ShieldCheck size={15} style={{ color: '#86bc42' }} title="UNIQUE" />}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: isPK ? '#f2ea7e' : 'var(--text-primary)' }}>
                          {col.column_name}
                          {col.is_nullable === 'NO' && <span style={{ color: 'var(--error)', marginLeft: '4px' }}>*</span>}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--sage)', fontSize: '12px' }}>
                          {col.data_type.toUpperCase()}
                          {col.character_maximum_length ? `(${col.character_maximum_length})` : ''}
                        </td>
                        <td>
                          <span style={{ fontSize: '11px', color: col.is_nullable === 'YES' ? 'var(--text-muted)' : 'var(--text-secondary)' }}>
                            {col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {col.column_default || '—'}
                        </td>
                        <td>
                          {isPK && (
                            <span style={{ fontSize: '11px', background: 'rgba(242,234,126,0.15)', color: '#f2ea7e', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                              PK (Unique Identifier)
                            </span>
                          )}
                          {fkObj && (
                            <span style={{ fontSize: '11px', background: 'rgba(201,147,58,0.15)', color: '#c9933a', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                              FK &rarr; {fkObj.constraint_name}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Relational Invariants Card */}
            <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--studio-border)', borderRadius: '12px', padding: '18px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#4a9abf', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={16} /> Relational Theory Note
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                In relational algebra, table <code>{selectedTable}</code> represents a relation instance conforming to relation schema <em>R</em>. Each row corresponds to an n-tuple of domain values. Constraints guarantee Entity Integrity (non-null unique Primary Key) and Referential Integrity (foreign keys evaluate to valid tuples in referenced relations).
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
