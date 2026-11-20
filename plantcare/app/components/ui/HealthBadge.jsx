'use client';

const STATUS_CONFIG = {
  healthy: {
    label: 'Healthy',
    dot: '#4caf7d',
    bg: 'rgba(76,175,125,0.15)',
    color: '#4caf7d',
    cssClass: 'badge-healthy',
  },
  needs_attention: {
    label: 'Needs Attention',
    dot: '#f5a623',
    bg: 'rgba(245,166,35,0.15)',
    color: '#f5a623',
    cssClass: 'badge-attention',
  },
  critical: {
    label: 'Critical',
    dot: '#e05252',
    bg: 'rgba(224,82,82,0.15)',
    color: '#e05252',
    cssClass: 'badge-critical',
  },
  recovering: {
    label: 'Recovering',
    dot: '#4a9abf',
    bg: 'rgba(74,154,191,0.15)',
    color: '#4a9abf',
    cssClass: 'badge-recovering',
  },
};

export default function HealthBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.healthy;

  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '3px 10px 3px 8px',
    borderRadius: '999px',
    backgroundColor: config.bg,
    color: config.color,
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.2px',
  };

  const dotStyle = {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: config.dot,
    flexShrink: 0,
    boxShadow: `0 0 4px ${config.dot}88`,
  };

  return (
    <span style={badgeStyle} className={config.cssClass}>
      <span style={dotStyle} />
      {config.label}
    </span>
  );
}
