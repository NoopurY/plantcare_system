'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, LogOut, ChevronDown } from 'lucide-react';
import Sidebar from './Sidebar';
import LoadingSpinner from './LoadingSpinner';

// Derive a readable page title from the current pathname
function getPageTitle(pathname) {
  const TITLE_MAP = {
    '/dashboard': 'Overview',
    '/plants': 'My Plants',
    '/care': 'Care Schedule',
    '/growth': 'Growth Tracking',
    '/health': 'Plant Health',
    '/reminders': 'Reminders',
    '/analytics': 'Analytics',
    '/chatbot': 'AI Assistant',
    '/dbms/overview': 'Database Overview',
    '/dbms/er': 'ER Explorer',
    '/dbms/tables': 'Tables',
    '/dbms/relational-model': 'Relational Model',
    '/dbms/normalization': 'Normalization',
    '/dbms/sql-lab': 'SQL Lab',
    '/dbms/constraints': 'Constraints',
    '/dbms/views': 'Views',
    '/dbms/functions': 'Functions',
    '/dbms/triggers': 'Triggers',
    '/dbms/transactions': 'Transactions',
    '/dbms/indexes': 'Indexes',
    '/dbms/query-performance': 'Query Performance',
    '/dbms/statistics': 'Statistics',
    '/dbms/audit': 'Audit Logs',
  };
  return TITLE_MAP[pathname] || pathname.split('/').filter(Boolean).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' › ') || 'Dashboard';
}

export default function AppShell({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifCount, setNotifCount] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);

  // Derive mode from pathname
  const mode = pathname.startsWith('/dbms') ? 'studio' : 'plantcare';
  const [sidebarMode, setSidebarMode] = useState(mode);

  // Sync sidebar mode with route changes
  useEffect(() => {
    setSidebarMode(pathname.startsWith('/dbms') ? 'studio' : 'plantcare');
  }, [pathname]);

  // Switching mode navigates to the appropriate landing page
  const handleSetMode = useCallback((newMode) => {
    setSidebarMode(newMode);
    if (newMode === 'studio') router.push('/dbms/overview');
    else router.push('/dashboard');
  }, [router]);

  // Auth check
  useEffect(() => {
    let cancelled = false;
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (!cancelled) {
          if (res.status === 401) {
            router.replace('/auth');
          } else {
            const data = await res.json();
            setUser(data.user || data);
          }
        }
      } catch {
        if (!cancelled) router.replace('/auth');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    checkAuth();
    return () => { cancelled = true; };
  }, [router]);

  // Fetch notification count
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function fetchNotifs() {
      try {
        const res = await fetch('/api/notifications?unread_only=true', { credentials: 'include' });
        if (!cancelled && res.ok) {
          const data = await res.json();
          setNotifCount(Array.isArray(data) ? data.length : (data.count ?? 0));
        }
      } catch { /* silent */ }
    }
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      router.replace('/auth');
    }
  };

  const isStudio = sidebarMode === 'studio';
  const bgColor = isStudio ? '#0a1520' : '#0d1a0c';
  const SIDEBAR_FULL = 240;
  const SIDEBAR_COLLAPSED = 64;

  // Read collapsed state to offset main content
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSidebarCollapsed(JSON.parse(localStorage.getItem('sidebar_collapsed') || 'false'));
    }
  }, []);

  const sidebarWidth = sidebarCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_FULL;

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: bgColor }}>
        <LoadingSpinner size="lg" label="Authenticating…" />
      </div>
    );
  }

  const avatarLetter = user?.email?.charAt(0).toUpperCase() || 'U';
  const pageTitle = getPageTitle(pathname);

  /* ── Styles ── */
  const shellStyle = {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: bgColor,
    transition: 'background-color 0.3s ease',
  };

  const mainWrapStyle = {
    flex: 1,
    marginLeft: `${sidebarWidth}px`,
    transition: 'margin-left 0.25s ease',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    minWidth: 0,
  };

  const headerStyle = {
    height: '60px',
    backgroundColor: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    position: 'sticky',
    top: 0,
    zIndex: 40,
    flexShrink: 0,
    gap: '12px',
  };

  const titleAreaStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1,
    minWidth: 0,
  };

  const pageTitleStyle = {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  };

  const studioPillStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '3px 10px',
    borderRadius: '999px',
    backgroundColor: 'rgba(74,154,191,0.15)',
    color: '#4a9abf',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.3px',
    border: '1px solid rgba(74,154,191,0.25)',
    flexShrink: 0,
  };

  const headerActionsStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexShrink: 0,
  };

  const notifBtnStyle = {
    position: 'relative',
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    border: '1px solid var(--border-subtle)',
    backgroundColor: 'transparent',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  };

  const notifBadgeStyle = {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    minWidth: '16px',
    height: '16px',
    padding: '0 4px',
    borderRadius: '999px',
    backgroundColor: '#e05252',
    color: '#fff',
    fontSize: '10px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  };

  const avatarStyle = {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: isStudio ? '#4a9abf' : 'var(--green-primary)',
    color: '#0d1a0c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '13px',
    flexShrink: 0,
  };

  const userEmailStyle = {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    maxWidth: '140px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const logoutBtnStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '7px',
    border: '1px solid var(--border-subtle)',
    backgroundColor: 'transparent',
    color: 'var(--text-muted)',
    fontSize: '12px',
    fontWeight: 500,
    cursor: loggingOut ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    opacity: loggingOut ? 0.6 : 1,
  };

  const contentStyle = {
    flex: 1,
    padding: '24px',
    overflowY: 'auto',
    minWidth: 0,
  };

  return (
    <div style={shellStyle}>
      {/* Sidebar */}
      <Sidebar
        mode={sidebarMode}
        setMode={handleSetMode}
        user={user}
      />

      {/* Main area */}
      <div style={mainWrapStyle}>
        {/* Top header */}
        <header style={headerStyle}>
          <div style={titleAreaStyle}>
            <h1 style={pageTitleStyle}>{pageTitle}</h1>
            {isStudio && (
              <span style={studioPillStyle}>
                🗄 DBMS Studio
              </span>
            )}
          </div>

          <div style={headerActionsStyle}>
            {/* Notification bell */}
            <button style={notifBtnStyle} title="Notifications" aria-label="Notifications">
              <Bell size={16} />
              {notifCount > 0 && (
                <span style={notifBadgeStyle}>
                  {notifCount > 99 ? '99+' : notifCount}
                </span>
              )}
            </button>

            {/* User info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={avatarStyle}>{avatarLetter}</div>
              <span style={userEmailStyle}>{user?.email}</span>
            </div>

            {/* Logout */}
            <button
              style={logoutBtnStyle}
              onClick={handleLogout}
              disabled={loggingOut}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(224,82,82,0.1)';
                e.currentTarget.style.color = '#e05252';
                e.currentTarget.style.borderColor = 'rgba(224,82,82,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-muted)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
            >
              <LogOut size={13} />
              {loggingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main style={contentStyle}>
          {children}
        </main>
      </div>
    </div>
  );
}
