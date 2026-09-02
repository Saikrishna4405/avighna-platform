import React from 'react';

export const StatCard = ({ title, value, icon: Icon, color = '#3b82f6', subtitle }) => {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <span>{title}</span>
        {Icon && <Icon size={18} style={{ color }} />}
      </div>
      <div className="stat-value" style={{ color }}>{value}</div>
      {subtitle && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>{subtitle}</div>}
    </div>
  );
};
