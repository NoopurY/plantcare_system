'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Leaf, Database, LayoutDashboard, Sprout, Droplets, TreePine,
  Heart, Bell, BarChart2, Bot, Table2, Network, Layers,
  FlaskConical, Zap, GitFork, Activity, Search, Shield,
  FolderSearch, ChevronLeft, ChevronRight, Play
} from 'lucide-react';

const PLANTCARE_NAV = [
  { label: 'Overview',     href: '/dashboard',  icon: LayoutDashboard },
  { label: 'My Plants',    href: '/plants',     icon: Leaf },
  { label: 'Species',      href: '/species',    icon: TreePine },
  { label: 'Care',         href: '/care',       icon: Droplets },
  { label: 'Growth',       href: '/growth',     icon: Sprout },
  { label: 'Health',       href: '/health',     icon: Heart },
  { label: 'Reminders',    href: '/reminders',  icon: Bell },
  { label: 'Analytics',    href: '/analytics',  icon: BarChart2 },
  { label: 'AI Assistant', href: '/chatbot',    icon: Bot },
];

const STUDIO_NAV = [
  { label: 'Demo Mode (Viva)',   href: '/dbms/demo',               icon: Play },
  { label: 'Database Overview',  href: '/dbms/overview',           icon: Database },
  { label: 'ER Explorer',        href: '/dbms/er',                 icon: GitFork },
  { label: 'Tables',             href: '/dbms/tables',             icon: Table2 },
  { label: 'Relational Model',   href: '/dbms/relational-model',   icon: Network },
  { label: 'Normalization',      href: '/dbms/normalization',      icon: Layers },
  { label: 'SQL Lab',            href: '/dbms/sql-lab',            icon: FlaskConical },
  { label: 'Constraints',        href: '/dbms/constraints',        icon: Shield },
  { label: 'Views',              href: '/dbms/views',              icon: FolderSearch },
  { label: 'Functions',          href: '/dbms/functions',          icon: Zap },
  { label: 'Triggers',           href: '/dbms/triggers',           icon: Activity },
  { label: 'Transactions',       href: '/dbms/transactions',       icon: GitFork },
  { label: 'Indexes',            href: '/dbms/indexes',            icon: Search },
  { label: 'Query Performance',  href: '/dbms/query-performance',  icon: BarChart2 },
  { label: 'Statistics',         href: '/dbms/statistics',         icon: Activity },
  { label: 'Audit Logs',         href: '/dbms/audit',              icon: Shield },
];

export default function Sidebar({ mode, setMode, user }) {
  const pathname = usePathname();

  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('sidebar_collapsed') || 'false');
    }
    return false;
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') localStorage.setItem('sidebar_collapsed', JSON.stringify(next));
      return next;
    });
  };

  const navItems = mode === 'studio' ? STUDIO_NAV : PLANTCARE_NAV;
  const width = isCollapsed ? 64 : 240;

  const sidebarStyle = {
    width: `${width}px`,
    minWidth: `${width}px`,
    height: '100vh',
    position: 'fixed',
    top: 0,
    left: 0,
    backgroundColor: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border-subtle)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.25s ease',
    zIndex: 50,
    overflowX: 'hidden',
  };

  const logoStyle = {
    padding: isCollapsed ? '20px 0' : '20px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: isCollapsed ? 'center' : 'space-between',
    borderBottom: '1px solid var(--border-subtle)',
    flexShrink: 0,
  };

  const modeSwitchContainerStyle = {
    padding: isCollapsed ? '12px 4px' : '12px 10px',
    display: 'flex',
    flexDirection: isCollapsed ? 'column' : 'row',
    gap: '4px',
    borderBottom: '1px solid var(--border-subtle)',
    flexShrink: 0,
  };

  const getModeButtonStyle = (m) => ({
    flex: isCollapsed ? 'none' : 1,
    padding: isCollapsed ? '8px 6px' : '6px 8px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: isCollapsed ? '16px' : '11px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    transition: 'all 0.2s ease',
    backgroundColor: mode === m
      ? (m === 'plantcare' ? 'var(--green-primary)' : '#4a9abf')
      : 'transparent',
    color: mode === m ? '#0d1a0c' : 'var(--text-muted)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  });

  const navScrollStyle = {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '8px 0',
    scrollbarWidth: 'thin',
    scrollbarColor: 'var(--border-subtle) transparent',
  };

  const getNavItemStyle = (href) => {
    const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
    return {
      display: 'flex',
      alignItems: 'center',
      gap: isCollapsed ? 0 : '10px',
      padding: isCollapsed ? '10px 0' : '9px 16px',
      justifyContent: isCollapsed ? 'center' : 'flex-start',
      marginBottom: '2px',
      borderRadius: '8px',
      margin: isCollapsed ? '2px 4px' : '2px 8px',
      cursor: 'pointer',
      textDecoration: 'none',
      fontSize: '13.5px',
      fontWeight: isActive ? 600 : 400,
      backgroundColor: isActive
        ? (mode === 'studio' ? 'rgba(74,154,191,0.15)' : 'rgba(134,188,66,0.15)')
        : 'transparent',
      color: isActive
        ? (mode === 'studio' ? '#4a9abf' : 'var(--green-primary)')
        : 'var(--text-secondary)',
      borderLeft: isActive
        ? `3px solid ${mode === 'studio' ? '#4a9abf' : 'var(--green-primary)'}`
        : '3px solid transparent',
      transition: 'all 0.15s ease',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
    };
  };

  const userSectionStyle = {
    padding: isCollapsed ? '12px 4px' : '12px 14px',
    borderTop: '1px solid var(--border-subtle)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexShrink: 0,
    overflow: 'hidden',
  };

  const avatarStyle = {
    width: '32px',
    height: '32px',
    minWidth: '32px',
    borderRadius: '50%',
    backgroundColor: 'var(--green-primary)',
    color: '#0d1a0c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '13px',
  };

  const collapseButtonStyle = {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '1px solid var(--border-subtle)',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
  };

  const userEmail = user?.email || 'user@example.com';
  const userRole = user?.role || 'viewer';
  const avatarLetter = userEmail.charAt(0).toUpperCase();

  return (
    <aside style={sidebarStyle}>
      {/* Logo + collapse toggle */}
      <div style={logoStyle}>
        {!isCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🌿</span>
            <span style={{ color: 'var(--green-primary)', fontWeight: 700, fontSize: '16px', letterSpacing: '0.5px' }}>
              VerdeBase
            </span>
          </div>
        )}
        {isCollapsed && <span style={{ fontSize: '20px' }}>🌿</span>}
        <button onClick={toggleCollapse} style={collapseButtonStyle} title={isCollapsed ? 'Expand' : 'Collapse'}>
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Mode toggle */}
      <div style={modeSwitchContainerStyle}>
        <button
          onClick={() => setMode('plantcare')}
          style={getModeButtonStyle('plantcare')}
          title="PlantCare"
        >
          <span>🌱</span>
          {!isCollapsed && <span>PlantCare</span>}
        </button>
        <button
          onClick={() => setMode('studio')}
          style={getModeButtonStyle('studio')}
          title="DBMS Studio"
        >
          <span>🗄</span>
          {!isCollapsed && <span>DBMS Studio</span>}
        </button>
      </div>

      {/* Nav section label */}
      {!isCollapsed && (
        <div style={{ padding: '10px 16px 4px', fontSize: '10px', fontWeight: 700, letterSpacing: '1.2px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          {mode === 'studio' ? 'Database Tools' : 'Plant Management'}
        </div>
      )}

      {/* Nav items */}
      <nav style={navScrollStyle}>
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href} style={getNavItemStyle(href)} title={isCollapsed ? label : undefined}>
            <Icon size={16} style={{ flexShrink: 0 }} />
            {!isCollapsed && <span>{label}</span>}
          </Link>
        ))}
      </nav>

      {/* User info */}
      <div style={userSectionStyle}>
        <div style={avatarStyle}>{avatarLetter}</div>
        {!isCollapsed && (
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userEmail}
            </div>
            <span style={{
              fontSize: '10px',
              padding: '1px 6px',
              borderRadius: '999px',
              backgroundColor: userRole === 'admin' ? 'rgba(134,188,66,0.2)' : 'rgba(255,255,255,0.08)',
              color: userRole === 'admin' ? 'var(--green-primary)' : 'var(--text-muted)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              {userRole}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
