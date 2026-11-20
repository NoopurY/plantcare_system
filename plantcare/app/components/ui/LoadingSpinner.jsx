'use client';

const SIZE_MAP = {
  sm: { spinner: 20, border: 2, font: 12 },
  md: { spinner: 36, border: 3, font: 14 },
  lg: { spinner: 56, border: 4, font: 16 },
};

export default function LoadingSpinner({ size = 'md', label }) {
  const { spinner, border, font } = SIZE_MAP[size] || SIZE_MAP.md;

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
  };

  const spinnerStyle = {
    width: `${spinner}px`,
    height: `${spinner}px`,
    borderRadius: '50%',
    border: `${border}px solid rgba(134,188,66,0.2)`,
    borderTopColor: 'var(--green-primary)',
    animation: 'verde-spin 0.75s linear infinite',
  };

  return (
    <>
      <style>{`
        @keyframes verde-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={containerStyle}>
        <div style={spinnerStyle} />
        {label && (
          <span style={{ color: 'var(--text-muted)', fontSize: `${font}px`, fontWeight: 500 }}>
            {label}
          </span>
        )}
      </div>
    </>
  );
}
