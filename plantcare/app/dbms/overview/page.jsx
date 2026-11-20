'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/app/components/ui/AppShell';
import {
  Database, Table2, Eye, Zap, Bell, BarChart2, HardDrive,
  Users, Leaf, BookOpen, Search, Activity, Code2, GitBranch,
  RefreshCw, ShieldCheck, Network, Layers
} from 'lucide-react';

/* ── Concept map data ── */
const CONCEPTS = [
  { feature: 'User Management',    concept: 'Entity + Primary Key',          icon: Users,      color: '#8b5cf6' },
  { feature: 'Plant Ownership',    concept: 'Foreign Key + Referential Integrity', icon: Leaf, color: '#22c55e' },
  { feature: 'Species Database',   concept: '3NF Normalization',             icon: BookOpen,   color: '#3b82f6' },
  { feature: 'Plant Search',       concept: 'Index Optimization',            icon: Search,     color: '#f59e0b' },
  { feature: 'Health Summary',     concept: 'Database View',                 icon: Eye,        color: '#06b6d4' },
  { feature: 'Health Calculation', concept: 'Stored Function',               icon: Code2,      color: '#ec4899' },
  { feature: 'Auto Notifications', concept: 'Database Trigger',              icon: Bell,       color: '#f97316' },
  { feature: 'Care Updates',       concept: 'ACID Transaction',              icon: RefreshCw,  color: '#14b8a6' },
  { feature: 'Dashboard Metrics',  concept: 'Aggregation Queries',           icon: BarChart2,  color: '#84cc16' },
  { feature: 'Data Validation',    concept: 'CHECK Constraints',             icon: ShieldCheck,color: '#ef4444' },
  { feature: 'Database Structure', concept: 'ER Model',                      icon: Network,    color: '#a78bfa' },
];

const STAT_CONFIG = [
  { key: 'tableCount',    label: 'Tables',        icon: Table2,    color: '#4a9abf' },
  { key: 'viewCount',     label: 'Views',         icon: Eye,       color: '#8b5cf6' },
  { key: 'functionCount', label: 'Functions',     icon: Code2,     color: '#22c55e' },
  { key: 'triggerCount',  label: 'Triggers',      icon: Zap,       color: '#f59e0b' },
  { key: 'indexCount',    label: 'Indexes',       icon: Layers,    color: '#ec4899' },
  { key: 'dbSize',        label: 'Database Size', icon: HardDrive, color: '#06b6d4' },
];

export default function DatabaseOverviewPage() {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  useEffect(() => {
    fetch('/api/db/statistics', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const S = {
    page: { fontFamily: 'var(--font-sans)' },
    header: {
      display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px',
    },
    h1: {
      fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0,
    },
    pgBadge: {
      padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: 700,
      background: 'rgba(74,154,191,0.15)', color: '#4a9abf',
      border: '1px solid rgba(74,154,191,0.3)', letterSpacing: '0.05em',
    },
    statsGrid: {
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
      gap: '14px', marginBottom: '32px',
    },
    statCard: (color) => ({
      background: 'var(--studio-card)', border: '1px solid var(--studio-border)',
      borderRadius: '12px', padding: '18px 20px',
      borderTop: `3px solid ${color}`,
      display: 'flex', flexDirection: 'column', gap: '8px',
    }),
    statIcon: (color) => ({
      width: '32px', height: '32px', borderRadius: '8px',
      background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }),
    statValue: {
      fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1,
    },
    statLabel: {
      fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em',
    },
    sectionTitle: {
      fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)',
      marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px',
    },
    tableWrap: {
      background: 'var(--studio-card)', border: '1px solid var(--studio-border)',
      borderRadius: '12px', overflow: 'hidden', marginBottom: '32px',
    },
    th: {
      padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600,
      color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em',
      borderBottom: '1px solid var(--studio-border)',
      background: 'rgba(74,154,191,0.06)',
    },
    td: {
      padding: '12px 16px', fontSize: '13px', color: 'var(--text-secondary)',
      borderBottom: '1px solid rgba(74,154,191,0.07)',
    },
    tdName: {
      padding: '12px 16px', fontSize: '13px', color: '#4a9abf',
      fontFamily: 'var(--font-mono)', fontWeight: 600,
      borderBottom: '1px solid rgba(74,154,191,0.07)',
    },
    conceptGrid: {
      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '12px',
    },
    conceptCard: (color) => ({
      background: 'var(--studio-card)', border: `1px solid ${color}33`,
      borderRadius: '10px', padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: '6px',
      transition: 'transform 0.15s, box-shadow 0.15s',
    }),
    conceptFeature: (color) => ({
      fontSize: '13px', fontWeight: 600, color,
    }),
    conceptDivider: (color) => ({
      width: '24px', height: '2px', background: `${color}55`, borderRadius: '2px',
    }),
    conceptLabel: {
      fontSize: '12px', color: 'var(--text-muted)',
    },
    errorBox: {
      padding: '16px', background: 'rgba(201,74,74,0.1)', border: '1px solid rgba(201,74,74,0.25)',
      borderRadius: '10px', color: '#c94a4a', fontSize: '13px',
    },
    skeleton: {
      background: 'linear-gradient(90deg, var(--studio-card) 25%, rgba(74,154,191,0.05) 50%, var(--studio-card) 75%)',
      backgroundSize: '200% 100%', animation: 'skeleton-shimmer 1.5s infinite',
      borderRadius: '12px', height: '90px',
    },
  };

  return (
    <AppShell>
      <div style={S.page}>
        {/* Header */}
        <div style={S.header}>
          <Database size={28} color="#4a9abf" />
          <h1 style={S.h1}>VerdeBase Database Overview</h1>
          <span style={S.pgBadge}>PostgreSQL</span>
        </div>

        {/* Stat Cards */}
        {loading ? (
          <div style={S.statsGrid}>
            {STAT_CONFIG.map(s => <div key={s.key} style={S.skeleton} />)}
          </div>
        ) : error ? (
          <div style={S.errorBox}>⚠ Failed to load statistics: {error}</div>
        ) : (
          <div style={S.statsGrid}>
            {STAT_CONFIG.map(({ key, label, icon: Icon, color }) => (
              <div key={key} style={S.statCard(color)}>
                <div style={S.statIcon(color)}>
                  <Icon size={16} color={color} />
                </div>
                <div style={S.statValue}>{stats?.[key] ?? '—'}</div>
                <div style={S.statLabel}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Per-Table Statistics */}
        <div style={S.sectionTitle}>
          <Table2 size={16} color="#4a9abf" />
          Per-Table Statistics
        </div>
        <div style={S.tableWrap}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Table Name', 'Estimated Rows', 'Total Size', 'Index Count'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ ...S.td, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</td></tr>
              ) : error ? (
                <tr><td colSpan={4} style={{ ...S.td, textAlign: 'center', color: '#c94a4a' }}>Failed to load</td></tr>
              ) : (stats?.tables || []).length === 0 ? (
                <tr><td colSpan={4} style={{ ...S.td, textAlign: 'center', color: 'var(--text-muted)' }}>No table data</td></tr>
              ) : (
                (stats?.tables || []).map((t, i) => (
                  <tr key={i} onMouseEnter={e => e.currentTarget.querySelectorAll('td').forEach(td => td.style.background = 'rgba(74,154,191,0.05)')}
                      onMouseLeave={e => e.currentTarget.querySelectorAll('td').forEach(td => td.style.background = 'transparent')}>
                    <td style={S.tdName}>{t.table_name}</td>
                    <td style={S.td}>{Number(t.row_count || 0).toLocaleString()}</td>
                    <td style={S.td}>{t.total_size || '—'}</td>
                    <td style={S.td}>{t.index_count ?? 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* DBMS Concept Map */}
        <div style={S.sectionTitle}>
          <Network size={16} color="#4a9abf" />
          DBMS Concept Map
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          How every PlantCare feature maps to a core database concept.
        </p>
        <div style={S.conceptGrid}>
          {CONCEPTS.map(({ feature, concept, icon: Icon, color }) => (
            <div key={feature} style={S.conceptCard(color)}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 6px 24px ${color}22`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ ...S.statIcon(color), width: '26px', height: '26px', borderRadius: '6px' }}>
                  <Icon size={13} color={color} />
                </div>
                <span style={S.conceptFeature(color)}>{feature}</span>
              </div>
              <div style={S.conceptDivider(color)} />
              <span style={S.conceptLabel}>{concept}</span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
