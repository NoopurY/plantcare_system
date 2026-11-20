import Link from 'next/link';

export const metadata = {
  title: 'VerdeBase — Botanical Intelligence. Database Clarity.',
  description: 'A plant management system with a built-in PostgreSQL database visualization studio.',
};

const FEATURES = [
  { icon: '🐘', label: 'Real PostgreSQL', desc: 'Live raw pg queries — no ORM abstraction' },
  { icon: '🔗', label: 'Live ER Diagrams', desc: 'Auto-generated entity relationship maps' },
  { icon: '⚗️', label: 'SQL Lab',          desc: 'Run raw queries against the live database' },
  { icon: '⚡', label: 'Trigger Visualizer', desc: 'Inspect and trace database triggers' },
  { icon: '📐', label: 'Normalization Demo', desc: '1NF → BCNF with real schema examples' },
  { icon: '📈', label: 'Query Analyzer',   desc: 'EXPLAIN ANALYZE with visual plan output' },
];

export default function LandingPage() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0d1a0c',
      color: '#e8f0e2',
      fontFamily: 'var(--font-sans, system-ui, sans-serif)',
    }}>
      {/* ── Nav ── */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(13,26,12,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(134,188,66,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        height: '64px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🌿</span>
          <span style={{ fontWeight: 800, fontSize: '20px', color: '#86bc42', letterSpacing: '0.5px' }}>VerdeBase</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link href="/auth" style={{
            padding: '8px 18px',
            borderRadius: '8px',
            border: '1px solid rgba(134,188,66,0.3)',
            color: '#86bc42',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 600,
            transition: 'all 0.2s',
          }}>
            Sign In
          </Link>
          <Link href="/auth" style={{
            padding: '8px 18px',
            borderRadius: '8px',
            backgroundColor: '#86bc42',
            color: '#0d1a0c',
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: 700,
          }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '100px 40px 80px',
        textAlign: 'center',
      }}>
        {/* Tag */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '999px',
          backgroundColor: 'rgba(134,188,66,0.1)',
          border: '1px solid rgba(134,188,66,0.2)',
          marginBottom: '32px',
          fontSize: '13px',
          color: '#86bc42',
          fontWeight: 600,
          letterSpacing: '0.3px',
        }}>
          <span>🌱</span> Plant Management + Database Visualization Studio
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 64px)',
          fontWeight: 800,
          lineHeight: 1.1,
          marginBottom: '24px',
          letterSpacing: '-1.5px',
          background: 'linear-gradient(135deg, #e8f0e2 30%, #86bc42 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Botanical Intelligence.<br />Database Clarity.
        </h1>

        <p style={{
          fontSize: '18px',
          color: 'rgba(232,240,226,0.65)',
          lineHeight: 1.7,
          maxWidth: '640px',
          margin: '0 auto 44px',
        }}>
          VerdeBase is a full-stack plant care management system powered by a real PostgreSQL database,
          with a built-in studio to explore schemas, run SQL, visualize triggers, and understand every
          layer of your data — live.
        </p>

        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth" style={{
            padding: '14px 32px',
            borderRadius: '10px',
            backgroundColor: '#86bc42',
            color: '#0d1a0c',
            textDecoration: 'none',
            fontSize: '15px',
            fontWeight: 700,
            letterSpacing: '0.2px',
            boxShadow: '0 0 40px rgba(134,188,66,0.25)',
          }}>
            🌱 Start with PlantCare
          </Link>
          <Link href="/auth" style={{
            padding: '14px 32px',
            borderRadius: '10px',
            backgroundColor: 'rgba(74,154,191,0.15)',
            border: '1px solid rgba(74,154,191,0.3)',
            color: '#4a9abf',
            textDecoration: 'none',
            fontSize: '15px',
            fontWeight: 700,
          }}>
            🗄 Open DBMS Studio
          </Link>
        </div>
      </section>

      {/* ── Feature cards ── */}
      <section style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '0 40px 80px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px',
      }}>
        {/* PlantCare card */}
        <div style={{
          backgroundColor: 'rgba(134,188,66,0.06)',
          border: '1px solid rgba(134,188,66,0.2)',
          borderRadius: '16px',
          padding: '32px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: '#86bc42', borderRadius: '16px 16px 0 0' }} />
          <div style={{ fontSize: '36px', marginBottom: '16px' }}>🌱</div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#86bc42', marginBottom: '10px' }}>
            PlantCare Application
          </h2>
          <p style={{ color: 'rgba(232,240,226,0.65)', lineHeight: 1.7, fontSize: '14px', marginBottom: '20px' }}>
            Track every plant in your collection. Log watering, fertilizing, and repotting schedules.
            Monitor growth milestones, health status, and get AI-powered care recommendations.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {['🪴 Plant collection management', '💧 Care & watering tracking', '📈 Growth timeline', '🤖 AI care assistant'].map(item => (
              <li key={item} style={{ fontSize: '13px', color: 'rgba(232,240,226,0.75)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* DBMS Studio card */}
        <div style={{
          backgroundColor: 'rgba(74,154,191,0.06)',
          border: '1px solid rgba(74,154,191,0.2)',
          borderRadius: '16px',
          padding: '32px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: '#4a9abf', borderRadius: '16px 16px 0 0' }} />
          <div style={{ fontSize: '36px', marginBottom: '16px' }}>🗄</div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#4a9abf', marginBottom: '10px' }}>
            DBMS Studio
          </h2>
          <p style={{ color: 'rgba(232,240,226,0.65)', lineHeight: 1.7, fontSize: '14px', marginBottom: '20px' }}>
            Explore the real PostgreSQL database powering VerdeBase. Visualize schemas, write SQL,
            inspect triggers, analyze query plans, and study normalization with live data.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {['🔗 Interactive ER diagrams', '⚗️ Live SQL Lab', '⚡ Trigger inspector', '📐 Normalization visualizer'].map(item => (
              <li key={item} style={{ fontSize: '13px', color: 'rgba(232,240,226,0.75)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Feature highlights ── */}
      <section style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '0 40px 80px',
        textAlign: 'center',
      }}>
        <h2 style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(232,240,226,0.4)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '24px' }}>
          Feature Highlights
        </h2>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          justifyContent: 'center',
          marginBottom: '60px',
        }}>
          {FEATURES.map(({ icon, label, desc }) => (
            <div
              key={label}
              title={desc}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '999px',
                backgroundColor: 'rgba(232,240,226,0.05)',
                border: '1px solid rgba(232,240,226,0.1)',
                fontSize: '13px',
                color: 'rgba(232,240,226,0.8)',
                fontWeight: 600,
                cursor: 'default',
                transition: 'all 0.2s',
              }}
            >
              <span>{icon}</span>
              {label}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          backgroundColor: 'rgba(134,188,66,0.06)',
          border: '1px solid rgba(134,188,66,0.15)',
          borderRadius: '20px',
          padding: '48px 40px',
        }}>
          <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '12px', color: '#e8f0e2' }}>
            Start exploring VerdeBase
          </h2>
          <p style={{ color: 'rgba(232,240,226,0.55)', marginBottom: '28px', fontSize: '15px' }}>
            Create a free account and experience plant management meets database education.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth" style={{
              padding: '12px 28px',
              borderRadius: '9px',
              backgroundColor: '#86bc42',
              color: '#0d1a0c',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 700,
            }}>
              Create Account
            </Link>
            <Link href="/auth" style={{
              padding: '12px 28px',
              borderRadius: '9px',
              border: '1px solid rgba(232,240,226,0.15)',
              color: 'rgba(232,240,226,0.7)',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 600,
            }}>
              Sign In →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid rgba(134,188,66,0.08)',
        padding: '24px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        maxWidth: '900px',
        margin: '0 auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🌿</span>
          <span style={{ fontWeight: 700, color: '#86bc42', fontSize: '14px' }}>VerdeBase</span>
        </div>
        <span style={{ fontSize: '12px', color: 'rgba(232,240,226,0.3)' }}>
          Built with Next.js · PostgreSQL · Tailwind CSS v4
        </span>
      </footer>
    </div>
  );
}
