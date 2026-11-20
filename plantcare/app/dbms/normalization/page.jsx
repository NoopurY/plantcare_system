// app/dbms/normalization/page.jsx - Normalization Visualizer (UNF -> 1NF -> 2NF -> 3NF)
'use client';
import { useState } from 'react';
import AppShell from '@/app/components/ui/AppShell';
import {
  Layers, ArrowRight, CheckCircle2, AlertTriangle, XCircle,
  HelpCircle, ChevronLeft, ChevronRight, Zap, RefreshCw, Database
} from 'lucide-react';

const STAGES = [
  {
    id: 0,
    title: 'Unnormalized Form (UNF)',
    subtitle: 'Flat Monolithic Sheet with Multi-Valued Attributes & Severe Redundancy',
    problem: 'Multiple care dates and symptoms stored as repeating strings; species data repeated for every single plant instance.',
    anomalies: [
      'Update Anomaly: Changing Monstera watering requirements requires updating 50+ rows across the dataset.',
      'Insertion Anomaly: Cannot record a newly discovered plant species until a user actually acquires an instance of it.',
      'Deletion Anomaly: Deleting Jane’s only Fiddle Leaf Fig accidentally purges the entire botanical knowledge of Ficus lyrata from the system.'
    ]
  },
  {
    id: 1,
    title: 'First Normal Form (1NF)',
    subtitle: 'Atomic Values & Primary Key Established',
    rule: 'Each attribute must contain only atomic (indivisible) values, and each record must be uniquely identifiable via a Primary Key.',
    achievement: 'Repeating care logs and comma-separated symptoms separated into distinct row tuples. Composite key: (user_id, plant_id, care_date).',
    remainingProblem: 'Partial Functional Dependencies exist: Botanical attributes (species_name, water_req) depend only on species part of the key, not the full composite key.'
  },
  {
    id: 2,
    title: 'Second Normal Form (2NF)',
    subtitle: 'Removal of Partial Dependencies',
    rule: 'Must be in 1NF AND all non-key attributes must depend on the ENTIRE candidate key (no partial dependencies on a subset of the key).',
    achievement: 'Decomposed into Plants table and Care Logs table. Botanical specs and user profiles separated into their own entities.',
    remainingProblem: 'Transitive Dependencies exist: Care profile (watering_interval_days) depends on species_id, which depends on plant_id (plant_id -> species_id -> watering_interval).'
  },
  {
    id: 3,
    title: 'Third Normal Form (3NF)',
    subtitle: 'Removal of Transitive Dependencies (Final VerdeBase Production Schema)',
    rule: 'Must be in 2NF AND no non-key attribute is transitively dependent on the primary key (X -> Y where Y is non-key implies X is a superkey).',
    achievement: 'Care guidelines isolated into `care_profiles` referenced strictly via `species_id`. Clean 3NF design implemented in PostgreSQL.',
    remainingProblem: 'None! Database is optimal for transactional workloads (OLTP), guaranteed free of update/delete anomalies.'
  }
];

export default function NormalizationPage() {
  const [activeStage, setActiveStage] = useState(0);

  const stage = STAGES[activeStage];

  return (
    <AppShell>
      <div style={{ padding: '28px', maxWidth: '1380px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{ background: 'rgba(74, 154, 191, 0.15)', padding: '8px', borderRadius: '10px' }}>
                <Layers size={24} style={{ color: '#4a9abf' }} />
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Normalization Visualizer &amp; Theory
              </h1>
              <span style={{ fontSize: '11px', background: 'rgba(134,188,66,0.15)', color: 'var(--green-primary)', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
                Exam &amp; Viva Companion
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '780px', margin: 0 }}>
              Step-by-step mathematical decomposition of unnormalized plant records into 1NF, 2NF, and 3NF relational schemas, proving why VerdeBase separates plants, species, and care logs.
            </p>
          </div>

          {/* Stepper Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-ghost"
              disabled={activeStage === 0}
              onClick={() => setActiveStage(s => Math.max(0, s - 1))}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ChevronLeft size={16} /> Prev Stage
            </button>
            <button
              className="btn btn-primary"
              disabled={activeStage === 3}
              onClick={() => setActiveStage(s => Math.min(3, s + 1))}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              Next Stage <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Stage Progress Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
          {STAGES.map((st, idx) => {
            const isCurrent = activeStage === idx;
            const isCompleted = activeStage > idx;
            return (
              <button
                key={st.id}
                onClick={() => setActiveStage(idx)}
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid',
                  borderColor: isCurrent ? '#4a9abf' : isCompleted ? 'rgba(134,188,66,0.4)' : 'var(--border)',
                  background: isCurrent ? 'rgba(74,154,191,0.15)' : isCompleted ? 'rgba(134,188,66,0.06)' : 'var(--studio-panel)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: isCurrent ? '#4a9abf' : isCompleted ? 'var(--green-primary)' : 'var(--text-muted)' }}>
                    PHASE {idx}
                  </span>
                  {isCompleted && <CheckCircle2 size={14} style={{ color: 'var(--green-primary)' }} />}
                  {isCurrent && <Zap size={14} style={{ color: '#4a9abf' }} />}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {st.title.split(' ')[0]}
                </div>
              </button>
            );
          })}
        </div>

        {/* Stage Theory Card */}
        <div className="card" style={{ background: 'var(--studio-panel)', borderColor: 'var(--studio-border)', padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#4a9abf' }}>
              {stage.title}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              &bull; {stage.subtitle}
            </span>
          </div>

          {stage.rule && (
            <div style={{ background: 'rgba(74,154,191,0.1)', borderLeft: '4px solid #4a9abf', padding: '10px 14px', fontSize: '13px', color: '#a0cde0', marginBottom: '14px' }}>
              <strong>Theoretical Rule:</strong> {stage.rule}
            </div>
          )}

          {stage.achievement && (
            <div style={{ fontSize: '13px', color: 'var(--green-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <CheckCircle2 size={16} /> <strong>Transformation Achieved:</strong> {stage.achievement}
            </div>
          )}

          {stage.anomalies && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
              <span style={{ fontSize: '12px', color: 'var(--error)', fontWeight: 700, textTransform: 'uppercase' }}>
                Relational Anomalies in this Form:
              </span>
              {stage.anomalies.map((a, i) => (
                <div key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <XCircle size={15} style={{ color: 'var(--error)', flexShrink: 0, marginTop: '2px' }} />
                  <span>{a}</span>
                </div>
              ))}
            </div>
          )}

          {stage.remainingProblem && (
            <div style={{ marginTop: '12px', background: 'rgba(201,147,58,0.12)', border: '1px solid rgba(201,147,58,0.3)', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span><strong>Violation Remaining:</strong> {stage.remainingProblem}</span>
            </div>
          )}
        </div>

        {/* Visual Table Representations */}
        {activeStage === 0 && (
          <div className="card" style={{ background: 'var(--studio-panel)', borderColor: 'var(--studio-border)', padding: '20px' }}>
            <h4 style={{ fontSize: '14px', color: 'var(--error)', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <XCircle size={16} /> Unnormalized Form (UNF) - Single Massive Monolith
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'rgba(201,74,74,0.1)' }}>
                    <th>Plant ID</th>
                    <th>User Email</th>
                    <th>Plant Name</th>
                    <th>Species Name</th>
                    <th>Water Requirement</th>
                    <th>Watering Interval</th>
                    <th>Recent Watering Dates (Repeating)</th>
                    <th>Symptoms Observed (Multi-valued)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>P001</td>
                    <td>jane@example.com</td>
                    <td>Monty</td>
                    <td style={{ color: 'var(--amber)' }}>Monstera deliciosa</td>
                    <td style={{ color: 'var(--amber)' }}>moderate</td>
                    <td style={{ color: 'var(--amber)' }}>7 days</td>
                    <td style={{ color: 'var(--error)' }}>2026-09-01, 2026-09-08, 2026-09-15</td>
                    <td style={{ color: 'var(--error)' }}>yellowing tips, minor brown spot</td>
                  </tr>
                  <tr>
                    <td>P002</td>
                    <td>jane@example.com</td>
                    <td>Little Monty</td>
                    <td style={{ color: 'var(--amber)' }}>Monstera deliciosa (DUPLICATE)</td>
                    <td style={{ color: 'var(--amber)' }}>moderate (DUPLICATE)</td>
                    <td style={{ color: 'var(--amber)' }}>7 days (DUPLICATE)</td>
                    <td style={{ color: 'var(--error)' }}>2026-09-05, 2026-09-12</td>
                    <td style={{ color: 'var(--error)' }}>none</td>
                  </tr>
                  <tr>
                    <td>P003</td>
                    <td>bob@example.com</td>
                    <td>Figgy</td>
                    <td style={{ color: 'var(--amber)' }}>Ficus lyrata</td>
                    <td style={{ color: 'var(--amber)' }}>high</td>
                    <td style={{ color: 'var(--amber)' }}>5 days</td>
                    <td style={{ color: 'var(--error)' }}>2026-09-04, 2026-09-09, 2026-09-14</td>
                    <td style={{ color: 'var(--error)' }}>dusty foliage</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeStage === 1 && (
          <div className="card" style={{ background: 'var(--studio-panel)', borderColor: 'var(--studio-border)', padding: '20px' }}>
            <h4 style={{ fontSize: '14px', color: '#4a9abf', textTransform: 'uppercase', marginBottom: '12px' }}>
              1NF: Atomic Attributes with Composite Primary Key (plant_id, watered_date)
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table" style={{ fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th style={{ color: '#f2ea7e' }}>[PK] Plant ID</th>
                    <th style={{ color: '#f2ea7e' }}>[PK] Watered Date</th>
                    <th>User Email</th>
                    <th>Plant Name</th>
                    <th>Species Name</th>
                    <th>Water Interval</th>
                    <th>Quantity (ml)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ color: '#f2ea7e', fontWeight: 700 }}>P001</td>
                    <td style={{ color: '#f2ea7e', fontWeight: 700 }}>2026-09-01</td>
                    <td>jane@example.com</td>
                    <td>Monty</td>
                    <td style={{ color: 'var(--amber)' }}>Monstera deliciosa</td>
                    <td style={{ color: 'var(--amber)' }}>7 days</td>
                    <td>300</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#f2ea7e', fontWeight: 700 }}>P001</td>
                    <td style={{ color: '#f2ea7e', fontWeight: 700 }}>2026-09-08</td>
                    <td>jane@example.com</td>
                    <td>Monty</td>
                    <td style={{ color: 'var(--amber)' }}>Monstera deliciosa</td>
                    <td style={{ color: 'var(--amber)' }}>7 days</td>
                    <td>350</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#f2ea7e', fontWeight: 700 }}>P002</td>
                    <td style={{ color: '#f2ea7e', fontWeight: 700 }}>2026-09-05</td>
                    <td>jane@example.com</td>
                    <td>Little Monty</td>
                    <td style={{ color: 'var(--amber)' }}>Monstera deliciosa</td>
                    <td style={{ color: 'var(--amber)' }}>7 days</td>
                    <td>250</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Note: Values are now atomic (single date per row). However, <code>Species Name</code> and <code>Water Interval</code> still depend only on <code>plant_id</code>, not the full composite key <code>(plant_id, watered_date)</code>.
            </div>
          </div>
        )}

        {activeStage === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="card" style={{ background: 'var(--studio-panel)', borderColor: 'var(--studio-border)', padding: '20px' }}>
              <h4 style={{ fontSize: '13px', color: 'var(--green-primary)', textTransform: 'uppercase', marginBottom: '10px' }}>
                Decomposed Relation 1: PLANTS
              </h4>
              <table className="data-table" style={{ fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th style={{ color: '#f2ea7e' }}>[PK] plant_id</th>
                    <th>user_id</th>
                    <th>plant_name</th>
                    <th>species_id</th>
                    <th>watering_interval</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ color: '#f2ea7e', fontWeight: 700 }}>P001</td>
                    <td>U01</td>
                    <td>Monty</td>
                    <td>S01</td>
                    <td style={{ color: 'var(--amber)' }}>7 days</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#f2ea7e', fontWeight: 700 }}>P002</td>
                    <td>U01</td>
                    <td>Little Monty</td>
                    <td>S01</td>
                    <td style={{ color: 'var(--amber)' }}>7 days</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="card" style={{ background: 'var(--studio-panel)', borderColor: 'var(--studio-border)', padding: '20px' }}>
              <h4 style={{ fontSize: '13px', color: 'var(--green-primary)', textTransform: 'uppercase', marginBottom: '10px' }}>
                Decomposed Relation 2: WATERING_LOGS
              </h4>
              <table className="data-table" style={{ fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th style={{ color: '#f2ea7e' }}>[PK] log_id</th>
                    <th style={{ color: '#c9933a' }}>[FK] plant_id</th>
                    <th>watered_at</th>
                    <th>quantity_ml</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ color: '#f2ea7e', fontWeight: 700 }}>L001</td>
                    <td style={{ color: '#c9933a' }}>P001</td>
                    <td>2026-09-01</td>
                    <td>300</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#f2ea7e', fontWeight: 700 }}>L002</td>
                    <td style={{ color: '#c9933a' }}>P001</td>
                    <td>2026-09-08</td>
                    <td>350</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeStage === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
            <div className="card" style={{ background: 'var(--studio-panel)', borderColor: 'var(--studio-border)', padding: '18px' }}>
              <h4 style={{ fontSize: '13px', color: 'var(--green-primary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                3NF: PLANTS Entity
              </h4>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Specific plant instances owned by users.
              </p>
              <table className="data-table" style={{ fontSize: '11px' }}>
                <thead><tr><th>PK/FK</th><th>Column</th></tr></thead>
                <tbody>
                  <tr><td style={{ color: '#f2ea7e' }}>PK</td><td>plant_id</td></tr>
                  <tr><td style={{ color: '#c9933a' }}>FK</td><td>user_id</td></tr>
                  <tr><td style={{ color: '#c9933a' }}>FK</td><td>species_id</td></tr>
                  <tr><td>-</td><td>plant_name</td></tr>
                  <tr><td>-</td><td>health_status</td></tr>
                </tbody>
              </table>
            </div>

            <div className="card" style={{ background: 'var(--studio-panel)', borderColor: 'var(--studio-border)', padding: '18px' }}>
              <h4 style={{ fontSize: '13px', color: 'var(--green-primary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                3NF: SPECIES Entity
              </h4>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Pure botanical taxonomy. Zero instance redundancy.
              </p>
              <table className="data-table" style={{ fontSize: '11px' }}>
                <thead><tr><th>PK/FK</th><th>Column</th></tr></thead>
                <tbody>
                  <tr><td style={{ color: '#f2ea7e' }}>PK</td><td>species_id</td></tr>
                  <tr><td>-</td><td>common_name</td></tr>
                  <tr><td>-</td><td>scientific_name</td></tr>
                  <tr><td>-</td><td>care_difficulty</td></tr>
                </tbody>
              </table>
            </div>

            <div className="card" style={{ background: 'var(--studio-panel)', borderColor: 'var(--studio-border)', padding: '18px' }}>
              <h4 style={{ fontSize: '13px', color: 'var(--green-primary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                3NF: CARE_PROFILES Entity
              </h4>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                Default care rules (transitive dependency eliminated).
              </p>
              <table className="data-table" style={{ fontSize: '11px' }}>
                <thead><tr><th>PK/FK</th><th>Column</th></tr></thead>
                <tbody>
                  <tr><td style={{ color: '#f2ea7e' }}>PK</td><td>profile_id</td></tr>
                  <tr><td style={{ color: '#c9933a' }}>FK</td><td>species_id (UNIQUE)</td></tr>
                  <tr><td>-</td><td>watering_interval_days</td></tr>
                  <tr><td>-</td><td>fertilizer_type</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
