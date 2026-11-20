// app/dbms/demo/page.jsx - Special Professor / Viva Demonstration Mode
'use client';
import { useState } from 'react';
import Link from 'next/link';
import AppShell from '@/app/components/ui/AppShell';
import {
  Sparkles, CheckCircle2, ArrowRight, Play, Terminal,
  ExternalLink, Layers, GitFork, Shield, Eye, Zap,
  Cpu, Search, Activity, BarChart2, Database, Table2
} from 'lucide-react';

const DEMO_MODULES = [
  {
    num: 1,
    title: 'Interactive ER Diagram',
    category: 'Conceptual Modeling',
    desc: 'Visual entity-relationship diagram with 14 entities, cardinalities (1:N, 1:1), and foreign key reference lines.',
    href: '/dbms/er',
    icon: GitFork,
    color: '#86bc42',
    actionText: 'Inspect ER Explorer'
  },
  {
    num: 2,
    title: 'Database Table Explorer',
    category: 'Physical Schema',
    desc: 'Live table inspector reading row counts, column types, and sample data directly from PostgreSQL system catalogs.',
    href: '/dbms/tables',
    icon: Table2,
    color: '#4a9abf',
    actionText: 'Explore Tables'
  },
  {
    num: 3,
    title: 'Relational Model Schema',
    category: 'Relational Theory',
    desc: 'Formal relational calculus notation R(A1, A2...) displaying primary keys, foreign constraints, and nullability flags.',
    href: '/dbms/relational-model',
    icon: Database,
    color: '#c9933a',
    actionText: 'View Relational Model'
  },
  {
    num: 4,
    title: 'Normalization (UNF -> 3NF)',
    category: 'Decomposition Theory',
    desc: 'Interactive step-by-step walkthrough explaining functional dependencies and elimination of update/delete anomalies.',
    href: '/dbms/normalization',
    icon: Layers,
    color: '#f2ea7e',
    actionText: 'Launch Normalizer'
  },
  {
    num: 5,
    title: 'Interactive SQL Lab',
    category: 'Query Formulation',
    desc: 'Execute real SELECT and aggregate queries against PostgreSQL with instant execution time and row telemetry.',
    href: '/dbms/sql-lab',
    icon: Terminal,
    color: 'var(--green-primary)',
    actionText: 'Open SQL Lab'
  },
  {
    num: 6,
    title: 'Constraint Enforcement Playground',
    category: 'Data Integrity',
    desc: 'Test engine-level rejection of CHECK (health_score 0-100), UNIQUE (email), and FOREIGN KEY violations.',
    href: '/dbms/constraints',
    icon: Shield,
    color: 'var(--error)',
    actionText: 'Test Violations'
  },
  {
    num: 7,
    title: 'Event-Driven Database Triggers',
    category: 'Database Automation',
    desc: 'Simulate cascading event flow: AFTER INSERT on watering_logs auto-recalculates plant health and logs audit tuples.',
    href: '/dbms/triggers',
    icon: Zap,
    color: 'var(--amber)',
    actionText: 'Simulate Triggers'
  },
  {
    num: 8,
    title: 'ACID Transaction Simulator',
    category: 'Concurrency & Recovery',
    desc: 'Visual timeline demonstrating multi-statement atomic transactions: successful COMMIT vs constraint ROLLBACK.',
    href: '/dbms/transactions',
    icon: Play,
    color: '#a0cde0',
    actionText: 'Run Transaction Demo'
  },
  {
    num: 9,
    title: 'PostgreSQL View Explorer',
    category: 'Virtual Relations',
    desc: 'Demonstrate plant_health_summary and plant_care_summary views computing virtual results without duplicating storage.',
    href: '/dbms/views',
    icon: Eye,
    color: '#4a9abf',
    actionText: 'Query Views'
  },
  {
    num: 10,
    title: 'PL/pgSQL Stored Functions',
    category: 'Database Procedures',
    desc: 'Execute stored business algorithms: calculate_plant_health_score() and calculate_next_watering_date().',
    href: '/dbms/functions',
    icon: Cpu,
    color: 'var(--green-primary)',
    actionText: 'Call Functions'
  },
  {
    num: 11,
    title: 'B-Tree Index Performance',
    category: 'Physical Optimization',
    desc: 'Inspect 20+ B-Tree indexes and compare O(N) sequential scans against O(log N) index lookups.',
    href: '/dbms/indexes',
    icon: Search,
    color: '#c9933a',
    actionText: 'Inspect Indexes'
  },
  {
    num: 12,
    title: 'EXPLAIN ANALYZE Performance Tree',
    category: 'Query Optimization',
    desc: 'Inspect cost optimizer execution trees (Hash Join, Seq Scan, Index Scan) with live timing profiling.',
    href: '/dbms/query-performance',
    icon: Activity,
    color: 'var(--green-primary)',
    actionText: 'Analyze Cost Plans'
  }
];

export default function DemoPage() {
  return (
    <AppShell>
      <div style={{ padding: '28px', maxWidth: '1380px', margin: '0 auto' }}>
        {/* Banner */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(135deg, rgba(74,154,191,0.2) 0%, rgba(134,188,66,0.15) 100%)',
            borderColor: 'var(--studio-border)',
            padding: '32px',
            marginBottom: '32px',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ background: '#4a9abf', color: '#000', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>
              Academic Evaluation Suite
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              &bull; 12 Evaluated DBMS Curriculum Milestones
            </span>
          </div>

          <h1 style={{ fontSize: '32px', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 10px' }}>
            DBMS Concepts Demonstration Console
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '820px', lineHeight: 1.6, margin: 0 }}>
            Welcome to the VerdeBase demonstration environment. This console allows evaluators to systematically verify each database engineering concept implemented in the live PostgreSQL instance. Click any module below to inspect the actual database mechanism.
          </p>
        </div>

        {/* 12 Concept Demonstration Modules */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {DEMO_MODULES.map(m => (
            <div
              key={m.num}
              className="card"
              style={{
                background: 'var(--studio-panel)',
                borderColor: 'var(--studio-border)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'transform 0.2s, border-color 0.2s'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 800, color: m.color, background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '4px' }}>
                    CONCEPT #{m.num}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                    {m.category}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <m.icon size={20} style={{ color: m.color }} />
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {m.title}
                  </h3>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '8px 0 16px' }}>
                  {m.desc}
                </p>
              </div>

              <Link
                href={m.href}
                className="btn btn-ghost"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  borderColor: 'var(--border)',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: m.color,
                  textDecoration: 'none'
                }}
              >
                <span>{m.actionText}</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
