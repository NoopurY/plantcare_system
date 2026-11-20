'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({ label, value, icon: Icon, trend, color, description }) {
  const accentColor = color || 'var(--green-primary)';

  const cardStyle = {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    position: 'relative',
    overflow: 'hidden',
    transition: 'border-color 0.2s ease, transform 0.2s ease',
    cursor: 'default',
  };

  const accentBarStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    backgroundColor: accentColor,
    borderRadius: '12px 12px 0 0',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const labelStyle = {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
  };

  const iconContainerStyle = {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: `${accentColor}20`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: accentColor,
  };

  const valueStyle = {
    fontSize: '32px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    lineHeight: 1.1,
    letterSpacing: '-0.5px',
  };

  const getTrendStyle = () => {
    if (!trend) return null;
    const isUp = trend.direction === 'up';
    const isDown = trend.direction === 'down';
    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '3px',
      fontSize: '12px',
      fontWeight: 600,
      color: isUp ? '#4caf7d' : isDown ? '#e05252' : 'var(--text-muted)',
      backgroundColor: isUp ? 'rgba(76,175,125,0.12)' : isDown ? 'rgba(224,82,82,0.12)' : 'rgba(255,255,255,0.05)',
      padding: '2px 8px',
      borderRadius: '999px',
    };
  };

  const TrendIcon = trend?.direction === 'up'
    ? TrendingUp
    : trend?.direction === 'down'
      ? TrendingDown
      : Minus;

  return (
    <div style={cardStyle} className="stat-card">
      <div style={accentBarStyle} />
      <div style={headerStyle}>
        <span style={labelStyle}>{label}</span>
        {Icon && (
          <div style={iconContainerStyle}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <div style={valueStyle}>{value ?? '—'}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
        {description && (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{description}</span>
        )}
        {trend && (
          <span style={getTrendStyle()}>
            <TrendIcon size={12} />
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
