'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Leaf, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();

  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register fields
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  // Check if already logged in
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) window.location.href = '/dashboard';
      } catch { /* not authenticated */ }
      finally { setChecking(false); }
    }
    checkSession();
  }, [router]);

  const resetErrors = () => { setError(''); setSuccess(''); };

  const handleLogin = async (e) => {
    e.preventDefault();
    resetErrors();
    if (!loginEmail.trim() || !loginPassword) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.message || 'Login failed. Check your credentials.');
      } else {
        setSuccess('Signed in! Redirecting…');
        window.location.href = '/dashboard';
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    resetErrors();
    if (!fullName.trim() || !regEmail.trim() || !regPassword || !confirmPw) {
      setError('Please fill in all fields.');
      return;
    }
    if (regPassword !== confirmPw) {
      setError('Passwords do not match.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ full_name: fullName.trim(), email: regEmail.trim(), password: regPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.message || 'Registration failed.');
      } else {
        setSuccess('Account created! Redirecting…');
        window.location.href = '/dashboard';
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Styles ── */
  const pageStyle = {
    minHeight: '100vh',
    backgroundColor: '#0d1a0c',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: 'var(--font-sans, system-ui, sans-serif)',
  };

  const cardStyle = {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(134,188,66,0.15)',
    borderRadius: '20px',
    padding: '40px 36px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
  };

  const logoStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '32px',
  };

  const tabRowStyle = {
    display: 'flex',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: '10px',
    padding: '4px',
    marginBottom: '28px',
    gap: '4px',
  };

  const getTabStyle = (t) => ({
    flex: 1,
    padding: '9px',
    borderRadius: '7px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 700,
    transition: 'all 0.18s ease',
    backgroundColor: tab === t ? '#86bc42' : 'transparent',
    color: tab === t ? '#0d1a0c' : 'rgba(232,240,226,0.5)',
  });

  const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: 600,
    color: 'rgba(232,240,226,0.55)',
    marginBottom: '6px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  };

  const inputStyle = {
    width: '100%',
    padding: '11px 14px',
    borderRadius: '9px',
    border: '1px solid rgba(134,188,66,0.2)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    color: '#e8f0e2',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
    fontFamily: 'inherit',
  };

  const pwWrapStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  };

  const eyeBtnStyle = {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'rgba(232,240,226,0.35)',
    display: 'flex',
    alignItems: 'center',
    padding: 0,
  };

  const submitBtnStyle = {
    width: '100%',
    padding: '13px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: loading ? 'rgba(134,188,66,0.5)' : '#86bc42',
    color: '#0d1a0c',
    fontSize: '15px',
    fontWeight: 700,
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s',
    marginTop: '8px',
    letterSpacing: '0.2px',
  };

  const alertStyle = (isError) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    borderRadius: '9px',
    backgroundColor: isError ? 'rgba(224,82,82,0.12)' : 'rgba(76,175,125,0.12)',
    border: `1px solid ${isError ? 'rgba(224,82,82,0.25)' : 'rgba(76,175,125,0.25)'}`,
    color: isError ? '#e05252' : '#4caf7d',
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: '16px',
  });

  if (checking) {
    return (
      <div style={pageStyle}>
        <div style={{ color: '#86bc42', fontSize: '24px', animation: 'spin 1s linear infinite' }}>🌿</div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {/* Back to home */}
      <Link href="/" style={{ marginBottom: '24px', color: 'rgba(232,240,226,0.4)', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
        ← Back to VerdeBase
      </Link>

      <div style={cardStyle}>
        {/* Logo */}
        <div style={logoStyle}>
          <span style={{ fontSize: '28px' }}>🌿</span>
          <span style={{ fontWeight: 800, fontSize: '22px', color: '#86bc42', letterSpacing: '0.5px' }}>VerdeBase</span>
        </div>

        {/* Tab switcher */}
        <div style={tabRowStyle}>
          <button style={getTabStyle('login')} onClick={() => { setTab('login'); resetErrors(); }}>
            Sign In
          </button>
          <button style={getTabStyle('register')} onClick={() => { setTab('register'); resetErrors(); }}>
            Register
          </button>
        </div>

        {/* Alert messages */}
        {error && (
          <div style={alertStyle(true)}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}
        {success && (
          <div style={alertStyle(false)}>
            <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
            {success}
          </div>
        )}

        {/* LOGIN FORM */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle} htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                style={inputStyle}
                placeholder="you@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                autoComplete="email"
                required
                onFocus={(e) => { e.target.style.borderColor = '#86bc42'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(134,188,66,0.2)'; }}
              />
            </div>
            <div>
              <label style={labelStyle} htmlFor="login-password">Password</label>
              <div style={pwWrapStyle}>
                <input
                  id="login-password"
                  type={showPw ? 'text' : 'password'}
                  style={{ ...inputStyle, paddingRight: '44px' }}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  onFocus={(e) => { e.target.style.borderColor = '#86bc42'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(134,188,66,0.2)'; }}
                />
                <button type="button" style={eyeBtnStyle} onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" style={submitBtnStyle} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelStyle} htmlFor="reg-name">Full Name</label>
              <input
                id="reg-name"
                type="text"
                style={inputStyle}
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                required
                onFocus={(e) => { e.target.style.borderColor = '#86bc42'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(134,188,66,0.2)'; }}
              />
            </div>
            <div>
              <label style={labelStyle} htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                type="email"
                style={inputStyle}
                placeholder="you@example.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                autoComplete="email"
                required
                onFocus={(e) => { e.target.style.borderColor = '#86bc42'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(134,188,66,0.2)'; }}
              />
            </div>
            <div>
              <label style={labelStyle} htmlFor="reg-password">Password</label>
              <div style={pwWrapStyle}>
                <input
                  id="reg-password"
                  type={showPw ? 'text' : 'password'}
                  style={{ ...inputStyle, paddingRight: '44px' }}
                  placeholder="Min. 6 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  onFocus={(e) => { e.target.style.borderColor = '#86bc42'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(134,188,66,0.2)'; }}
                />
                <button type="button" style={eyeBtnStyle} onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label style={labelStyle} htmlFor="reg-confirm">Confirm Password</label>
              <div style={pwWrapStyle}>
                <input
                  id="reg-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  style={{
                    ...inputStyle,
                    paddingRight: '44px',
                    borderColor: confirmPw && regPassword && confirmPw !== regPassword ? '#e05252' : 'rgba(134,188,66,0.2)',
                  }}
                  placeholder="Repeat password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  autoComplete="new-password"
                  required
                  onFocus={(e) => { e.target.style.borderColor = '#86bc42'; }}
                  onBlur={(e) => {
                    e.target.style.borderColor = confirmPw !== regPassword ? '#e05252' : 'rgba(134,188,66,0.2)';
                  }}
                />
                <button type="button" style={eyeBtnStyle} onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPw && regPassword && confirmPw !== regPassword && (
                <p style={{ fontSize: '11px', color: '#e05252', marginTop: '4px' }}>Passwords do not match</p>
              )}
            </div>
            <button type="submit" style={submitBtnStyle} disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'rgba(232,240,226,0.3)' }}>
          {tab === 'login'
            ? <>No account? <button onClick={() => { setTab('register'); resetErrors(); }} style={{ background: 'none', border: 'none', color: '#86bc42', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Register</button></>
            : <>Already have one? <button onClick={() => { setTab('login'); resetErrors(); }} style={{ background: 'none', border: 'none', color: '#86bc42', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>Sign In</button></>
          }
        </p>
      </div>
    </div>
  );
}
