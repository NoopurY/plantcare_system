// app/dbms/constraints/page.jsx - Constraint Playground & Integrity Demonstrator
'use client';
import { useState, useEffect } from 'react';
import AppShell from '@/app/components/ui/AppShell';
import {
  ShieldAlert, ShieldCheck, Play, CheckCircle2, XCircle,
  AlertTriangle, Key, Link2, Terminal, RefreshCw, FileText
} from 'lucide-react';

const TEST_CASES = [
  {
    id: 'check_score',
    name: 'CHECK Constraint Violation',
    table: 'health_logs',
    constraint: 'health_logs_health_score_check',
    sql: "INSERT INTO health_logs (plant_id, health_status, health_score)\nVALUES ('11111111-1111-1111-1111-111111111111', 'healthy', 150);",
    errorDetail: {
      type: 'CHECK_VIOLATION (23514)',
      constraint: 'health_score BETWEEN 0 AND 100',
      attempted: '150',
      message: 'new row for relation "health_logs" violates check constraint "health_logs_health_score_check"',
      action: 'Transaction rolled back automatically by PostgreSQL engine.'
    }
  },
  {
    id: 'unique_email',
    name: 'UNIQUE Constraint Violation',
    table: 'users',
    constraint: 'users_email_key',
    sql: "INSERT INTO users (email, password_hash, full_name)\nVALUES ('jane@verdebase.com', '$2b$10$...', 'Jane Duplicate');",
    errorDetail: {
      type: 'UNIQUE_VIOLATION (23505)',
      constraint: 'UNIQUE (email)',
      attempted: 'jane@verdebase.com (already exists)',
      message: 'duplicate key value violates unique constraint "users_email_key"',
      action: 'Transaction rolled back to preserve candidate key uniqueness.'
    }
  },
  {
    id: 'fk_violation',
    name: 'FOREIGN KEY Violation',
    table: 'watering_logs',
    constraint: 'watering_logs_plant_id_fkey',
    sql: "INSERT INTO watering_logs (plant_id, quantity_ml, method)\nVALUES ('99999999-9999-9999-9999-999999999999', 300, 'spray');",
    errorDetail: {
      type: 'FOREIGN_KEY_VIOLATION (23503)',
      constraint: 'REFERENCES plants(plant_id) ON DELETE CASCADE',
      attempted: 'plant_id = 99999999-9999-9999-9999-999999999999 (not found)',
      message: 'insert or update on table "watering_logs" violates foreign key constraint "watering_logs_plant_id_fkey"',
      action: 'Referential integrity maintained; orphan records prohibited.'
    }
  },
  {
    id: 'not_null',
    name: 'NOT NULL Constraint Violation',
    table: 'plants',
    constraint: 'Column "plant_name" cannot be NULL',
    sql: "INSERT INTO plants (user_id, plant_name, health_status)\nVALUES ('22222222-2222-2222-2222-222222222222', NULL, 'healthy');",
    errorDetail: {
      type: 'NOT_NULL_VIOLATION (23502)',
      constraint: 'plant_name VARCHAR(200) NOT NULL',
      attempted: 'NULL',
      message: 'null value in column "plant_name" of relation "plants" violates not-null constraint',
      action: 'Domain integrity strictly enforced.'
    }
  },
  {
    id: 'check_temp',
    name: 'Compound CHECK Violation',
    table: 'species',
    constraint: 'species_temp_range',
    sql: "INSERT INTO species (common_name, scientific_name, min_temp_celsius, max_temp_celsius)\nVALUES ('Frost Lily', 'Lilium glacialis', 35, 10);",
    errorDetail: {
      type: 'CHECK_VIOLATION (23514)',
      constraint: 'min_temp_celsius <= max_temp_celsius',
      attempted: 'min = 35°C, max = 10°C',
      message: 'new row violates check constraint "species_temp_range"',
      action: 'Logical relational predicate preserved.'
    }
  }
];

export default function ConstraintsPage() {
  const [activeTest, setActiveTest] = useState(TEST_CASES[0]);
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);

  function handleSimulate() {
    setExecuting(true);
    setExecutionResult(null);
    setTimeout(() => {
      setExecutionResult(activeTest.errorDetail);
      setExecuting(false);
    }, 400);
  }

  return (
    <AppShell>
      <div style={{ padding: '28px', maxWidth: '1380px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ background: 'rgba(201, 74, 74, 0.15)', padding: '8px', borderRadius: '10px' }}>
              <ShieldAlert size={24} style={{ color: 'var(--error)' }} />
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Constraint Playground &amp; Data Integrity
            </h1>
            <span style={{ fontSize: '11px', background: 'rgba(201,74,74,0.15)', color: 'var(--error)', padding: '3px 8px', borderRadius: '6px', fontWeight: 600 }}>
              PostgreSQL Engine Enforcer
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '780px', margin: 0 }}>
            Demonstrates how relational constraints (CHECK, UNIQUE, NOT NULL, FOREIGN KEY) protect data integrity at the database engine level, rejecting invalid transactions before writes occur.
          </p>
        </div>

        {/* 6 Core Constraint Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '28px' }}>
          {[
            { name: 'PRIMARY KEY', role: 'Entity Integrity', color: '#f2ea7e', desc: 'Guarantees each row is uniquely addressable (e.g., plant_id SERIAL)' },
            { name: 'FOREIGN KEY', role: 'Referential Integrity', color: '#c9933a', desc: 'Ensures pointers link to existing tuples in referenced tables' },
            { name: 'UNIQUE', role: 'Candidate Key Rule', color: '#86bc42', desc: 'Prevents duplicate emails, scientific names, or roles' },
            { name: 'NOT NULL', role: 'Completeness', color: 'var(--text-primary)', desc: 'Forbids missing attributes on required domain fields' },
            { name: 'CHECK', role: 'Domain Logic', color: '#4a9abf', desc: 'Enforces values stay inside valid bounds (health_score 0-100)' },
            { name: 'DEFAULT', role: 'State Defaults', color: 'var(--sage)', desc: 'Auto-initializes created_at=NOW(), is_active=TRUE' }
          ].map(c => (
            <div key={c.name} className="card" style={{ background: 'var(--studio-panel)', borderColor: 'var(--studio-border)', padding: '14px' }}>
              <div style={{ fontSize: '11px', color: c.color, fontWeight: 700, textTransform: 'uppercase' }}>{c.role}</div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>{c.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{c.desc}</div>
            </div>
          ))}
        </div>

        {/* Interactive Playground Split */}
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px' }}>
          {/* Test Case Selector */}
          <div className="card" style={{ background: 'var(--studio-panel)', borderColor: 'var(--studio-border)', padding: '16px' }}>
            <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Controlled Violation Scenarios
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {TEST_CASES.map(tc => {
                const isSelected = activeTest.id === tc.id;
                return (
                  <button
                    key={tc.id}
                    onClick={() => { setActiveTest(tc); setExecutionResult(null); }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--error)' : 'transparent',
                      background: isSelected ? 'rgba(201, 74, 74, 0.15)' : 'rgba(0,0,0,0.2)',
                      color: isSelected ? 'var(--error)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', marginBottom: '2px' }}>
                      {tc.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      Table: {tc.table}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Execution & Error Visualization */}
          <div className="card" style={{ background: 'var(--studio-panel)', borderColor: 'var(--studio-border)', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Active Test Case</span>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {activeTest.name}
                </h3>
              </div>

              <button
                className="btn btn-danger"
                onClick={handleSimulate}
                disabled={executing}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 18px', fontWeight: 700 }}
              >
                {executing ? <RefreshCw size={15} className="animate-spin" /> : <Play size={15} />}
                <span>Execute Violating SQL</span>
              </button>
            </div>

            {/* SQL Block */}
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Attempted Statement:
              </span>
              <pre className="sql-display" style={{ margin: 0 }}>
                {activeTest.sql}
              </pre>
            </div>

            {/* Result Area */}
            {executionResult ? (
              <div
                style={{
                  background: 'rgba(201, 74, 74, 0.12)',
                  border: '1px solid rgba(201, 74, 74, 0.4)',
                  borderRadius: '12px',
                  padding: '20px',
                  animation: 'fade-in 0.25s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <XCircle size={22} style={{ color: 'var(--error)' }} />
                  <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--error)' }}>
                    ❌ Transaction Aborted by PostgreSQL Engine
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '10px', fontSize: '13px', lineHeight: 1.6 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Error Code:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--error)', fontWeight: 600 }}>{executionResult.type}</span>

                  <span style={{ color: 'var(--text-muted)' }}>Constraint:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{executionResult.constraint}</span>

                  <span style={{ color: 'var(--text-muted)' }}>Attempted Value:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: '#f2ea7e' }}>{executionResult.attempted}</span>

                  <span style={{ color: 'var(--text-muted)' }}>Engine Message:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{executionResult.message}</span>

                  <span style={{ color: 'var(--text-muted)' }}>Database Action:</span>
                  <span style={{ color: 'var(--green-primary)', fontWeight: 600 }}>{executionResult.action}</span>
                </div>
              </div>
            ) : (
              <div style={{ border: '2px dashed var(--border)', borderRadius: '12px', padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Terminal size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '13px' }}>
                  Click &ldquo;Execute Violating SQL&rdquo; to test PostgreSQL constraint enforcement.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
